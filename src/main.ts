import "./style.css";
import Ball from "./ball";
import Rect from "./rect";
import Player from "./player";
import { SoundEngine } from "./sound";
import { InputManager } from "./input";
import { ParticleSystem } from "./particles";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const enum GameState {
  Menu,
  Playing,
  Scored,
  Paused,
  GameOver,
}

interface Difficulty {
  label: string;
  aiSpeed: number;
  aiDeadzone: number;
}

const DIFFICULTIES: Difficulty[] = [
  { label: "Easy", aiSpeed: 180, aiDeadzone: 0.5 },
  { label: "Medium", aiSpeed: 300, aiDeadzone: 0.3 },
  { label: "Hard", aiSpeed: 450, aiDeadzone: 0.15 },
];

const WINNING_SCORE = 7;
const BALL_INITIAL_SPEED = 250;
const BALL_SPEED_INCREASE = 1.05;
const SCORE_PAUSE_DURATION = 1.5;
const PLAYER_KEYBOARD_SPEED = 400;
const BALL_TRAIL_LENGTH = 8;

class Pong {
  private ctx: CanvasRenderingContext2D;
  private ball: Ball;
  private players: Player[];
  private input: InputManager;
  private sound: SoundEngine;
  private particles: ParticleSystem;

  private state = GameState.Menu;
  private difficultyIndex = 1;
  private scorePauseTimer = 0;
  private screenShake = 0;
  private scoreFlash = [0, 0];
  private winner: "player" | "ai" | null = null;
  private ballTrail: Array<{ x: number; y: number }> = [];

  private readonly CHAR_PIXEL = 10;
  private readonly CHARS: HTMLCanvasElement[];

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.ball = new Ball();
    this.players = [new Player(), new Player()];
    this.CHARS = this.generateScoreCanvases();
    this.sound = new SoundEngine();
    this.particles = new ParticleSystem();
    this.input = new InputManager(canvas);

    this.input.onCanvasClick(() => this.handleAction());
    this.input.onEscape(() => this.handleEscape());

    this.positionPlayers();
    this.resetBall();
    this.startGameLoop();

