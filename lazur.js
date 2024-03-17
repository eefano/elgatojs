import { entity, VL, CL, poses } from "./elgato.js";

// Wow. Lazur.

function Lazur(posx, posy, dx, dy) {
  let pose;
  if (dx == 1) {
    if (dy == 1) pose = poses.lazer_SE;
    else if (dy == -1) pose = poses.lazer_NE;
    else pose = poses.lazer_E;
  } else if (dx == -1) {
    if (dy == 1) pose = poses.lazer_SO;
    else if (dy == -1) pose = poses.lazer_NO;
    else pose = poses.lazer_O;
  } else {
    if (dy == 1) pose = poses.lazer_S;
    else if (dy == -1) pose = poses.lazer_N;
    else {
      pose = poses.lazer_E;
      dx = 1;
    }
  }
  let o = entity()
    .hasPos(posx, posy)
    .hasVel(dx * 8, dy * 8)
    .hasSprite(VL.frf, pose, poses.lazer_0)
    .hasCollision(CL.frf, [CL.mob], () => o.remove())
    .hasBoundary(10, 10);
}

export { Lazur };
