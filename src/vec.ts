export default class Vec {
  constructor(
    public x = 0,
    public y = 0
  ) {}

  set(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  get len() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  set len(value: number) {
    const currentLen = this.len;
    if (currentLen === 0) return;
    const factor = value / currentLen;
    this.x *= factor;
    this.y *= factor;
  }
}
