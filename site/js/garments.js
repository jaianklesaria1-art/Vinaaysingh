/* Illustrated garment cut-outs (stand-ins for product photography). */
(function () {
  let uid = 0;

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function grey(hex) {
    const n = parseInt(hex.slice(1), 16);
    const v = Math.round(0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255));
    const h = v.toString(16).padStart(2, "0");
    return "#" + h + h + h;
  }

  const shapes = {
    tee: (c, s) => `
      <path d="M128 52 C150 74 250 74 272 52 L352 92 L326 172 L290 156 L292 404 L108 404 L110 156 L74 172 L48 92 Z" fill="${c}"/>
      <path d="M160 56 C178 88 222 88 240 56" fill="none" stroke="${s}" stroke-width="5"/>
      <path d="M110 156 L108 404 M290 156 L292 404" stroke="${s}" stroke-width="2" opacity=".5"/>
      <path d="M112 392 L288 392" stroke="${s}" stroke-width="2" stroke-dasharray="5 6" opacity=".6"/>
      <path d="M74 172 L48 92 M326 172 L352 92" stroke="${s}" stroke-width="2" opacity=".4"/>`,
    hoodie: (c, s) => `
      <path d="M140 70 C150 18 250 18 260 70 L350 112 L370 330 L330 336 L312 180 L300 410 L100 410 L88 180 L70 336 L30 330 L50 112 Z" fill="${c}"/>
      <path d="M152 86 C152 30 248 30 248 86 C230 112 170 112 152 86 Z" fill="${s}" opacity=".35"/>
      <path d="M186 104 L182 176 M214 104 L218 176" stroke="${s}" stroke-width="3"/>
      <circle cx="182" cy="180" r="4" fill="${s}"/><circle cx="218" cy="180" r="4" fill="${s}"/>
      <path d="M140 270 L260 270 L278 350 L122 350 Z" fill="none" stroke="${s}" stroke-width="3" opacity=".7"/>
      <path d="M102 382 L298 382 M72 314 L106 318 M328 314 L294 318" stroke="${s}" stroke-width="3" opacity=".55"/>`,
    cargo: (c, s) => `
      <path d="M118 40 L282 40 L300 410 L218 410 L200 150 L182 410 L100 410 Z" fill="${c}"/>
      <path d="M118 40 L282 40 L284 70 L116 70 Z" fill="${s}" opacity=".3"/>
      <path d="M150 70 L150 100 M250 70 L250 100 M200 70 L200 150" stroke="${s}" stroke-width="2.5" opacity=".7"/>
      <rect x="108" y="200" width="54" height="66" rx="4" fill="none" stroke="${s}" stroke-width="3" opacity=".7"/>
      <rect x="238" y="200" width="54" height="66" rx="4" fill="none" stroke="${s}" stroke-width="3" opacity=".7"/>
      <path d="M108 214 L162 214 M238 214 L292 214" stroke="${s}" stroke-width="3" opacity=".7"/>
      <path d="M104 392 L180 392 M220 392 L296 392" stroke="${s}" stroke-width="3" stroke-dasharray="4 5" opacity=".6"/>`,
    overshirt: (c, s) => `
      <path d="M134 48 L266 48 L352 96 L376 340 L336 346 L314 172 L304 410 L96 410 L86 172 L64 346 L24 340 L48 96 Z" fill="${c}"/>
      <path d="M134 48 L170 92 L200 66 L230 92 L266 48 L238 44 L200 60 L162 44 Z" fill="${s}" opacity=".4"/>
      <path d="M200 66 L200 410" stroke="${s}" stroke-width="3" opacity=".7"/>
      ${[120, 175, 230, 285, 340].map((y) => `<circle cx="200" cy="${y}" r="4.5" fill="${s}"/>`).join("")}
      <rect x="126" y="140" width="52" height="58" rx="3" fill="none" stroke="${s}" stroke-width="3" opacity=".7"/>
      <rect x="222" y="140" width="52" height="58" rx="3" fill="none" stroke="${s}" stroke-width="3" opacity=".7"/>
      <path d="M126 156 L178 156 M222 156 L274 156" stroke="${s}" stroke-width="3" opacity=".7"/>`,
    jacket: (c, s) => `
      <path d="M128 56 L272 56 L352 104 L382 352 L340 360 L316 186 L310 392 L90 392 L84 186 L60 360 L18 352 L48 104 Z" fill="${c}"/>
      <path d="M128 56 L272 56 L262 80 L138 80 Z" fill="${s}" opacity=".55"/>
      <path d="M200 62 L200 392" stroke="${s}" stroke-width="4"/>
      <rect x="196" y="74" width="8" height="18" rx="2" fill="${s}"/>
      <path d="M90 372 L310 372 L310 392 L90 392 Z" fill="${s}" opacity=".45"/>
      <path d="M18 352 L60 360 L58 340 L22 332 Z M382 352 L340 360 L342 340 L378 332 Z" fill="${s}" opacity=".45"/>
      <path d="M232 132 L278 132" stroke="${s}" stroke-width="5" stroke-linecap="round" opacity=".7"/>
      <path d="M96 250 L126 214 M304 250 L274 214" stroke="${s}" stroke-width="3" opacity=".6"/>`,
    cap: (c, s) => `
      <path d="M86 270 C86 130 314 130 314 270 Z" fill="${c}"/>
      <path d="M200 140 L200 270 M142 160 L170 270 M258 160 L230 270" stroke="${s}" stroke-width="2.5" opacity=".55"/>
      <circle cx="200" cy="142" r="7" fill="${s}"/>
      <path d="M70 268 C140 300 330 300 372 286 C340 318 150 330 70 290 Z" fill="${shade(c, -26)}"/>
      <path d="M86 270 L314 270" stroke="${s}" stroke-width="3" opacity=".5"/>`,
    tote: (c, s) => `
      <path d="M150 150 C150 60 250 60 250 150" fill="none" stroke="${shade(c, -30)}" stroke-width="16"/>
      <path d="M96 140 L304 140 L320 410 L80 410 Z" fill="${c}"/>
      <path d="M96 140 L304 140 L306 166 L94 166 Z" fill="${s}" opacity=".25"/>
      <path d="M150 140 L150 176 M250 140 L250 176" stroke="${s}" stroke-width="4"/>
      <path d="M86 394 L314 394" stroke="${s}" stroke-width="2.5" stroke-dasharray="5 6" opacity=".6"/>`,
  };

  const prints = {
    power: (base) => {
      const dark = parseInt(base.slice(1, 3), 16) < 90;
      const ink = dark ? "#9BD8DF" : "#141414", hot = "#F2603A";
      return `<g transform="translate(200 214)">
        <path d="M14 -62 L-26 4 L-2 4 L-16 58 L30 -14 L4 -14 Z" fill="${hot}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
        <text x="0" y="-74" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="27" fill="${ink}" letter-spacing="1">SUPERCHARGE</text>
        <text x="0" y="86" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="33" fill="${ink}" letter-spacing="1">POWER BOY</text>
        <circle cx="-58" cy="-8" r="5" fill="${hot}"/><circle cx="58" cy="10" r="5" fill="${hot}"/>
      </g>`;
    },
  };

  window.garmentSVG = function (type, hex, opts = {}) {
    const id = "g" + ++uid;
    const base = opts.mono ? grey(hex) : hex;
    const seam = shade(base, -48);
    let draw = (shapes[type] || shapes.tee)(base, seam);
    if (opts.back && !["cap", "tote"].includes(type)) {
      draw = draw.slice(0, draw.indexOf("/>") + 2);
      if (type === "tee") draw += `<path d="M150 54 C175 66 225 66 250 54" fill="none" stroke="${seam}" stroke-width="4"/>`;
      if (type === "hoodie") draw += `<path d="M140 70 C150 18 250 18 260 70 C240 96 160 96 140 70 Z" fill="${seam}" opacity=".25"/>`;
    }
    const art = draw + (!opts.back && opts.print && prints[opts.print] ? prints[opts.print](base) : "");
    const label = opts.label || type;
    const wind = opts.wind ? `<filter id="${id}w" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.007 0.02" numOctaves="2" seed="7" result="n">
            <animate attributeName="baseFrequency" dur="6s" values="0.007 0.02;0.010 0.028;0.0075 0.018;0.007 0.02" repeatCount="indefinite"/>
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="${opts.windScale || 26}" xChannelSelector="R" yChannelSelector="G"/>
        </filter>` : "";
    const body = opts.wind ? `<g filter="url(#${id}w)">${art}</g>` : art;
    return `<svg class="garment" viewBox="0 0 400 440" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${id}l" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity=".22"/>
          <stop offset=".55" stop-color="#fff" stop-opacity="0"/>
          <stop offset="1" stop-color="#000" stop-opacity=".18"/>
        </linearGradient>
        <filter id="${id}s" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000" flood-opacity="${opts.mono ? 0.35 : 0.16}"/>
        </filter>
        ${wind}
        <clipPath id="${id}c">${draw}</clipPath>
      </defs>
      <g filter="url(#${id}s)">${body}</g>
      ${opts.wind ? "" : `<rect width="400" height="440" fill="url(#${id}l)" clip-path="url(#${id}c)"/>`}
    </svg>`;
  };
})();
