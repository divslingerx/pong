import "./style.css";
import Ball from "./ball";
import Rect from "./rect";
import Player from "./player";
import { SoundEngine } from "./sound";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const enum GameState {
  Idle,
  Playing,
  Scored,
}

const WINNING_SCORE = 7;
const BALL_INITIAL_SPEED = 250;
const BALL_SPEED_INCREASE = 1.05;
const AI_SPEED = 300;
const SCORE_PAUSE_DURATION = 1.5;

class Pong {
  private ctx: CanvasRenderingContext2D;
  private ball: Ball;
  players: Player[];
  private state = GameState.Idle;
  private scorePauseTimer = 0;
  private readonly CHAR_PIXEL = 10;
  private readonly CHARS: HTMLCanvasElement[];
  private sound: SoundEngine;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.ball = new Ball();
    this.players = [new Player(), new Player()];
    this.CHARS = this.generateScoreCanvases();
    this.sound = new SoundEngine();

    this.positionPlayers();
    this.resetBall();
    this.startGameLoop();
  }

  private positionPlayers() {
    this.players[0].pos.x = 40;
    this.players[1].pos.x = this.canvas.width - 40;
    this.players.forEach((p) => (p.pos.y = this.canvas.height / 2));
  }

  private generateScoreCanvases(): HTMLCanvasElement[] {
    const digits = [
      "111101101101111",
      "010010010010010",
      "111001111100111",
      "111001111001111",
      "101101111001001",
      "111100111001111",
      "111100111101111",
      "111001001001001",
      "111101111101111",
      "111101111001111",
    ];
    return digits.map((d) => this.createDigitCanvas(d));
  }

  private createDigitCanvas(pattern: string): HTMLCanvasElement {
    const el = document.createElement("canvas");
    const size = this.CHAR_PIXEL;
    el.width = size * 3;
    el.height = size * 5;
    const ctx = el.getContext("2d")!;
    ctx.fillStyle = "#fff";

    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === "1") {
        ctx.fillRect((i % 3) * size, Math.floor(i / 3) * size, size, size);
      }
    }
    return el;
  }

  private startGameLoop() {
    let lastTime = 0;
    const tick = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (dt > 0 && dt < 0.1) this.update(dt);
      this.draw();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  private update(dt: number) {
    if (this.state === GameState.Scored) {
      this.scorePauseTimer -= dt;
      if (this.scorePauseTimer <= 0) {
        this.state = GameState.Playing;
        this.launchBall();
      }
      return;
    }

    if (this.state !== GameState.Playing) return;

    this.ball.pos.x += this.ball.vel.x * dt;
    this.ball.pos.y += this.ball.vel.y * dt;

    this.checkWallBounce();
    this.checkScoring();
    this.checkPaddleCollisions();
    this.updateAI(dt);
    this.clampPaddles();
  }

  private checkWallBounce() {
    if (this.ball.top < 0) {
      this.ball.pos.y = this.ball.size.y / 2;
      this.ball.vel.y = Math.abs(this.ball.vel.y);
      this.sound.wallHit();
    } else if (this.ball.bottom > this.canvas.height) {
      this.ball.pos.y = this.canvas.height - this.ball.size.y / 2;
      this.ball.vel.y = -Math.abs(this.ball.vel.y);
      this.sound.wallHit();
    }
  }

  private checkScoring() {
    if (this.ball.right < 0) {
      this.players[1].score++;
      this.sound.score();
      this.onScore();
    } else if (this.ball.left > this.canvas.width) {
      this.players[0].score++;
      this.sound.score();
      this.onScore();
    }
  }

  private onScore() {
    const winner = this.players.find((p) => p.score >= WINNING_SCORE);
    if (winner) {
      this.state = GameState.Idle;
    } else {
      this.state = GameState.Scored;
      this.scorePauseTimer = SCORE_PAUSE_DURATION;
    }
    this.resetBall();
  }

  private checkPaddleCollisions() {
    for (const player of this.players) {
      if (
        player.left < this.ball.right &&
        player.right > this.ball.left &&
        player.top < this.ball.bottom &&
        player.bottom > this.ball.top
      ) {
        const speed = this.ball.vel.len;

        // Push ball outside paddle to prevent sticking
        if (this.ball.vel.x < 0) {
          this.ball.pos.x = player.right + this.ball.size.x / 2;
        } else {
          this.ball.pos.x = player.left - this.ball.size.x / 2;
        }

        // Reflect and add spin based on where ball hits paddle
        const hitPos =
          (this.ball.pos.y - player.pos.y) / (player.size.y / 2);
        this.ball.vel.x *= -1;
        this.ball.vel.y = hitPos * speed * 0.75;
        this.ball.vel.len = speed * BALL_SPEED_INCREASE;

        this.sound.paddleHit();
      }
    }
  }

  private updateAI(dt: number) {
    const ai = this.players[1];
    const diff = this.ball.pos.y - ai.pos.y;

    // Only move if ball is on AI's side or heading toward AI
    if (this.ball.vel.x > 0) {
      if (Math.abs(diff) > ai.size.y * 0.3) {
        ai.pos.y += Math.sign(diff) * AI_SPEED * dt;
      }
    }
  }

  private clampPaddles() {
    for (const player of this.players) {
      const halfH = player.size.y / 2;
      player.pos.y = Math.max(halfH, Math.min(this.canvas.height - halfH, player.pos.y));
    }
  }

  private resetBall() {
    this.ball.pos.set(this.canvas.width / 2, this.canvas.height / 2);
    this.ball.vel.set(0, 0);
  }

  private launchBall() {
    const angle = (Math.random() - 0.5) * Math.PI * 0.5;
    const dir = Math.random() > 0.5 ? 1 : -1;
    this.ball.vel.set(
      Math.cos(angle) * BALL_INITIAL_SPEED * dir,
      Math.sin(angle) * BALL_INITIAL_SPEED
    );
  }

  public handleClick() {
    if (this.state === GameState.Idle) {
      this.players.forEach((p) => (p.score = 0));
      this.positionPlayers();
      this.resetBall();
      this.state = GameState.Playing;
      this.launchBall();
    }
  }

  public handleMouseMove(canvasY: number) {
    this.players[0].pos.y = canvasY;
  }

  // --- Drawing ---

  private draw() {
    this.drawBackground();
    this.drawCenterLine();
    this.drawScore();
    this.drawBall();
    this.players.forEach((p) => this.drawRect(p));

    if (this.state === GameState.Idle) {
      this.drawOverlayText();
    }
  }

  private drawBackground() {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawCenterLine() {
    const x = this.canvas.width / 2;
    const dashHeight = 10;
    const gap = 8;
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";

    for (let y = 0; y < this.canvas.height; y += dashHeight + gap) {
      this.ctx.fillRect(x - 1, y, 2, dashHeight);
    }
  }

  private drawBall() {
    this.ctx.fillStyle = "#ff4444";
    this.ctx.fillRect(
      this.ball.left,
      this.ball.top,
      this.ball.size.x,
      this.ball.size.y
    );
  }

  private drawRect(rect: Rect) {
    this.ctx.fillStyle = "#fff";
    this.ctx.fillRect(rect.left, rect.top, rect.size.x, rect.size.y);
  }

  private drawScore() {
    const thirdX = this.canvas.width / 3;
    const charWidth = this.CHAR_PIXEL * 4;

    this.players.forEach((player, index) => {
      const digits = player.score.toString().split("");
      const offset =
        thirdX * (index + 1) - (charWidth * digits.length) / 2 + this.CHAR_PIXEL / 2;
      digits.forEach((digit, pos) => {
        this.ctx.drawImage(this.CHARS[+digit], offset + pos * charWidth, 20);
      });
    });
  }

  private drawOverlayText() {
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    this.ctx.font = "16px monospace";
    this.ctx.textAlign = "center";

    const hasScores = this.players.some((p) => p.score > 0);
    const text = hasScores ? "Click to play again" : "Click to start";
    this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height * 0.75);
  }
}

const pongGame = new Pong(canvas);

canvas.addEventListener("mousemove", (event) => {
  const scaleY = event.offsetY / canvas.getBoundingClientRect().height;
  pongGame.handleMouseMove(canvas.height * scaleY);
});

canvas.addEventListener("click", () => pongGame.handleClick());
