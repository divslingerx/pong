<<<<<<< HEAD
import Vec from "./vec";

export default class Rect {
  pos: Vec;
  size: Vec;
  constructor(w: number, h: number) {
    this.pos = new Vec();
    this.size = new Vec(w, h);
  }

  set(x: number, y: number) {
    this.pos.x = x;
    this.pos.y = y;
  }

  get left() {
    return this.pos.x - this.size.x / 2;
  }

  get right() {
    return this.pos.x + this.size.x / 2;
  }

  get top() {
    return this.pos.y - this.size.y / 2;
  }

  get bottom() {
    return this.pos.y + this.size.y / 2;
  }
}
=======
import Vec from "./vec";

export default class Rect {
  pos: Vec;
  size: Vec;
  constructor(w: number, h: number) {
    this.pos = new Vec();
    this.size = new Vec(w, h);
  }

  set(x: number, y: number) {
    this.pos.x = x;
    this.pos.y = y;
  }

  get left() {
    return this.pos.x - this.size.x / 2;
  }

  get right() {
    return this.pos.x + this.size.x / 2;
  }

  get top() {
    return this.pos.y - this.size.y / 2;
  }

  get bottom() {
    return this.pos.y + this.size.y / 2;
  }
}
>>>>>>> 3de3c88c7010d18b46bef8b4265f80a7e0e4e221
