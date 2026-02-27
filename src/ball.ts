import Vec from "./vec";
import Rect from "./rect";

export default class Ball extends Rect {
  public vel = new Vec();

  constructor() {
    super(10, 10);
  }
}
