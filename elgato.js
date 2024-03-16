import { GFX_Canvas } from "./gfx-canvas.js";
import { GFX_Webgl } from "./gfx-webgl.js";
import { TXT } from "./txt.js";

var xres, yres, canvas, gfx, txt;
var keystate = [];
var keytrigs = new Set();

var frame = 0;
var points = 0;
var win = false;

var sounds = {};
var jsons = {};
var poses;

var bkglayer = new Set();
var moblayer = new Set();
var catlayer = new Set();
var shtlayer = new Set();
var movers = new Set();
var removers = new Set();

function inset(o, ...sets) {
  for (var j = 0; j < sets.length; j++) {
    sets[j].add(o);
    o.sets.add(sets[j]);
  }
}

function sfondo(xstart) {
  var o = {
    sets: new Set(),
    shift: 0,
    pos: [xstart, 0],
    visible: true,
    pose: poses.sfondo,
    base: poses.sfondo,
    movefunc: (o) => {
      //o.shift++;
      if (o.shift >= xres) o.shift = 0;
      o.pos[0] = xstart - o.shift;
    },
  };
  inset(o, bkglayer, movers);
}

function cat() {
  var o = {
    sets: new Set(),
    lives: 9,
    jumping: false,
    crouching: false,
    invulnerable: false,
    dead: false,
    invuln: 0,
    pos: [40, 220],
    jumpbig: [],
    jumpsmall: [],
    jumpstart: 0,
    pose: poses.gatto_0,
    base: poses.gatto_0,
    visible: true,
  };

  for (let i = -20; i < 20; i++) {
    o.jumpbig.push(60 + (i * i * (220 - 60)) / (20 * 20));
    o.jumpsmall.push(120 + (i * i * (220 - 120)) / (20 * 20));
  }

  o.movefunc = (o) => {
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

      /* TODO
			Vector eyes = fire->offset;
			Vector base = poses["gatto_0"]->offset;

			insertqueue[MOB_ffire]->push_back(new Lazor( pos + eyes - base , dx,dy)));
      */
    }

    if (keytrigs.has(38) && !o.jumping && !o.dead) {
      o.jumping = true;
      o.jumpcycle = o.crouching ? o.jumpbig : o.jumpsmall;
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
      if (d < 40) o.pos[1] = o.jumpcycle[d];
      else o.jumping = false;
    } else {
      o.pos[1] = 220;
      if (o.dead) o.crouching = true;
      else o.crouching = keystate[40];
    }

    if (!o.crouching && !o.dead) {
      if (keystate[37]) o.pos[0] -= 2;
      if (keystate[39]) o.pos[0] += 2;
    } else o.pos[0] -= 1;

    if (o.pos[0] < 20 && !o.dead) {
      o.crouching = false;
      o.pos[0] = 20;
    }
    if (o.pos[0] < -100 && o.dead) {
      removers.add(o);
    }

    if (o.pos[0] > 300) o.pos[0] = 300;
  };

  inset(o, catlayer, movers);
}

function carcass() {}

function drawlayers(...layers) {
  for (var j = 0; j < layers.length; j++) {
    var layer = layers[j];
    for (const o of layer) {
      if (o.visible) {
        gfx.drawTexture(
          o.pose.img,
          o.pos[0] + o.pose.xof - o.base.xof,
          o.pos[1] + o.pose.yof - o.base.yof,
          { r: 1, g: 1, b: 1, a: 1 }
        );
      }
    }
  }
}

function step(clock) {
  drawlayers(bkglayer, moblayer, catlayer, shtlayer);

  for (const o of movers) {
    o.movefunc(o);
  }

  for (const o of removers) {
    for (const s of o.sets) s.delete(o);
  }
  removers.clear();
  keytrigs.clear();

  txt.outlinetext(
    "Hello world",
    10,
    50,
    { r: 255, g: 255, b: 0 },
    { r: 0, g: 0, b: 0 }
  );

  frame++;
  window.requestAnimationFrame(step);
}

function init() {
  points = 0;
  win = false;
  sfondo(0);
  sfondo(xres);
  cat();
}

function resize() {
  var h = window.innerHeight * window.devicePixelRatio;
  var w = window.innerWidth * window.devicePixelRatio;

  var kx = (w / xres) >> 0;
  var ky = (h / yres) >> 0;
  var k = 1;

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

  //gfx = GFX_Canvas(canvas);
  gfx = GFX_Webgl(canvas);

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
