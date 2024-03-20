import { VL, CL, poses } from "./elgato.js";
import { Entity } from "./entity.js";

function Bell(posx, posy, targetx, targety) {
  let dx = targetx - posx;
  let dy = targety - posy;
  let l = Math.sqrt(dx * dx + dy * dy);
  if (l == 0) return;
  dx /= l;
  dy /= l;

  let o = Entity()
    .hasPos(posx, posy)
    .hasVel(dx * 4, dy * 4)
    .hasSprite(VL.enf, poses.allarme_1, poses.allarme_0)
    .hasCollision(CL.enf, [CL.cat], () => o.remove())
    .hasBoundary(10, 10);

  return o;
}

export { Bell };
