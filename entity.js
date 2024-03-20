import { Cmp } from "./elgato.js";

function Entity(o = {}) {
  o.sets = new Set();

  o.inSet = (set) => {
    set.add(o);
    o.sets.add(set);
    return o;
  };

  o.hasPos = (posx, posy) => {
    o.posx = posx;
    o.posy = posy;
    return o;
  };

  o.hasVel = (velx, vely) => {
    o.velx = velx;
    o.vely = vely;
    return o.inSet(Cmp.speeders);
  };

  o.hasSprite = (layer, pose, base) => {
    o.visible = true;
    o.pose = pose;
    o.base = base;
    return o.inSet(layer);
  };

  o.hasCollision = (mylayer, others, f) => {
    o.collision = f;
    o.others = others;
    return o.inSet(mylayer);
  };

  o.hasBoundary = (marginx, marginy) => {
    o.marginx = marginx;
    o.marginy = marginy;
    return o.inSet(Cmp.clippers);
  };

  o.hasAnimation = (animf) => {
    o.animfunc = animf;
    return o.inSet(Cmp.animators);
  };

  o.hasMovement = (movef) => {
    o.movefunc = movef;
    return o.inSet(Cmp.movers);
  };

  o.hasInvuln = (timeout, endfunc) => {
    o.invulnerable = true;
    o.invuln = timeout;
    o.invulnfunc = endfunc;
    return o.inSet(Cmp.flickerers);
  };

  o.defer = (f) => Cmp.deferrers.add(f);
  o.remove = () => Cmp.removers.add(o);

  return o;
}

export { Entity };
