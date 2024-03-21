import { GFX_Canvas } from "./gfx-canvas.js";
import { GFX_Webgl } from "./gfx-webgl.js";
import { SFX } from "./sfx.js";
import { Entity } from "./entity.js";
import { TXT } from "./txt.js";
import { Cat } from "./cat.js";
import { Clock } from "./clock.js";

var xres, yres, canvas, gfx, txt;
var keystate = [];
var keytrigs = new Set();

var frame = 0;
var points = 0;
var win = false;
var cat;
const walkline = 200;

var jsons = {};
var poses;

const VL = {
  bkg: new Set(), // background
  mob: new Set(), // enemies
  enf: new Set(), // enemy fire
  cat: new Set(), // player
  frf: new Set(), // player fire
  hud: new Set(), // foreground
};
const CL = {
  mob: new Set(),
  cat: new Set(),
  frf: new Set(),
};
const Cmp = {
  movers: new Set(),
  removers: new Set(),
  speeders: new Set(),
  deferrers: new Set(),
  clippers: new Set(),
  flickerers: new Set(),
  animators: new Set(),
};

function clearSets(...oo) {
  oo.forEach((o) => o.clear());
}
function clearSetObjs(...oo) {
  oo.forEach((o) => Object.values(o).forEach((set) => set.clear()));
}

function rand(n) {
  return Math.trunc(Math.random() * n);
}
function dice(p1000) {
  if (p1000 == 0) return false;
  return Math.random() * 1000 <= p1000;
}

function Background(xstart) {
  let o = Entity({ shift: 0 })
    .hasPos(xstart, 0)
    .hasSprite(VL.bkg, poses.sfondo_1, poses.sfondo_0)
    .hasMovement(() => {
      o.shift++;
      if (o.shift >= xres) o.shift = 0;
      o.posx = xstart - o.shift;
    });
  return o;
}

function Text(x, y, textfunc, fore, back) {
  return Entity().hasPos(x, y).hasText(VL.hud, textfunc, fore, back);
}

function collisions(oo1, oo2) {
  for (const o1 of oo1) {
    if (!o1.cancollide) continue;
    const a1x = o1.posx + o1.pose.xof - o1.base.xof;
    const a1y = o1.posy + o1.pose.yof - o1.base.yof;
    const tx1 = gfx.getTextureSize(o1.pose.img);
    const b1x = a1x + tx1.x;
    const b1y = a1y + tx1.y;

    for (const o2 of oo2) {
      if (!o1.cancollide) continue;
      const a2x = o2.posx + o2.pose.xof - o2.base.xof;
      const a2y = o2.posy + o2.pose.yof - o2.base.yof;
      const tx2 = gfx.getTextureSize(o2.pose.img);
      const b2x = a2x + tx2.x;
      const b2y = a2y + tx2.y;

      if ((a2x - b1x) * (b2x - a1x) < 0.0 && (a2y - b1y) * (b2y - a1y) < 0.0) {
        o1.collision(o2);
        o2.collision(o1);
      }
    }
  }
}

function step() {
  let status = "";

  for (const o of Cmp.animators) {
    o.animfunc(frame);
  }

  // RENDERING

  Object.entries(VL).forEach(([name, layer]) => {
    status += name + ":" + layer.size + " ";
    for (const o of layer) {
      if (o.visible) o.drawfunc(gfx, txt);
    }
  });
  //txt.normaltext("FPS: " + fps,130,236,[0.0,0.0,0.0]);
  //txt.outlinetext(status, 80, yres-5, [1, 1, 0], [0, 0, 0]);

  // COLLISIONS

  collisions(CL.cat, CL.mob);
  collisions(CL.frf, CL.mob);

  for (const o of Cmp.flickerers) {
    o.visible = (frame >> 0) & 1;
    o.invuln--;

    if (o.invuln <= 0) {
      o.invulnerable = false;
      o.visible = true;
      o.invulnfunc();
    }
  }

  for (const o of Cmp.movers) {
    o.movefunc(frame);
  }
  for (const o of Cmp.speeders) {
    o.posx += o.velx;
    o.posy += o.vely;
  }
  for (const o of Cmp.clippers) {
    if (
      o.posx < -o.marginx ||
      o.posy < -o.marginy ||
      o.posx > xres + o.marginx ||
      o.posy > yres + o.marginy
    )
      o.remove();
  }

  // DIFFICULTY INCREASING

  function spawnclocks(howMany, shootChance, steerChance) {
    for (let i = 0; i < howMany - VL.mob.size; i++) {
      Clock(shootChance, steerChance, () => {
        points += 10;
      });
    }
  }

  if (!win) {
    if (points >= 500) {
      win = true;
      VL.bkg.forEach((o) => o.hasMovement(() => {}));
      VL.mob.forEach((o) => o.remove());
      VL.enf.forEach((o) => o.remove());
      Text(120, 110, () => "CONGRATS, YOU WIN!", [1, 1, 1], [0, 0, 0]);
      Entity()
        .hasPos(160, walkline)
        .hasSprite(VL.mob, poses.cake_1, poses.cake_0);
      SFX.stopAll();
      SFX.play("win.mp3", true);
    } else if (points >= 400) spawnclocks(7, 10, 10);
    else if (points >= 300) spawnclocks(6, 5, 5);
    else if (points >= 200) spawnclocks(5, 5, 3.3);
    else if (points >= 150) spawnclocks(4, 2.5, 2.5);
    else if (points >= 100) spawnclocks(3, 2.5, 2);
    else if (points >= 50) spawnclocks(2, 0, 1.6);
    else spawnclocks(1, 0, 0);
  }

  for (const o of Cmp.removers) {
    for (const s of o.sets) s.delete(o);
  }
  Cmp.removers.clear();
  keytrigs.clear();

  for (const o of Cmp.deferrers) {
    o();
  }
  Cmp.deferrers.clear();

  frame++;
  window.requestAnimationFrame(step);
}

