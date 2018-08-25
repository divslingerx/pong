import Vec from "./Vec.js";
import Rect from "./Rect.js";

export default class Player extends Rect {
  constructor() {
    super(20, 100);
    this.score = 0;
    this.pos = new Vec();
  }
}
