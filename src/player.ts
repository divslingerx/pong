import Vec from "./vec";
import Rect from "./Rect";

export default class Player extends Rect {
  score = 0;
  pos = new Vec();
  constructor() {
    super(20, 100);
  }
}
