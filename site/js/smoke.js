/* Smoke: a translucent, drifting smoke field (domain-warped fbm noise in a WebGL fragment shader).
   Thin smoke stays see-through, so whatever sits behind it shows. Pauses offscreen. */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const VERT = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";
  const FRAG = `
precision mediump float;
uniform vec2 uRes; uniform float uTime; uniform vec3 uColor; uniform vec3 uDeep; uniform float uAlpha; uniform float uScale; uniform float uSeed;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes; vec2 p = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0) * uScale + uSeed;
  float t = uTime;
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.06)), fbm(p + vec2(5.2, 1.3) - vec2(t * 0.05, 0.0)));
  vec2 r = vec2(fbm(p + 3.6 * q + vec2(1.7, 9.2) + t * 0.04), fbm(p + 3.6 * q + vec2(8.3, 2.8) - t * 0.03));
  float d = fbm(p + 3.2 * r);
  float dens = smoothstep(0.24, 0.78, d) * (0.55 + 0.6 * q.x);
  vec3 col = mix(uDeep, uColor, clamp(d * 1.25 - 0.1, 0.0, 1.0));
  col += vec3(1.0, 0.9, 0.85) * pow(max(0.0, d - 0.62), 2.0) * 1.6;
  float a = clamp(dens * uAlpha, 0.0, 1.0);
  gl_FragColor = vec4(col * a, a);
}`;
  const hex = (h) => { const n = parseInt(h.replace("#", ""), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const live = new Set(); let raf = 0;
  const tick = (now) => { raf = 0; live.forEach((s) => s.draw(now / 1000)); if (live.size) raf = requestAnimationFrame(tick); };

  function Smoke(host, opts) {
    const o = Object.assign({ color: "#D7262B", deep: "#6E1414", alpha: 0.9, scale: 2.4, speed: 1, res: 0.7 }, opts);
    const c = document.createElement("canvas");
    c.className = "smoke-canvas"; c.setAttribute("aria-hidden", "true");
    host.appendChild(c);
    const gl = c.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) { c.remove(); return; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { c.remove(); return; }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (n) => gl.getUniformLocation(prog, n);
    gl.uniform3fv(u("uColor"), hex(o.color)); gl.uniform3fv(u("uDeep"), hex(o.deep));
    gl.uniform1f(u("uAlpha"), o.alpha); gl.uniform1f(u("uScale"), o.scale); gl.uniform1f(u("uSeed"), o.seed || Math.random() * 20);
    const uRes = u("uRes"), uTime = u("uTime");
    const fit = () => {
      const w = Math.max(2, Math.round(c.clientWidth * o.res)), h = Math.max(2, Math.round(c.clientHeight * o.res));
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; gl.viewport(0, 0, w, h); gl.uniform2f(uRes, w, h); }
    };
    const t0 = performance.now() / 1000 - 30;
    this.draw = (now) => { fit(); gl.uniform1f(uTime, (now - t0) * o.speed); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
    new ResizeObserver(() => { fit(); if (reduce || !live.has(this)) this.draw(performance.now() / 1000); }).observe(c);
    new IntersectionObserver((ents) => {
      const vis = ents[ents.length - 1].isIntersecting;
      if (vis && !reduce) { live.add(this); if (!raf) raf = requestAnimationFrame(tick); } else live.delete(this);
    }).observe(host);
    this.draw(performance.now() / 1000);
  }
  window.UNOSmoke = { mount: (host, opts) => (host ? new Smoke(host, opts) : null) };
})();
