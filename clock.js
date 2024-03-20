import { rand, dice, poses, CL, VL, addPoints } from "./elgato.js";
import { Entity } from "./entity.js";
import { Bell } from "./bell.js";

function Clock(shootChance, steerChance) {
  let o = Entity({ shootChance: shootChance, steerChance: steerChance })
    .hasPos(340, rand(160) + 40)
    .hasVel(-1, 0)
    .hasSprite(VL.mob, poses.sveglia_1, poses.sveglia_0)
    .hasAnimation((frame) => {
      o.pose =
        ((frame / 20) & 1) == 1 ? poses["sveglia_1"] : poses["sveglia_2"];
    })
    .hasBoundary(30, 30)
    .hasMovement(() => {
      if (dice(o.shootChance) && VL.cat.size > 0) {
        const cat = VL.cat.values().next().value;
        o.defer(() => Bell(o.posx, o.posy, cat.posx, cat.posy));
      }
      if (dice(o.steerChance)) {
        o.velx = rand(3) - 1;
        o.vely = rand(5) - 2;
      }
    })
    .hasCollision(CL.mob, [CL.frf, CL.cat], () => {
      if (!o.invulnerable) {
        //boomsound->play();

        addPoints(10);
        o.hasMovement(() => {}).hasInvuln(30, () => o.remove());
      }
    });

  return o;
}

export { Clock };
