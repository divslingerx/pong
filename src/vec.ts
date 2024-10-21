<<<<<<< HEAD
export default class Vec {
  constructor(
    public x = 0,
    public y = 0
  ) {
    this.x = x;
    this.y = y;
  }

  set(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  get len() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  set len(value) {
    const fact = value / this.len;
    this.x *= fact;
    this.y *= fact;
  }
}
=======
export default class Vec {
  constructor(
    public x = 0,
    public y = 0
  ) {
    this.x = x;
    this.y = y;
  }

  set(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  get len() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  set len(value) {
    const fact = value / this.len;
    this.x *= fact;
    this.y *= fact;
  }
}
>>>>>>> 3de3c88c7010d18b46bef8b4265f80a7e0e4e221
