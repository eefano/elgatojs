import { entity, rand, poses, CL, VL } from "./elgato.js";
import { Bell } from "./bell.js";

function Clock(s, v) {
  let o = entity({ shootrate: s, velchange: v })
    .hasPos(340, rand(160) + 40)
    .hasVel(-1, 0)
    .hasSprite(VL.mob, poses.sveglia_1, poses.sveglia_0)
    .hasInvuln()
    .hasBoundary(30, 30)
    .hasMovement((frame) => {
      if (((frame / 20) & 1) == 1) o.pose = poses["sveglia_1"];
      else o.pose = poses["sveglia_2"];

      if (o.invulnerable) {
        if (o.invuln < frame) o.remove();
      } else {
        if (o.shootrate > 0 && rand(o.shootrate) == 0 && VL.cat.size > 0) {
          const cat = VL.cat.values().next().value;
          o.defer(() => Bell(o.posx, o.posy, cat.posx, cat.posy));
        }
        if (o.velchange > 0 && rand(o.velchange) == 0) {
          o.velx = rand(3) - 1;
          o.vely = rand(5) - 2;
        }
      }
    })
    .hasCollision(CL.mob, [CL.frf, CL.cat], () => {});
}

export { Clock };
