export type InputMode = "mouse" | "keyboard";

export class InputManager {
  private keysDown = new Set<string>();
  private player1Y: number | null = null;
  private onClickCallback: (() => void) | null = null;
  private onEscapeCallback: (() => void) | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    this.bindMouse();
    this.bindTouch();
    this.bindKeyboard();
  }

  onCanvasClick(cb: () => void) {
    this.onClickCallback = cb;
  }

  onEscape(cb: () => void) {
    this.onEscapeCallback = cb;
  }

  getPlayer1Y(): number | null {
    return this.player1Y;
  }

  isKeyDown(key: string): boolean {
    return this.keysDown.has(key);
  }

  private bindMouse() {
    this.canvas.addEventListener("mousemove", (e) => {
      const scaleY = e.offsetY / this.canvas.getBoundingClientRect().height;
      this.player1Y = this.canvas.height * scaleY;
    });

    this.canvas.addEventListener("click", () => {
      this.onClickCallback?.();
    });
  }

  private bindTouch() {
    this.canvas.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scaleY = (touch.clientY - rect.top) / rect.height;
        this.player1Y = this.canvas.height * scaleY;
      },
      { passive: false }
    );

    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.onClickCallback?.();

      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const scaleY = (touch.clientY - rect.top) / rect.height;
      this.player1Y = this.canvas.height * scaleY;
    }, { passive: false });
  }

  private bindKeyboard() {
    window.addEventListener("keydown", (e) => {
      this.keysDown.add(e.key);

      if (e.key === "Escape") {
        this.onEscapeCallback?.();
      }

      if (e.key === " " || e.key === "Enter") {
        this.onClickCallback?.();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keysDown.delete(e.key);
    });
  }
}
