var xres, yres, canvas, ctx;
var keystate = [];
var keyqueue = [];

var points = 0;
var win = false;

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
      o.shift++;
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
    jumpstart: 0,
    pose: poses.gatto_0,
    base: poses.gatto_0,
    visible: true,
    movefunc: (o) => {
        removers.add(o);
    },
  };
  inset(o, catlayer, movers);
}

function carcass() {}

function drawlayers(...layers) {
  for (var j = 0; j < layers.length; j++) {
    var layer = layers[j];
    for (const o of layer) {
      if (o.visible) {
        ctx.drawImage(
          images[o.pose.img],
          o.pos[0] + o.pose.xof - o.base.xof,
          o.pos[1] + o.pose.yof - o.base.yof
        );
      }
    }
  }
}

function step() {
  drawlayers(bkglayer, moblayer, catlayer, shtlayer);

  for (const o of movers) {
    o.movefunc(o);
  }

  for (const o of removers) {
    for (const s of o.sets) s.delete(o);
  }
  removers.clear();

  ctx.font = "8px ElGato";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.strokeText("Hello world", 11.5, 50.5);
  ctx.fillStyle = "orangered";
  ctx.fillText("Hello world", 11.5, 50.5);

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
  var h = window.innerHeight;
  var w = window.innerWidth;

  var kx = Math.floor(w / xres);
  var ky = Math.floor(h / yres);
  var k = 1;

  if (kx < ky) {
    if (kx > 1) k = kx;
    else k = 1;
  } else {
    if (ky > 1) k = ky;
    else k = 1;
  }

  canvas.style.width = xres * k + "px";
  canvas.style.height = yres * k + "px";
}

function keypress(e) {
  keyqueue.push(e);
  return false;
}

function keydown(e) {
  keystate[e.keyCode] = true;
  return false;
}
function keyup(e) {
  keystate[e.keyCode] = false;
  return false;
}

var sounds = {};
var images = {};
var poses;

function preload(what, where, ...list) {
  for (var i = 0; i < list.length; i++) {
    let v = list[i];
    where[v] = new what();
    where[v].src = "data/" + v;
  }
}

async function load() {
  preload(
    Image,
    images,
    "allarme_1.png",
    "cake_1.png",
    "gatto_1.png",
    "gatto_2.png",
    "gatto_3.png",
    "gatto_4.png",
    "gatto_5.png",
    "lazer_E.png",
    "lazer_N.png",
    "lazer_NE.png",
    "lazer_NO.png",
    "lazer_O.png",
    "lazer_S.png",
    "lazer_SE.png",
    "lazer_SO.png",
    "placeholder.png",
    "sfondo.png",
    "sveglia_1.png",
    "sveglia_2.png"
  );

  preload(
    Audio,
    sounds,
    "boom.mp3",
    "die.mp3",
    "hit.mp3",
    "ingame.mp3",
    "ring.mp3",
    "shot.mp3",
    "win.mp3"
  );

  await fetch("data/layers.json")
    .then((response) => response.json())
    .then((parsed) => {
      poses = parsed;
    });

  canvas = document.querySelector("canvas");
  ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  xres = canvas.width;
  yres = canvas.height;

  resize();
  canvas.focus();

  canvas.addEventListener("keydown", keydown, true);
  canvas.addEventListener("keyup", keyup, true);
  canvas.addEventListener("keypress", keypress, true);
  window.addEventListener("resize", resize);

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);

  window.requestAnimationFrame(step);
}
