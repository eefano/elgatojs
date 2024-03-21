function GFX_Webgl(canvas) {
  let gl =
    canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (!(gl instanceof WebGLRenderingContext)) return undefined;
  let textures = {};
  let uniforms = {};

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  let program = gl.createProgram();
  const vshader = gl.createShader(gl.VERTEX_SHADER);
  gl.attachShader(program, vshader);
  gl.shaderSource(
    vshader,
    `
  attribute vec2 aPos;
  attribute vec2 aTex;
  uniform vec2 uOff,uSiz,uRes;
  varying highp vec2 vTex;
  void main() {
    gl_Position = vec4((aPos.x*uSiz.x+uOff.x)*2.0/uRes.x-1.0, 1.0-(aPos.y*uSiz.y+uOff.y)*2.0/uRes.y, 0.0, 1.0);
    vTex = aPos;
  }
  `
  );
  gl.compileShader(vshader);
  const fshader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.attachShader(program, fshader);
  gl.shaderSource(
    fshader,
    `
  varying highp vec2 vTex;
  uniform sampler2D uSampler;
  uniform lowp vec4 uCol;
  uniform highp vec2 uTxy,uTwh;
  void main(void) {
    gl_FragColor = texture2D(uSampler, vTex*uTwh+uTxy) * uCol;
  }
  `
  );
  gl.compileShader(fshader);
  gl.linkProgram(program);
  gl.useProgram(program);

  uniforms["uOff"] = gl.getUniformLocation(program, "uOff");
  uniforms["uCol"] = gl.getUniformLocation(program, "uCol");
  uniforms["uSiz"] = gl.getUniformLocation(program, "uSiz");
  uniforms["uTwh"] = gl.getUniformLocation(program, "uTwh");
  uniforms["uTxy"] = gl.getUniformLocation(program, "uTxy");

  let vertexArray = new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]);

  let vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);

  gl.uniform2f(
    gl.getUniformLocation(program, "uRes"),
    canvas.width,
    canvas.height
  );

  let aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  function drawTexture(name, dx, dy) {
    const tex = textures[name];
    drawSubTexture(name, 0, 0, tex.size.x, tex.size.y, dx, dy);
  }

  function drawSubTexture(name, sx, sy, sw, sh, dx, dy) {
    const tex = textures[name];
    gl.bindTexture(gl.TEXTURE_2D, tex.id);
    gl.uniform2f(uniforms["uOff"], dx, dy);
    gl.uniform4fv(uniforms["uCol"], tex.color);
    gl.uniform2f(uniforms["uSiz"], sw, sh);
    gl.uniform2f(uniforms["uTwh"], sw / tex.size.x, sh / tex.size.y);
    gl.uniform2f(uniforms["uTxy"], sx / tex.size.x, sy / tex.size.y);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function loadTexture(name, image) {
    const id = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, id);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    textures[name] = {
      id: id,
      size: { x: image.width, y: image.height },
      color: new Float32Array([1, 1, 1, 1]),
    };
  }

  function tintTexture(name, color) {
    const tex = textures[name];
    tex.color[0] = color[0];
    tex.color[1] = color[1];
    tex.color[2] = color[2];
  }

  function untintTexture(name) {
    const tex = textures[name];
    tex.color[0] = 1;
    tex.color[1] = 1;
    tex.color[2] = 1;
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

export { GFX_Webgl };
