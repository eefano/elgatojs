function TXT(gfx, font) {
  function normaltext(text, xo, yo) {
    let x = xo,
      y = yo;
    for (let i = 0; i < text.length; i++) {
      let c = text.charCodeAt(i);
      let g = font.glyphs[c - 32];

      if (c == 10) {
        y += font.height;
        x = xo;
      } else {
        gfx.drawSubTexture(
          font.img,
          g.x,
          g.y,
          g.width,
          g.height,
          x + g.xoffset,
          y + g.yoffset
        );
        x += g.xadvance;
      }
    }
  }

  function outlinetext(text, x, y, fore, back) {
    gfx.tintTexture(font.img, back);
    normaltext(text, x, y);
    normaltext(text, x + 1, y);
    normaltext(text, x + 2, y);
    normaltext(text, x, y + 1);
    normaltext(text, x + 2, y + 1);
    normaltext(text, x, y + 2);
    normaltext(text, x + 1, y + 2);
    normaltext(text, x + 2, y + 2);
    gfx.tintTexture(font.img, fore);
    normaltext(text, x + 1, y + 1);
  }

  return { outlinetext };
}

export { TXT };
