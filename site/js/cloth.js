/* Cloth: every garment hangs as a real sheet of fabric.
   Ported from the Woven Cloth component (Three.js r160): the same Verlet sheet,
   constraint solver, pinned top row and gusting wind, but the texture is the
   garment's own photo (or illustration) instead of a printed banner.
   One shared ticker drives every visible garment; offscreen ones pause. */
(function () {
  if (!window.THREE) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const BW = 2, BH = 2.2;            // same 10:11 shape as the 1600 x 1760 photos
  const GX = 26, GY = 28;
  const GRAV = -3.1, DAMP = 0.985, DT = 0.016;
  const PAD = 1.12;                  // the canvas is 12% larger than the garment box (CSS inset -6%)
  const live = new Set();
  let raf = 0;

  function tick() {
    raf = 0;
    live.forEach((c) => c.frame());
    if (live.size) raf = requestAnimationFrame(tick);
  }
  const wake = () => { if (!raf && live.size) raf = requestAnimationFrame(tick); };

  // draw the garment (img or inline svg) into a canvas we can upload as a texture
  function sourceCanvas(el) {
    return new Promise((resolve, reject) => {
      const draw = (img) => {
        const c = document.createElement("canvas");
        c.width = 1024; c.height = 1126;
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c);
      };
      if (el.tagName === "IMG") {
        const go = () => (el.naturalWidth ? draw(el) : reject(new Error("image failed")));
        if (el.complete) go(); else { el.addEventListener("load", go, { once: true }); el.addEventListener("error", reject, { once: true }); }
        if (el.loading === "lazy") el.loading = "eager";
      } else {
        const img = new Image();
        img.onload = () => draw(img); img.onerror = reject;
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(el));
      }
    });
  }

  function Cloth(host, opts) {
    this.host = host;
    this.o = Object.assign({ strength: 1, res: 1, opacity: 1, glow: 0 }, opts);
    this.src = host.querySelector(":scope > img.garment, :scope > svg.garment");
    this.canvas = document.createElement("canvas");
    this.canvas.className = "cloth-canvas";
    this.canvas.setAttribute("aria-hidden", "true");
    host.appendChild(this.canvas);
    host.classList.add("is-cloth");
    this.gust = 0; this.gustTarget = 0;
    this.turn = 0; this.turnV = 0; this.turnTarget = 0;  // radians around the vertical axis (drag to turn)
    this.phase = Math.random() * 10;
    this.visible = false; this.built = false; this.dead = false;
    this.io = new IntersectionObserver((ents) => {
      this.visible = ents[ents.length - 1].isIntersecting;
      if (this.visible && !this.built) this.build();
      if (this.visible && this.built && !reduce) { live.add(this); wake(); } else live.delete(this);
    }, { rootMargin: "200px" });
    this.io.observe(host);
  }

  Cloth.prototype.build = function () {
    this.built = true;
    sourceCanvas(this.src).then((sc) => {
      this.alphaSrc = sc.getContext("2d");
      if (this.dead) return;
      const r = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, premultipliedAlpha: false });
      r.setClearColor(0x000000, 0);
      this.renderer = r;
      const tex = new THREE.CanvasTexture(sc);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      this.geo = new THREE.PlaneGeometry(BW, BH, GX, GY);
      this.mat = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, alphaTest: 0.04, opacity: this.o.opacity, depthWrite: this.o.opacity >= 1 });
      if (this.o.glow) { this.mat.emissive = new THREE.Color(0xffffff); this.mat.emissiveMap = tex; this.mat.emissiveIntensity = this.o.glow; }
      this.tex = tex;
      this.scene = new THREE.Scene();
      this.mesh = new THREE.Mesh(this.geo, this.mat);
      this.scene.add(this.mesh);
      this.scene.add(new THREE.AmbientLight(0xfff8f0, 2.15));
      const key = new THREE.DirectionalLight(0xfff4e6, 1.5);
      key.position.set(-1.2, 2.2, 3.2);
      this.scene.add(key);

      // Verlet state, exactly as the source: current, previous and rest positions
      const pos = this.geo.attributes.position, N = (GX + 1) * (GY + 1);
      this.cur = new Float32Array(N * 3); this.prev = new Float32Array(N * 3); this.rest = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        this.cur[i * 3] = this.prev[i * 3] = this.rest[i * 3] = pos.getX(i);
        this.cur[i * 3 + 1] = this.prev[i * 3 + 1] = this.rest[i * 3 + 1] = pos.getY(i);
      }
      this.t = 0;
      for (let s = 0; s < 40; s++) { this.t += DT; this.step(); }
      this.fit();
      this.ro = new ResizeObserver(() => { this.fit(); this.render(); });
      this.ro.observe(this.host);
      this.render();
      this.host.classList.add("cloth-ready");
      if (this.o.interactive) this.bindHands();
      if (this.visible && !reduce) { live.add(this); wake(); }
    }).catch(() => this.destroy(true));
  };

  // the wind from the source, scaled down: a garment on a body sways, it doesn't fly like a flag
  Cloth.prototype.wind = function (ix, iy) {
    const t = this.t + this.phase, cx = ix / GX, cy = iy / GY;
    const travel = t * 1.4 - cy * 3.2;
    const gust = 0.6 + 0.3 * Math.sin(t * 0.5) + 0.15 * Math.sin(t * 1.7 + 1.3);
    const amp = this.o.strength * (1 + this.gust * 1.6) * cy;
    const fz = (Math.sin(travel + cx * 2.6) + 0.4 * Math.sin(travel * 1.6 + cx * 5.0)) * amp * gust;
    const fx = Math.sin(t * 0.8 + cy * 2.0) * 0.22 * cy * this.o.strength;
    return [fx, -0.3 * cy, fz];
  };

  Cloth.prototype.solve = function (a, b, rl, pa, pb) {
    const c = this.cur;
    let dx = c[b * 3] - c[a * 3], dy = c[b * 3 + 1] - c[a * 3 + 1], dz = c[b * 3 + 2] - c[a * 3 + 2];
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
    const diff = (d - rl) / d * 0.5;
    dx *= diff; dy *= diff; dz *= diff;
    if (!pa && !pb) { c[a * 3] += dx; c[a * 3 + 1] += dy; c[a * 3 + 2] += dz; c[b * 3] -= dx; c[b * 3 + 1] -= dy; c[b * 3 + 2] -= dz; }
    else if (pa && !pb) { c[b * 3] -= dx * 2; c[b * 3 + 1] -= dy * 2; c[b * 3 + 2] -= dz * 2; }
    else if (!pa && pb) { c[a * 3] += dx * 2; c[a * 3 + 1] += dy * 2; c[a * 3 + 2] += dz * 2; }
  };

  Cloth.prototype.step = function () {
    const c = this.cur, p = this.prev, rest = this.rest, W = GX + 1;
    for (let iy = 1; iy <= GY; iy++) {              // row 0 is pinned (the shoulders / waistband)
      for (let ix = 0; ix <= GX; ix++) {
        const i = ix + iy * W, f = this.wind(ix, iy);
        for (let k = 0; k < 3; k++) {
          const j = i * 3 + k, a = k === 0 ? f[0] : k === 1 ? f[1] + GRAV : f[2];
          const v = (c[j] - p[j]) * DAMP;
          p[j] = c[j]; c[j] = c[j] + v + a * DT * DT;
        }
      }
    }
    const rh = BW / GX, rv = BH / GY;
    for (let it = 0; it < 3; it++) {
      for (let iy = 0; iy <= GY; iy++) for (let ix = 0; ix < GX; ix++) this.solve(ix + iy * W, ix + 1 + iy * W, rh, iy === 0, iy === 0);
      for (let iy = 0; iy < GY; iy++) for (let ix = 0; ix <= GX; ix++) this.solve(ix + iy * W, ix + (iy + 1) * W, rv, iy === 0, false);
    }
    for (let ix = 0; ix <= GX; ix++) for (let k = 0; k < 3; k++) { c[ix * 3 + k] = p[ix * 3 + k] = rest[ix * 3 + k]; }
    if (this.grab) {   // a hand holding the fabric: a soft patch around the grabbed point follows the pointer (fingers, not a needle)
      const g = this.grab;
      g.patch.forEach((n) => {
        const j = n.i * 3;
        c[j] += (g.x + n.dx - c[j]) * n.w; c[j + 1] += (g.y + n.dy - c[j + 1]) * n.w; c[j + 2] += (g.z + n.dz - c[j + 2]) * n.w;
      });
    }
  };

  Cloth.prototype.fit = function () {
    const w = this.canvas.clientWidth || 1, h = this.canvas.clientHeight || 1;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2) * this.o.res);
    this.renderer.setSize(w, h, false);
    const aspect = w / h, half = Math.tan(15 * Math.PI / 180);
    this.camera = new THREE.PerspectiveCamera(30, aspect, 0.1, 50);
    this.camera.position.set(0, 0, Math.max((BH * PAD / 2) / half, (BW * PAD / 2) / half / aspect));
    this.camera.lookAt(0, 0, 0);
  };

  Cloth.prototype.render = function () {
    const pos = this.geo.attributes.position, c = this.cur;
    for (let i = 0; i < pos.count; i++) pos.setXYZ(i, c[i * 3], c[i * 3 + 1], c[i * 3 + 2]);
    pos.needsUpdate = true;
    this.geo.computeVertexNormals();
    this.renderer.render(this.scene, this.camera);
  };

  /* hands: drag on the fabric to pull it, drag around it to turn it any way, double-click to reset */
  Cloth.prototype.bindHands = function () {
    const area = this.o.area || this.host, canvas = this.canvas;
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(), hit = new THREE.Vector3();
    let mode = null, lastX = 0, id = null;
    const toNdc = (e) => { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, this.camera); };
    const onFabric = (e) => {
      toNdc(e);
      this.geo.computeBoundingSphere();
      const h = ray.intersectObject(this.mesh)[0];
      if (!h || !h.uv) return null;
      // only count it as fabric where the garment is actually drawn (not the empty corners of the sheet)
      const px = Math.floor(h.uv.x * 1023), py = Math.floor((1 - h.uv.y) * 1125);
      if (this.alphaSrc.getImageData(px, py, 1, 1).data[3] < 40) return null;
      const f = h.face; const pos = this.geo.attributes.position; let best = f.a, bd = Infinity;
      [f.a, f.b, f.c].forEach((v) => { const d = new THREE.Vector3().fromBufferAttribute(pos, v).applyMatrix4(this.mesh.matrixWorld).distanceTo(h.point); if (d < bd) { bd = d; best = v; } });
      return best >= GX + 1 ? { i: best, point: h.point.clone() } : null;   // the pinned shoulder row can't be grabbed
    };
    // touch screens: a vertical swipe always scrolls the page; a sideways swipe turns the garment; pulling is mouse-only
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    area.style.touchAction = coarse ? "pan-y" : "none";
    area.addEventListener("pointerdown", (e) => {
      if (id !== null || !this.mesh || e.target.closest("button, a, input, select, label")) return;
      const f = e.pointerType === "touch" ? null : onFabric(e);
      id = e.pointerId; lastX = e.clientX;
      try { area.setPointerCapture(id); } catch (err) { /* ignore */ }
      if (f) {
        mode = "pull";
        plane.setFromNormalAndCoplanarPoint(this.camera.getWorldDirection(new THREE.Vector3()).negate(), f.point);
        const local = this.mesh.worldToLocal(f.point.clone());
        // the patch: vertices within two grid cells, pulled with less force the further they are from the finger
        const gx = f.i % (GX + 1), gy = Math.floor(f.i / (GX + 1)), c = this.cur, patch = [];
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          const x = gx + dx, y = gy + dy; if (x < 0 || x > GX || y < 1 || y > GY) continue;
          const d = Math.hypot(dx, dy); if (d > 2.3) continue;
          const i = x + y * (GX + 1);
          patch.push({ i, w: d === 0 ? 1 : 0.55 / d, dx: c[i * 3] - c[f.i * 3], dy: c[i * 3 + 1] - c[f.i * 3 + 1], dz: c[i * 3 + 2] - c[f.i * 3 + 2] });
        }
        this.grab = { i: f.i, x: local.x, y: local.y, z: local.z, patch };
      } else mode = "turn";
      area.classList.add(mode === "pull" ? "is-pulling" : "is-turning");
      live.add(this); wake();
    });
    area.addEventListener("pointermove", (e) => {
      if (e.pointerId !== id) {   // hover: show a grab hand over the fabric
        if (id === null && this.mesh && e.pointerType === "mouse") area.classList.toggle("over-fabric", !!onFabric(e));
        return;
      }
      if (mode === "pull") {
        toNdc(e);
        if (ray.ray.intersectPlane(plane, hit)) { const l = this.mesh.worldToLocal(hit.clone()); Object.assign(this.grab, { x: l.x, y: l.y, z: l.z }); }
      } else {
        this.turnTarget += (e.clientX - lastX) * 0.012; lastX = e.clientX;
      }
    });
    const end = (e) => { if (e.pointerId !== id) return; id = null; mode = null; this.grab = null; area.classList.remove("is-pulling", "is-turning"); };
    area.addEventListener("pointerup", end); area.addEventListener("pointercancel", end);
    area.addEventListener("dblclick", () => { this.turnTarget = 0; });
    // keyboard: arrows turn it
    area.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); this.turnTarget += e.key === "ArrowRight" ? 0.35 : -0.35; live.add(this); wake(); } });
  };

  Cloth.prototype.frame = function () {
    if (!this.renderer) return;
    this.gust += (this.gustTarget - this.gust) * 0.04;
    // turning: a damped spring, and fast turns make the fabric swing out
    this.turnV = (this.turnV + (this.turnTarget - this.turn) * 0.09) * 0.8;
    this.turn += this.turnV;
    this.mesh.rotation.y = this.turn;
    this.gust = Math.max(this.gust, Math.min(1, Math.abs(this.turnV) * 14));
    this.t += DT; this.step(); this.render();
  };

  Cloth.prototype.destroy = function (failed) {
    this.dead = true;
    live.delete(this);
    if (this.io) this.io.disconnect();
    if (this.ro) this.ro.disconnect();
    if (this.renderer) { this.geo.dispose(); this.mat.dispose(); this.tex.dispose(); this.renderer.dispose(); this.renderer.forceContextLoss(); }
    this.canvas.remove();
    this.host.classList.remove("is-cloth", "cloth-ready");
    if (this.host.__cloth === this) delete this.host.__cloth;
    if (failed) this.host.classList.add("cloth-failed");
  };

  window.UNOCloth = {
    mount(host, opts) {
      if (!host) return null;
      if (host.__cloth) host.__cloth.destroy();
      if (!host.querySelector(":scope > img.garment, :scope > svg.garment")) return null;
      host.__cloth = new Cloth(host, opts);
      return host.__cloth;
    },
    gust(host, on) { if (host && host.__cloth) { host.__cloth.gustTarget = on ? 1 : 0; } },
    // turn the garment around its vertical axis (degrees); without live animation it jumps straight there
    turn(host, deg) {
      const c = host && host.__cloth; if (!c) return;
      c.turnTarget = deg * Math.PI / 180;
      if (c.mesh && !live.has(c)) { c.turn = c.turnTarget; c.mesh.rotation.y = c.turn; c.render(); }
    },
  };
})();
