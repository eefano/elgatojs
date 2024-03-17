function GFX_Canvas(canvas) {
  let ctx = canvas.getContext("2d");
  let textures = {};

  ctx.font = "8px ElGato";

  function drawTexture(name, x, y) {
    const t = textures[name];
    ctx.drawImage(t.tinted ? t.buffer : t.img, x, y);
  }

  function drawSubTexture(name, sx, sy, sw, sh, dx, dy) {
    const t = textures[name];
    ctx.drawImage(t.tinted ? t.buffer : t.img, sx, sy, sw, sh, dx, dy, sw, sh);
  }

  function loadTexture(name, image) {
    textures[name] = {
      img: image,
      size: { x: image.width, y: image.height },
      tinted: false,
    };
  }

  function tintTexture(name, color) {
    const t = textures[name];

    if (t.buffer === undefined) {
      t.buffer = document.createElement("canvas");
      t.buffer.width = t.img.width;
      t.buffer.height = t.img.height;
      t.btx = t.buffer.getContext("2d");
    }

    t.btx.globalCompositeOperation = "copy";
    t.btx.drawImage(t.img, 0, 0);

    t.btx.fillStyle = "rgb(" + color.r + "," + color.g + "," + color.b + ")";
    t.btx.globalCompositeOperation = "multiply";
    t.btx.fillRect(0, 0, t.img.width, t.img.height);

    t.btx.globalCompositeOperation = "destination-atop";
    t.btx.drawImage(t.img, 0, 0);
    t.tinted = true;
  }

  function untintTexture(name) {
    textures[name].tinted = false;
  }

  function getTextureSize(name) {
    return textures[name].size;
  }

  return {
    drawTexture,
    drawSubTexture,
    loadTexture,
    tintTexture,
    untintTexture,
    getTextureSize,
  };
}

export { GFX_Canvas };