function init() {
  clearSetObjs(VL, CL, Cmp);
  points = 0;
  win = false;
  SFX.stopAll();
  SFX.play("ingame.mp3", true);
  Background(0);
  Background(xres);
  Text(
    25,
    6,
    () => "A CAT'S DREAM - Use Cursors and Space - crouch to jump higher",
    [1, 1, 0],
    [0.1, 0.1, 0.1]
  );
  Text(
    10,
    yres - 5,
    () => "Lives: " + cat.lives,
    [1.0, 0.5, 0.5],
    [0.1, 0.1, 0.1]
  );
  Text(
    240,
    yres - 5,
    () => "Points: " + points,
    [0.5, 0.5, 1.0],
    [0.1, 0.1, 0.1]
  );

  cat = Cat(40, walkline, () => {
    Text(
      120,
      110,
      () => "GAME OVER, BUT TRY AGAIN!",
      [1.0, 1.0, 1.0],
      [0.0, 0.0, 0.0]
    );
    SFX.stopAll();
    SFX.play("die.mp3", true);
  });
}

function keydown(e) {
  if(keystate[e.keyCode]) return;
  keystate[e.keyCode] = true;
  keytrigs.add(e.keyCode);
}
function keyup(e) {
  keystate[e.keyCode] = false;
}

async function preload(as, suffix, callback) {
  let elements = document.querySelectorAll(
    'link[as="' + as + '"][href$="' + suffix + '"]'
  );
  for (let i = 0; i < elements.length; i++) {
    let href = elements[i].attributes["href"].nodeValue;
    let v = href.substring(5);
    await callback(v, elements[i].href);
  }
}

async function load() {
  canvas = document.getElementById("gamecanvas");
  xres = canvas.width;
  yres = canvas.height;

  gfx = GFX_Webgl(canvas);
  if (gfx === undefined) {
    console.log("WebGL not available, falling back to HTML5 Canvas");
    gfx = GFX_Canvas(canvas);
  }

  preload("image", ".png", (v, href) => {
    let i = new Image();
    i.onload = () => {
      gfx.loadTexture(v, i);
    };
    i.src = href;
  });

  await preload("fetch", ".mp3", async (v, href) => {
    const res = await fetch(href);
    const buf = await res.arrayBuffer();
    SFX.load(v, buf);
  });

  await preload("fetch", ".json", async (v, href) => {
    const res = await fetch(href);
    jsons[v] = await res.json();
  });

  poses = jsons["layers.json"];

  txt = TXT(gfx, jsons["gamefont.json"]);

  canvas.addEventListener("keydown", keydown);
  canvas.addEventListener("keyup", keyup);

  document.getElementById("sound_icon").addEventListener("click", () => {
    SFX.setMuted(!SFX.isMuted());
  });
  document.getElementById("music_icon").addEventListener("click", () => {
    SFX.setLoopMuted(!SFX.isLoopMuted());
  });
  document.getElementById("restart_icon").addEventListener("click", () => {
    init();
  });

  init();
  window.requestAnimationFrame(step);
}

window.addEventListener("load", load);

export { CL, VL, Cmp, poses, keystate, keytrigs, rand, dice };
