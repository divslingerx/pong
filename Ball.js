import Vec from "./Vec.js";
import Rect from "./Rect.js";

export default class Ball extends Rect {
  constructor() {
    super(10, 10);
    this.vel = new Vec();
  }
}
