import Ball from "./ball";
import Rect from "./Rect";
import Player from "./player";

export class Pong {
  private ctx: CanvasRenderingContext2D;
  private ball: Ball;
  players: Player[];
  private readonly CHAR_PIXEL = 10;
  private readonly CHARS: HTMLCanvasElement[];

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.ball = this.createInitialBall();
    this.players = this.createPlayers();
    this.CHARS = this.generateScoreCanvas();

    this.initGameLoop();
    this.resetBall();
    this.attacheventListeners();
  }

  private attacheventListeners() {
    // Player 1 (human) control
    canvas.addEventListener("mousemove", (event) => {
      const scaleY = event.offsetY / canvas.getBoundingClientRect().height;
      pongGame.players[0].pos.y = canvas.height * scaleY;
    });

    // Start the ball on click
    canvas.addEventListener("click", () => pongGame.start());
  }

  private createInitialBall(): Ball {
    const ball = new Ball();
    ball.pos.set(100, 50);
    ball.vel.set(100, 50);
    return ball;
  }

  private createPlayers(): Player[] {
    const players = [new Player(), new Player()];
    players[0].pos.x = 40;
    players[1].pos.x = this.canvas.width - 40;
    players.forEach((player) => (player.pos.y = this.canvas.height / 2));
    return players;
  }

  private generateScoreCanvas(): HTMLCanvasElement[] {
    const chars = [
      "111101101101111", // 0
      "010010010010010", // 1
      "111001111100111", // 2
      "111001111001111", // 3
      "101101111001001", // 4
      "111100111001111", // 5
      "111100111101111", // 6
      "111001001001001", // 7
      "111101111101111", // 8
      "111101111001111", // 9
    ];
    return chars.map(this.createDigitCanvas.bind(this));
  }

  private createDigitCanvas(digit: string): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    const size = this.CHAR_PIXEL;
    canvas.width = size * 3;
    canvas.height = size * 5;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#fff";

    digit.split("").forEach((fill, index) => {
      if (fill === "1") {
        context.fillRect(
          (index % 3) * size,
          Math.floor(index / 3) * size,
          size,
          size
        );
      }
    });

    return canvas;
  }

  private initGameLoop() {
    let lastTime = 0;
    const updateFrame = (time = 0) => {
      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;

      if (time) this.update(deltaTime);
      requestAnimationFrame(updateFrame);
    };
    requestAnimationFrame(updateFrame);
  }

  private clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawBackground() {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawBall() {
    this.ctx.fillStyle = "red";
    this.ctx.fillRect(
      this.ball.pos.x,
      this.ball.pos.y,
      this.ball.size.x,
      this.ball.size.y
    );
  }

  private drawRect(rect: Rect) {
    this.ctx.fillStyle = "#fff";
    this.ctx.fillRect(rect.left, rect.top, rect.size.x, rect.size.y);
  }

  private checkBoundsX() {
    if (this.ball.left < 0 || this.ball.right > this.canvas.width) {
      this.ball.vel.x *= -1;
      const scoringPlayer = this.ball.vel.x < 0 ? 0 : 1;
      this.players[scoringPlayer].score++;
    }
  }

  private checkBoundsY() {
    if (this.ball.top < 0 || this.ball.bottom > this.canvas.height) {
      this.ball.vel.y *= -1;
    }
  }

  private checkPaddleCollision(player: Player, ball: Ball) {
    if (
      player.left < ball.right &&
      player.right > ball.left &&
      player.top < ball.bottom &&
      player.bottom > ball.top
    ) {
      const ballSpeed = ball.vel.len;
      ball.vel.x *= -1;
      ball.vel.y += 300 * (Math.random() - 0.5);
      ball.vel.len = ballSpeed * 1.05;
    }
  }

  private checkCollision() {
    this.checkBoundsX();
    this.checkBoundsY();
    this.players.forEach((player) =>
      this.checkPaddleCollision(player, this.ball)
    );
  }

  private drawScore() {
    const centerX = this.canvas.width / 3;
    const charWidth = this.CHAR_PIXEL * 4;

    this.players.forEach((player, index) => {
      const scoreDigits = player.score.toString().split("");
      const offset =
        centerX * (index + 1) -
        (charWidth * scoreDigits.length) / 2 +
        this.CHAR_PIXEL / 2;
      scoreDigits.forEach((digit, pos) => {
        this.ctx.drawImage(this.CHARS[+digit], offset + pos * charWidth, 20);
      });
    });
  }

  private resetBall() {
    this.ball.pos.set(this.canvas.width / 2, this.canvas.height / 2);
    this.ball.vel.set(0, 0);
  }

  private startBallMovement() {
    if (this.ball.vel.len === 0) {
      this.ball.vel.set(
        300 * (Math.random() > 0.5 ? 1 : -1),
        300 * (Math.random() * 2 - 1)
      );
      this.ball.vel.len = 200;
    }
  }

  public start() {
    this.reset();
    this.startBallMovement();
  }

  public reset() {
    this.players.forEach((player) => (player.score = 0));
    this.resetBall();
  }

  private update(deltaTime: number) {
    this.ball.pos.x += this.ball.vel.x * deltaTime;
    this.ball.pos.y += this.ball.vel.y * deltaTime;

    this.clearCanvas();
    this.checkCollision();
    this.players[1].pos.y = this.ball.pos.y; // AI follows the ball
    this.draw();
  }

  private draw() {
    this.drawBackground();
    this.drawScore();
    this.drawBall();
    this.players.forEach((player) => this.drawRect(player));
  }
}
