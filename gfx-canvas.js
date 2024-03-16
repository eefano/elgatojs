var ctx;

var images = {};

function outlinetext(text, x, y, fore, back) {
  ctx.fillStyle = back;
  ctx.fillText(text, x, y);
  ctx.fillText(text, x + 1, y);
  ctx.fillText(text, x + 2, y);
  ctx.fillText(text, x, y + 1);
  ctx.fillText(text, x + 2, y + 1);
  ctx.fillText(text, x, y + 2);
  ctx.fillText(text, x + 1, y + 2);
  ctx.fillText(text, x + 2, y + 2);
  ctx.fillStyle = fore;
  ctx.fillText(text, x + 1, y + 1);
}

function gfx_canvas(canvas) {
  ctx = canvas.getContext("2d");
  ctx.font = "8px ElGato";

  return {
    drawTexture: (name, x, y, r, g, b) => {
      ctx.drawImage(images[name], x, y);
    },

    loadTexture: (name, image) => {
      images[name] = image;
    },
  };
}

export { gfx_canvas };
