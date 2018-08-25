const canvas = document.getElementById("canvas");
import Ball from "./Ball.js";
import Rect from "./Rect.js";
import Player from "./Player.js";

class Pong {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ball = new Ball();
    this.ball.pos.x = 100;
    this.ball.pos.y = 50;
    this.ball.vel.x = 100;
    this.ball.vel.y = 50;

    this.players = [new Player(), new Player()];
    this.players[0].pos.x = 40;
    this.players[1].pos.x = this.canvas.width - 40;
    this.players.forEach(player => {
      player.pos.y = this.canvas.height / 2;
    });

    let lastTime;
    const callback = (time = 0) => {
      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;

      if (time) {
        this.update(deltaTime);
      }
      requestAnimationFrame(callback);
    };
    callback();

    this.CHAR_PIXEL = 10;
    this.CHARS = [
      "111101101101111",
      "010010010010010",
      "111001111100111",
      "111001111001111",
      "101101111001001",
      "111100111001111",
      "111100111101111",
      "111001001001001",
      "111101111101111",
      "111101111001111"
    ].map(str => {
      const canvas = document.createElement("canvas");
      const s = this.CHAR_PIXEL;
      canvas.height = s * 5;
      canvas.width = s * 3;
      const context = canvas.getContext("2d");
      context.fillStyle = "#fff";
      str.split("").forEach((fill, i) => {
        if (fill === "1") {
          context.fillRect((i % 3) * s, ((i / 3) | 0) * s, s, s);
        }
      });
      return canvas;
    });

    this.reset();
  }

  clearFrame() {
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  drawBackground() {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawBall() {
    this.ctx.fillStyle = "red";
    this.ctx.fillRect(
      this.ball.pos.x,
      this.ball.pos.y,
      this.ball.size.x,
      this.ball.size.y
    );
  }

  drawRect(rect) {
    this.ctx.fillStyle = "#fff";
    this.ctx.fillRect(rect.left, rect.top, rect.size.x, rect.size.y);
  }

  CheckBoundsX() {
    if (this.ball.left < 0 || this.ball.right > canvas.width) {
      this.ball.vel.x = -this.ball.vel.x;
      const playerId = (this.ball.vel.x < 0) | 0;
      this.players[playerId].score++;
    }
  }

  checkBoundsY() {
    //out of bounds Y
    if (this.ball.top < 0 || this.ball.bottom > canvas.height) {
      this.ball.vel.y = -this.ball.vel.y;
    }
  }

  checkPaddleBallCollision(player, ball) {
    if (
      player.left < ball.right &&
      player.right > ball.left &&
      player.top < ball.bottom &&
      player.bottom > ball.top
    ) {
      const len = ball.vel.len;
      ball.vel.x = -ball.vel.x;
      ball.vel.y += 300 * (Math.random() - 0.5);
      ball.vel.len = len * 1.05;
    }
  }

  start() {
    if (this.ball.vel.x === 0 && this.ball.vel.y === 0) {
      this.ball.vel.x = 300 * (Math.random() > 0.5 ? 1 : -1);
      this.ball.vel.y = 300 * (Math.random() * 2 - 1);
      this.ball.vel.len = 200;
    }
  }

  checkCollision() {
    this.CheckBoundsX();
    this.checkBoundsY();
    this.checkPaddleBallCollision(this.players[0], this.ball);
    this.checkPaddleBallCollision(this.players[1], this.ball);
  }

  drawScore() {
    const align = this.canvas.width / 3;
    const cw = this.CHAR_PIXEL * 4;
    this.players.forEach((player, index) => {
      const chars = player.score.toString().split("");
      const offset =
        align * (index + 1) - (cw * chars.length) / 2 + this.CHAR_PIXEL / 2;
      chars.forEach((char, pos) => {
        this.ctx.drawImage(this.CHARS[char | 0], offset + pos * cw, 20);
      });
    });
  }

  draw() {
    this.drawBackground();
    this.drawScore();
    this.drawRect(this.ball);

    this.players.forEach(player => {
      this.drawRect(player);
    });
  }

  reset() {
    this.ball.pos.x = this.canvas.width / 2;
    this.ball.pos.y = this.canvas.height / 2;
    this.ball.vel.x = 0;
    this.ball.vel.y = 0;
  }

  update(dt) {
    this.ball.pos.x += this.ball.vel.x * dt;
    this.ball.pos.y += this.ball.vel.y * dt;
    this.clearFrame();
    this.checkCollision();
    this.players[1].pos.y = this.ball.pos.y;
    this.draw();
  }
}

const pong = new Pong(canvas);

canvas.addEventListener("mousemove", evt => {
  const scale = evt.offsetY / evt.target.getBoundingClientRect().height;
  pong.players[0].pos.y = canvas.height * scale;
});

canvas.addEventListener("click", evt => {
  pong.start();
});
