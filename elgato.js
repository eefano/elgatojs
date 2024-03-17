import { GFX_Canvas } from "./gfx-canvas.js";
import { GFX_Webgl } from "./gfx-webgl.js";
import { TXT } from "./txt.js";
import { Cat } from "./cat.js";
import { Clock } from "./clock.js";

var xres, yres, canvas, gfx, txt;
var keystate = [];
var keytrigs = new Set();

var frame = 0;
var points = 0;
var win = false;

var sounds = {};
var jsons = {};
var poses;

const VL = {
  bkg: new Set(),
  mob: new Set(),
  enf: new Set(),
  cat: new Set(),
  frf: new Set(),
  front: new Set(),
};
const CL = {
  mob: new Set(),
  enf: new Set(),
  cat: new Set(),
  frf: new Set(),
};

const movers = new Set();
const removers = new Set();
const speeders = new Set();
const deferrers = new Set();
const clippers = new Set();
const flickerers = new Set();

function rand(n) {
  return Math.trunc(Math.random() * n);
}

function entity(o = {}) {
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
    return o.inSet(speeders);
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
    return o.inSet(clippers);
  };

  o.hasMovement = (movef) => {
    o.movefunc = movef;
    return o.inSet(movers);
  };

  o.hasInvuln = () => {
    o.invulnerable = false;
    o.invuln = 0;
    return o.inSet(flickerers);
  };

  o.defer = (f) => deferrers.add(f);
  o.remove = () => removers.add(o);

  return o;
}

function Background(xstart) {
  let o = entity({ shift: 0 })
    .hasPos(xstart, 0)
    .hasSprite(VL.bkg, poses.sfondo, poses.sfondo)
    .hasMovement(() => {
      //o.shift++;
      if (o.shift >= xres) o.shift = 0;
      o.posx = xstart - o.shift;
    });
}

function collisions(oo1) {
  for (const o1 of oo1) {
    const a1x = o1.posx + o1.pose.xof - o1.base.xof;
    const a1y = o1.posy + o1.pose.yof - o1.base.yof;
    const tx1 = gfx.getTextureSize(o1.pose.img);
    const b1x = a1x + tx1.x;
    const b1y = a1y + tx1.y;

    for (let i = 0; i < o1.others.length; i++) {
      const oo2 = o1.others[i];

      for (const o2 of oo2) {
        const a2x = o2.posx + o2.pose.xof - o2.base.xof;
        const a2y = o2.posy + o2.pose.yof - o2.base.yof;
        const tx2 = gfx.getTextureSize(o2.pose.img);
        const b2x = a2x + tx2.x;
        const b2y = a2y + tx2.y;

        if (
          (a2x - b1x) * (b2x - a1x) < 0.0 &&
          (a2y - b1y) * (b2y - a1y) < 0.0
        ) {
          o1.collision(o2);
        }
      }
    }
  }
}

function step() {
  let status = "";

  // RENDERING

  Object.entries(VL).forEach(([name, layer]) => {
    status += name + ":" + layer.size + " ";
    for (const o of layer) {
      if (o.visible) {
        gfx.drawTexture(
          o.pose.img,
          o.posx + o.pose.xof - o.base.xof,
          o.posy + o.pose.yof - o.base.yof,
          { r: 1, g: 1, b: 1, a: 1 }
        );
      }
    }
  });

  txt.outlinetext(status, 0, 0, { r: 255, g: 255, b: 0 }, { r: 0, g: 0, b: 0 });

  // COLLISIONS

  Object.values(CL).forEach((layer) => {
    collisions(layer);
  });

  for (const o of movers) {
    o.movefunc(frame);
  }
  for (const o of speeders) {
    o.posx += o.velx;
    o.posy += o.vely;
  }
  for (const o of clippers) {
    if (
      o.posx < -o.marginx ||
      o.posy < -o.marginy ||
      o.posx > xres + o.marginx ||
      o.posy > yres + o.marginy
    )
      o.remove();
  }

  for (let i = 0; i < 1 - VL.mob.size; i++) {
    Clock(50, 0);
  }

  for (const o of deferrers) {
    o();
  }
  deferrers.clear();

  for (const o of removers) {
    for (const s of o.sets) s.delete(o);
  }
  removers.clear();
  keytrigs.clear();

  frame++;
  window.requestAnimationFrame(step);
}

function init() {
  points = 0;
  win = false;
  Background(0);
  Background(xres);
  Cat();
}

function resize() {
  let h = window.innerHeight * window.devicePixelRatio;
  let w = window.innerWidth * window.devicePixelRatio;

  let kx = (w / xres) >> 0;
  let ky = (h / yres) >> 0;
  let k = 1;

  if (kx < ky) {
    if (kx > 1) k = kx;
    else k = 1;
  } else {
    if (ky > 1) k = ky;
    else k = 1;
  }

  canvas.style.width = (xres * k) / window.devicePixelRatio + "px";
  canvas.style.height = (yres * k) / window.devicePixelRatio + "px";
}

function keydown(e) {
  keystate[e.keyCode] = true;
  keytrigs.add(e.keyCode);
  return false;
}
function keyup(e) {
  keystate[e.keyCode] = false;
  return false;
}

async function preload(what, callback) {
  let elements = document.querySelectorAll('link[as="' + what + '"]');
  for (let i = 0; i < elements.length; i++) {
    let href = elements[i].attributes["href"].nodeValue;
    let v = href.substring(5);
    await callback(v, elements[i].href);
  }
}

async function load() {
  canvas = document.querySelector("canvas");
  xres = canvas.width;
  yres = canvas.height;

  gfx = GFX_Canvas(canvas);
  //gfx = GFX_Webgl(canvas);

  preload("image", (v, href) => {
    let i = new Image();
    i.onload = () => {
      gfx.loadTexture(v, i);
    };
    i.src = href;
  });

  preload("audio", (v, href) => {
    sounds[v] = new Audio();
    sounds[v].src = href;
  });

  await preload("fetch", async (v, href) => {
    const res = await fetch(href);
    jsons[v] = await res.json();
  });

  poses = jsons["layers.json"];

  txt = TXT(gfx, jsons["gamefont.json"]);

  resize();
  canvas.focus();

  canvas.addEventListener("keydown", keydown, true);
  canvas.addEventListener("keyup", keyup, true);
  window.addEventListener("resize", resize);

  init();
  window.requestAnimationFrame(step);
}

window.addEventListener("load", load);

export { CL, VL, poses, keystate, keytrigs, entity, rand };