    this.loadStats();
  }

  private get difficulty(): Difficulty {
    return DIFFICULTIES[this.difficultyIndex];
  }

  // --- Stats ---

  private stats = { wins: 0, losses: 0 };

  private loadStats() {
    try {
      const saved = localStorage.getItem("pong-stats");
      if (saved) this.stats = JSON.parse(saved);
    } catch { /* ignore */ }
  }

  private saveStats() {
    try {
      localStorage.setItem("pong-stats", JSON.stringify(this.stats));
    } catch { /* ignore */ }
  }

  // --- Setup ---

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

  // --- Game Loop ---

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
    this.particles.update(dt);

    if (this.screenShake > 0) this.screenShake -= dt;
    this.scoreFlash[0] = Math.max(0, this.scoreFlash[0] - dt * 3);
    this.scoreFlash[1] = Math.max(0, this.scoreFlash[1] - dt * 3);

    if (this.state === GameState.Scored) {
      this.scorePauseTimer -= dt;
      if (this.scorePauseTimer <= 0) {
        this.state = GameState.Playing;
        this.launchBall();
      }
      return;
    }

    if (this.state !== GameState.Playing) return;

    this.updatePlayerInput(dt);
    this.ball.pos.x += this.ball.vel.x * dt;
    this.ball.pos.y += this.ball.vel.y * dt;

    this.updateBallTrail();
    this.checkWallBounce();
    this.checkScoring();
    this.checkPaddleCollisions();
    this.updateAI(dt);
    this.clampPaddles();
  }

  private updatePlayerInput(dt: number) {
    const p1 = this.players[0];

    // Mouse/touch — set directly
    const mouseY = this.input.getPlayer1Y();
    if (mouseY !== null) {
      p1.pos.y = mouseY;
    }

    // Keyboard — additive
    if (this.input.isKeyDown("w") || this.input.isKeyDown("W") || this.input.isKeyDown("ArrowUp")) {
      p1.pos.y -= PLAYER_KEYBOARD_SPEED * dt;
    }
    if (this.input.isKeyDown("s") || this.input.isKeyDown("S") || this.input.isKeyDown("ArrowDown")) {
      p1.pos.y += PLAYER_KEYBOARD_SPEED * dt;
    }
  }

  private updateBallTrail() {
    this.ballTrail.push({ x: this.ball.pos.x, y: this.ball.pos.y });
    if (this.ballTrail.length > BALL_TRAIL_LENGTH) {
      this.ballTrail.shift();
    }
  }

  // --- Collision ---

  private checkWallBounce() {
    if (this.ball.top < 0) {
      this.ball.pos.y = this.ball.size.y / 2;
      this.ball.vel.y = Math.abs(this.ball.vel.y);
      this.sound.wallHit();
      this.particles.emit(this.ball.pos.x, 0, 6, "rgba(255,255,255,0.6)", 100);
    } else if (this.ball.bottom > this.canvas.height) {
      this.ball.pos.y = this.canvas.height - this.ball.size.y / 2;
      this.ball.vel.y = -Math.abs(this.ball.vel.y);
      this.sound.wallHit();
      this.particles.emit(this.ball.pos.x, this.canvas.height, 6, "rgba(255,255,255,0.6)", 100);
    }
  }

  private checkScoring() {
    if (this.ball.right < 0) {
      this.players[1].score++;
      this.scoreFlash[1] = 1;
      this.screenShake = 0.3;
      this.sound.score();
      this.onScore();
    } else if (this.ball.left > this.canvas.width) {
      this.players[0].score++;
      this.scoreFlash[0] = 1;
      this.screenShake = 0.3;
      this.sound.score();
      this.onScore();
    }
  }

  private onScore() {
    this.ballTrail = [];
    const p1Won = this.players[0].score >= WINNING_SCORE;
    const p2Won = this.players[1].score >= WINNING_SCORE;

    if (p1Won || p2Won) {
      this.winner = p1Won ? "player" : "ai";
      this.state = GameState.GameOver;
      if (p1Won) {
        this.stats.wins++;
        this.sound.victory();
      } else {
        this.stats.losses++;
        this.sound.defeat();
      }
      this.saveStats();
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

        if (this.ball.vel.x < 0) {
          this.ball.pos.x = player.right + this.ball.size.x / 2;
        } else {
          this.ball.pos.x = player.left - this.ball.size.x / 2;
        }

        const hitPos = (this.ball.pos.y - player.pos.y) / (player.size.y / 2);
        this.ball.vel.x *= -1;
        this.ball.vel.y = hitPos * speed * 0.75;
        this.ball.vel.len = speed * BALL_SPEED_INCREASE;

        this.sound.paddleHit();
        this.particles.emit(
          this.ball.pos.x, this.ball.pos.y, 10, "#ff8844", 150
        );
      }
    }
  }

  // --- AI ---

  private updateAI(dt: number) {
    const ai = this.players[1];
    const diff = this.ball.pos.y - ai.pos.y;
    const { aiSpeed, aiDeadzone } = this.difficulty;

    if (this.ball.vel.x > 0) {
      if (Math.abs(diff) > ai.size.y * aiDeadzone) {
        ai.pos.y += Math.sign(diff) * aiSpeed * dt;
      }
    }
  }

  private clampPaddles() {
    for (const player of this.players) {
      const halfH = player.size.y / 2;
      player.pos.y = Math.max(halfH, Math.min(this.canvas.height - halfH, player.pos.y));
    }
  }

  // --- Ball ---

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

  // --- Input Handlers ---

  private handleAction() {
    if (this.state === GameState.Menu) {
      this.startGame();
    } else if (this.state === GameState.GameOver) {
      this.state = GameState.Menu;
      this.winner = null;
    } else if (this.state === GameState.Paused) {
      this.state = GameState.Playing;
    }
  }

  private handleEscape() {
    if (this.state === GameState.Playing) {
      this.state = GameState.Paused;
    } else if (this.state === GameState.Paused) {
      this.state = GameState.Playing;
    }
  }

  private startGame() {
    this.players.forEach((p) => (p.score = 0));
    this.positionPlayers();
    this.resetBall();
    this.ballTrail = [];
    this.state = GameState.Playing;
    this.launchBall();
  }

  public cycleDifficulty() {
    this.difficultyIndex = (this.difficultyIndex + 1) % DIFFICULTIES.length;
  }

  // --- Drawing ---

  private draw() {
    const ctx = this.ctx;

    ctx.save();
    if (this.screenShake > 0) {
      const intensity = this.screenShake * 8;
      ctx.translate(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity
      );
    }

    this.drawBackground();
    this.drawCenterLine();
    this.drawScore();
    this.drawBallTrail();
    this.drawBall();
    this.players.forEach((p) => this.drawRect(p));
    this.particles.draw(ctx);
    this.drawScanlines();

    ctx.restore();

    if (this.state === GameState.Menu) this.drawMenu();
    if (this.state === GameState.Paused) this.drawPauseOverlay();
    if (this.state === GameState.GameOver) this.drawGameOver();
  }

  private drawBackground() {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawCenterLine() {
    const x = this.canvas.width / 2;
    const dashHeight = 10;
    const gap = 8;
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.15)";

    for (let y = 0; y < this.canvas.height; y += dashHeight + gap) {
      this.ctx.fillRect(x - 1, y, 2, dashHeight);
    }
  }

  private drawBallTrail() {
    const len = this.ballTrail.length;
    if (len === 0) return;

    const halfW = this.ball.size.x / 2;
    const halfH = this.ball.size.y / 2;

    for (let i = 0; i < len; i++) {
      const t = this.ballTrail[i];
      const alpha = ((i + 1) / len) * 0.3;
      this.ctx.fillStyle = `rgba(255, 68, 68, ${alpha})`;
      const scale = 0.5 + (i / len) * 0.5;
      const w = this.ball.size.x * scale;
      const h = this.ball.size.y * scale;
      this.ctx.fillRect(t.x - halfW * scale, t.y - halfH * scale, w, h);
    }
  }

  private drawBall() {
    const ctx = this.ctx;

    // Glow
    ctx.shadowColor = "#ff4444";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#ff4444";
    ctx.fillRect(this.ball.left, this.ball.top, this.ball.size.x, this.ball.size.y);
    ctx.shadowBlur = 0;
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

      // Score flash effect
      if (this.scoreFlash[index] > 0) {
        this.ctx.globalAlpha = 0.5 + this.scoreFlash[index] * 0.5;
      }
      digits.forEach((digit, pos) => {
        this.ctx.drawImage(this.CHARS[+digit], offset + pos * charWidth, 20);
      });
      this.ctx.globalAlpha = 1;
    });
  }

  private drawScanlines() {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
    for (let y = 0; y < this.canvas.height; y += 4) {
      this.ctx.fillRect(0, y, this.canvas.width, 2);
    }
  }

  private drawMenu() {
    const ctx = this.ctx;
    const cx = this.canvas.width / 2;

    // Dim overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.textAlign = "center";

    // Title
    ctx.fillStyle = "#ff4444";
    ctx.font = "bold 36px monospace";
    ctx.fillText("PONG", cx, 120);

    // Difficulty
    ctx.fillStyle = "#fff";
    ctx.font = "14px monospace";
    ctx.fillText(`Difficulty: ${this.difficulty.label}`, cx, 200);
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "11px monospace";
    ctx.fillText("[D] to change", cx, 220);

    // Controls
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "11px monospace";
    ctx.fillText("Mouse / Touch / W,S / Arrow Keys", cx, 270);

    // Start prompt
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "16px monospace";
    ctx.fillText("Click or press Enter to start", cx, 330);

    // Stats
    if (this.stats.wins > 0 || this.stats.losses > 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "10px monospace";
      ctx.fillText(`Record: ${this.stats.wins}W - ${this.stats.losses}L`, cx, 380);
    }
  }

  private drawPauseOverlay() {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px monospace";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", this.canvas.width / 2, this.canvas.height / 2 - 10);

    ctx.font = "12px monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText("Press Escape to resume", this.canvas.width / 2, this.canvas.height / 2 + 20);
  }

  private drawGameOver() {
    const ctx = this.ctx;
    const cx = this.canvas.width / 2;

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.textAlign = "center";

    if (this.winner === "player") {
      ctx.fillStyle = "#44ff44";
      ctx.font = "bold 28px monospace";
      ctx.fillText("YOU WIN!", cx, this.canvas.height / 2 - 20);
    } else {
      ctx.fillStyle = "#ff4444";
      ctx.font = "bold 28px monospace";
      ctx.fillText("AI WINS", cx, this.canvas.height / 2 - 20);
    }

    ctx.fillStyle = "#fff";
    ctx.font = "14px monospace";
    ctx.fillText(
      `${this.players[0].score} - ${this.players[1].score}`,
      cx,
      this.canvas.height / 2 + 15
    );

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "12px monospace";
    ctx.fillText("Click or press Enter to continue", cx, this.canvas.height / 2 + 50);
  }
}

const pongGame = new Pong(canvas);

// Difficulty toggle from menu
window.addEventListener("keydown", (e) => {
  if (e.key === "d" || e.key === "D") {
    pongGame.cycleDifficulty();
  }
});
