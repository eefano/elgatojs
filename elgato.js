"use strict";

var xres, yres, canvas, gl;
var keystate = [];
var keytrigs = new Set();

var frame = 0;
var points = 0;
var win = false;
var pixadjust = 0;

var sounds = {};
var images = {};
var textures = {};
var poses;
var glyphs;

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

function drawTexture(t, x, y, r, g, b) {
  //gl.pushMatrix();
  //gl.translatef(x,y, 0);

  gl.bindTexture(gl.TEXTURE_2D, t.id);
  gl.color3f(r,g,b);

  gl.Begin(gl.QUADS);
  gl.TexCoord2f(0.0, 0.0);
  gl.Vertex2f(0.0, 0.0);
  gl.TexCoord2f(0.0, t.uv.y);
  gl.Vertex2f(0.0, t.size.y);
  gl.TexCoord2f(t.uv.x, t.uv.y);
  gl.Vertex2f(t.size.x, t.size.y);
  gl.TexCoord2f(t.uv.x, 0.0);
  gl.Vertex2f(t.size.x, 0.0);
  gl.End();

  gl.PopMatrix();
}

function validsize(n) {
  var ok = 2;
  while (ok < n) ok = ok << 1;
  return ok;
}
function loadTexture(image) {
  const id = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, id);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8I, gl.RGBA, gl.GL_UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  return {
    id: id,
    size: { x: image.width, y: image.height },
    uv: {
      x: image.width / validsize(image.width),
      y: image.height / validsize(image.height),
    },
  };
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

			insertqueue[MOB_ffire]->push_back(new Lazor( pos + eyes - base , Vector(dx,dy)));
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
        drawTexture(
          textures[o.pose.img],
          o.pos[0] + o.pose.xof - o.base.xof + pixadjust,
          o.pos[1] + o.pose.yof - o.base.yof + pixadjust,
          1,1,1
        );
      }
    }
  }
}

function step() {
  /*
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  for(let i=0.5;i<xres;i+=2) 
  {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, yres);
    ctx.stroke();
  }
  */

  //drawlayers(bkglayer, moblayer, catlayer, shtlayer);

  for (const o of movers) {
    o.movefunc(o);
  }

  for (const o of removers) {
    for (const s of o.sets) s.delete(o);
  }
  removers.clear();
  keytrigs.clear();

  /*
  ctx.font = "8px ElGato";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.strokeText("Hello world", 11.0, 50.0);
  ctx.fillStyle = "orangered";
  ctx.fillText("Hello world", 11.0 + ((frame>>8)&1), 50.0);
  */

  frame++;
  window.requestAnimationFrame(step);
}

function init() {
  points = 0;
  win = false;
  //sfondo(0);
  //sfondo(xres);
  cat();
}

function resize() {
  var h = window.innerHeight;
  var w = window.innerWidth;

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

  canvas.style.width = xres * k + "px";
  canvas.style.height = yres * k + "px";
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

function preload(what, where, onload, elements) {
  elements.forEach((e)=> {
    let v=e.getAttribute('id');
    console.log(v);
    where[v] = new what();
    where[v].onload = () => {
      onload(v);
    };
    where[v].src = "data/" + v;
  });
}

async function load() {

  canvas = document.querySelector("canvas");
  xres = canvas.width;
  yres = canvas.height;

  gl = canvas.getContext("webgl");

  const program = gl.createProgram();
  const vshader = gl.createShader(gl.VERTEX_SHADER);
  gl.attachShader(program, vshader);
  gl.shaderSource(vshader, `
  attribute vec2 aPos;
  uniform vec2 uOff,uSiz,uRes;
  void main() {
    gl_Position = vec4((aPos.x*uSiz.x+uOff.x)*2.0/uRes.x-1.0, 1.0-(aPos.y*uSiz.y+uOff.y)*2.0/uRes.y, 0.0, 1.0);
    gl_PointSize = 64.0;
  }
  `);
  gl.compileShader(vshader);
  const fshader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.attachShader(program, fshader);
  gl.shaderSource(fshader, `
precision mediump float;

float checkboard(vec2 st, float tilesize) {
  vec2 pos = mod(st, tilesize * 2.0);
  return mod(step(tilesize, pos.x) + step(tilesize, pos.y), 2.0);
}
void main(){
    float c = checkboard(gl_FragCoord.xy, 1.0);
    gl_FragColor = vec4(gl_FragCoord.x,gl_FragCoord.y,0, 1.0);
}
`);
  gl.compileShader(fshader);
  gl.linkProgram(program);
  gl.useProgram(program);

  let vertexArray = new Float32Array([
    0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0,
  ]);

  let vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);

  gl.uniform2f(gl.getUniformLocation(program, "uRes"), xres, yres);
 
  let aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  gl.uniform2f(gl.getUniformLocation(program, "uOff"), 160,120);
  gl.uniform2f(gl.getUniformLocation(program, "uSiz"), 160,120);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  gl.uniform2f(gl.getUniformLocation(program, "uOff"), 10,10);
  gl.uniform2f(gl.getUniformLocation(program, "uSiz"), 50,50);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  preload(Image, images, (k) => { textures[k] = loadTexture(images[k]); },
          document.querySelectorAll('link[rel="preload"][as="image"]'));

  preload(
    Audio,
    sounds,
    ()=>{},
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

  await fetch("data/gamefont.json")
    .then((response) => response.json())
    .then((parsed) => {
      glyphs = parsed;
    });

  resize();
  canvas.focus();

  canvas.addEventListener("keydown", keydown, true);
  canvas.addEventListener("keyup", keyup, true);
  window.addEventListener("resize", resize);

  init();
  window.requestAnimationFrame(step);
}

console.log("HEY!");
window.addEventListener('load', load);
