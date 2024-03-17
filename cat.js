import { entity, VL, CL, poses, keytrigs, keystate } from "./elgato.js";
import { Lazur } from "./lazur.js";

const jumpbig = [],
jumpsmall = [];
for (let i = -20; i < 20; i++) {
jumpbig.push(60 + (i * i * (220 - 60)) / (20 * 20));
jumpsmall.push(120 + (i * i * (220 - 120)) / (20 * 20));
}

function Cat() {
  let o = entity({
    lives: 9,
    jumping: false,
    crouching: false,
    dead: false,
    jumpstart: 0,
  })
    .hasPos(40, 220)
    .hasSprite(VL.cat, poses.gatto_0, poses.gatto_0)
    .hasInvuln()
    .hasMovement((frame) => {
      if (keytrigs.has(32) && !o.dead) {
        let dx = 0;
        if (keystate[37]) dx = dx - 1;
        if (keystate[39]) dx = dx + 1;
        let dy = 0;
        if (keystate[38]) dy = dy - 1;
        if (keystate[40]) dy = dy + 1;

        let fire = poses.fire_1;

        switch (o.pose) {
          case poses.gatto_1:
            fire = poses.fire_1;
            break;
          case poses.gatto_2:
            fire = poses.fire_2;
            break;
          case poses.gatto_3:
            fire = poses.fire_3;
            break;
          case poses.gatto_4:
            fire = poses.fire_4;
            break;
        }

        let px = o.posx + fire.xof - poses.gatto_0.xof;
        let py = o.posy + fire.yof - poses.gatto_0.yof;

        o.defer(() => Lazur(px, py, dx, dy));
      }

      if (keytrigs.has(38) && !o.jumping && !o.dead) {
        o.jumping = true;
        o.jumpcycle = o.crouching ? jumpbig : jumpsmall;
        o.crouching = false;
        o.jumpstart = frame;
      }

      if (o.dead) o.pose = poses.gatto_5;
      else {
        if (o.jumping) o.pose = poses.gatto_1;
        else if (o.crouching) o.pose = poses.gatto_4;
        else {
          if ((frame >> 3) & 1) o.pose = poses.gatto_2;
          else o.pose = poses.gatto_3;
        }
      }

      if (o.invulnerable && o.invuln < frame) o.invulnerable = false;

      if (o.jumping) {
        let d = frame - o.jumpstart;
        if (d < 40) o.posy = o.jumpcycle[d];
        else o.jumping = false;
      } else {
        o.posy = 220;
        if (o.dead) o.crouching = true;
        else o.crouching = keystate[40];
      }

      if (!o.crouching && !o.dead) {
        if (keystate[37]) o.posx -= 2;
        if (keystate[39]) o.posx += 2;
      } else o.posx -= 1;

      if (o.posx < 20 && !o.dead) {
        o.crouching = false;
        o.posx = 20;
      }
      if (o.posx < -100 && o.dead) {
        o.remove();
      }

      if (o.posx > 300) o.posx = 300;
    })
    .hasCollision(CL.cat, [CL.mob, CL.enf], () => {});
}

export { Cat };
