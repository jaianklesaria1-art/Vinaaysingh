/* unorgnl. prototype v2: shared chrome, bag + checkout drawer, page logic and motion. */
(function () {
  const D = window.UNORGNL;
  const page = document.body.dataset.page;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSmall = () => window.matchMedia("(max-width: 960px)").matches;
  const hasGsap = !!window.gsap;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  // drape a garment as simulated cloth (js/cloth.js); the plain image stays as the fallback
  const cloth = (el, o) => (window.UNOCloth ? window.UNOCloth.mount(el, o) : null);
  // phones and touch screens: product cards use plain photos (no live cloth) to keep scrolling smooth
  const lightCards = window.matchMedia("(max-width: 960px), (pointer: coarse)").matches;
  const fmt = (n) => D.currency + n.toLocaleString("en-IN");
  const bySlug = (slug) => D.products.find((p) => p.slug === slug);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const photoFor = (p, color) => {
    const m = p.media || {}; const name = (color || p.colors[0]).name;
    if (m.byColor && m.byColor[name]) return m.byColor[name];
    return name === p.colors[0].name ? m : null;
  };
  const art = (p, color, extra = {}) => {
    const set = extra.mono ? null : photoFor(p, color);
    const src = set && (extra.back ? set.back : set.front);
    if (src) return `<img class="garment photo" src="${src}" alt="${esc(p.name)}${extra.back ? " back view" : ""}" ${extra.wind ? 'style="filter:url(#wind-photo)"' : ""} loading="lazy" decoding="async">`;
    return garmentSVG(p.type, (color || p.colors[0]).hex, Object.assign({ label: p.name, print: p.print }, extra));
  };
  const logo = `<span class="logo" aria-label="unorgnl"><i>u</i>norgnl.</span>`;
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- bag store ---------- */
  const KEY = "unorgnl-bag-v1";
  let bag = [];
  try { bag = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { bag = []; }
  bag = bag.filter((l) => bySlug(l.slug));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(bag)); } catch (e) { /* storage blocked: bag stays in memory */ } };
  const count = () => bag.reduce((a, l) => a + l.qty, 0);
  const subtotal = () => bag.reduce((a, l) => a + bySlug(l.slug).price * l.qty, 0);

  function addToBag(slug, color, size, opts = {}) {
    const line = bag.find((l) => l.slug === slug && l.color === color && l.size === size);
    if (line) line.qty += 1; else bag.push({ slug, color, size, qty: 1 });
    bagFresh = slug + color + size;
    save();
    if (opts.silent) return Promise.resolve();
    return flyToBag(opts.from).then(() => { updateCount(true); renderBag(); openDrawer(); });
  }

  /* the garment you add arcs into the bag button, then the count bumps */
  function flyToBag(from) {
    const target = $(".bag-btn");
    const src = from && (from.querySelector(".garment") || from);
    if (!src || !target || reduceMotion || !("animate" in Element.prototype)) return Promise.resolve();
    const r = from.getBoundingClientRect(), b = target.getBoundingClientRect();
    const size = Math.min(220, r.width, r.height || 220);
    const cx = Math.min(innerWidth - size / 2, Math.max(size / 2, r.left + r.width / 2));
    const cy = Math.min(innerHeight - size / 2, Math.max(size / 2, r.top + r.height / 2));
    const ghost = document.createElement("div");
    ghost.className = "bag-fly"; ghost.setAttribute("aria-hidden", "true");
    ghost.style.cssText = `left:${cx - size / 2}px;top:${cy - size / 2}px;width:${size}px;height:${size * 1.1}px`;
    ghost.innerHTML = src.outerHTML.replace(' loading="lazy"', "");
    document.body.appendChild(ghost);
    const dx = b.left + b.width / 2 - cx, dy = b.top + b.height / 2 - cy;
    const anim = ghost.animate([
      { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 140}px) scale(.6) rotate(-14deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(.06) rotate(-30deg)`, opacity: 0.6 },
    ], { duration: 720, easing: "cubic-bezier(.55,0,.35,1)" });
    return anim.finished.catch(() => {}).then(() => ghost.remove());
  }

  /* ---------- shared chrome ---------- */
  function renderChrome() {
    const header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML = `
      <a href="index.html">${logo}</a>
      <nav id="site-nav" aria-label="Main">
        <a href="index.html#collection">Shop</a>
        <a href="index.html#fit">Build a fit</a>
      </nav>
      <div class="head-right">
        <span class="progress" aria-hidden="true">(0%)</span>
        <button class="icon-btn search-btn" type="button" data-open-search aria-label="Search">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
        <button class="bag-btn" type="button" data-open-bag aria-label="Open bag">Bag <span class="bag-count">0</span></button>
        <button class="icon-btn menu-btn" type="button" aria-label="Menu" aria-controls="site-nav" aria-expanded="false">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 6h14M2 12h14" stroke="currentColor" stroke-width="1.6"/></svg>
        </button>
      </div>`;
    document.body.prepend(header);

    const menuBtn = $(".menu-btn", header);
    menuBtn.addEventListener("click", () => {
      const open = $("#site-nav").classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    $("#site-nav").addEventListener("click", (e) => { if (e.target.closest("a")) { $("#site-nav").classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); } });

    const prog = $(".progress", header);
    const onScroll = () => {
      header.classList.toggle("is-solid", window.scrollY > 40);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      prog.textContent = "(" + (max > 0 ? Math.round((window.scrollY / max) * 100) : 0) + "%)";
    };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

    document.body.insertAdjacentHTML("beforeend", `
      <div class="scrim" data-close-bag></div>
      <aside class="drawer" role="dialog" aria-modal="true" aria-label="Your bag" tabindex="-1">
        <div class="drawer-head"><h2 id="drawer-title">your bag</h2>
          <button class="icon-btn" type="button" data-close-bag aria-label="Close bag">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.6"/></svg>
          </button></div>
        <div class="drawer-body"></div>
        <div class="drawer-foot"></div>
      </aside>
      <div class="modal" role="dialog" aria-modal="true" aria-label="Information"><div class="modal-card"></div></div>
      <div class="toast" role="status" aria-live="polite"></div>
      <div class="search" role="dialog" aria-modal="true" aria-label="Search" hidden>
        <div class="search-panel">
          <form class="search-form" role="search"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            <input type="search" name="q" placeholder="Search tees, shirts, pants, jackets, colours" autocomplete="off" aria-label="Search the shop" aria-controls="search-results">
            <button class="icon-btn" type="button" data-close-search aria-label="Close search"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.6"/></svg></button></form>
          <div class="search-results" id="search-results" aria-live="polite"></div>
        </div>
      </div>`);
    initAnnouncements();
    initSearch();

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-open-bag]")) { renderBag(); openDrawer(); }
      if (e.target.closest("[data-close-bag]")) closeDrawer();
      if (e.target.classList.contains("modal") || e.target.closest("[data-close-modal]")) $(".modal").classList.remove("open");
      const heart = e.target.closest(".heart");
      if (heart) { const on = heart.getAttribute("aria-pressed") !== "true"; heart.setAttribute("aria-pressed", String(on)); toast(on ? "Saved to your wishlist" : "Removed from wishlist"); }
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeDrawer(); $(".modal").classList.remove("open"); } });

    {
      const footer = document.createElement("footer");
      footer.className = "site-footer";
      footer.innerHTML = `
        <div><a href="index.html">${logo}</a><p class="muted" style="margin-top:12px;max-width:320px">Nothing is original. Inspired by you.</p></div>
        <div><h4>Shop</h4><ul><li><a href="index.html#collection">All pieces</a></li><li><a href="index.html#lookbook">Lookbook</a></li><li><a href="index.html#fit">Build a fit</a></li></ul></div>
        <div><h4>Help</h4><ul><li><a href="track.html">Track your order</a></li><li><a href="shipping.html">Shipping</a></li><li><a href="returns.html">Returns &amp; refunds</a></li><li><a href="index.html#faq">FAQ</a></li></ul></div>
        <div><h4>About</h4><ul><li><a href="contact.html">Contact us</a></li><li><a href="privacy.html">Privacy policy</a></li><li><a href="terms.html">Terms of use</a></li></ul></div>
        <div><h4>Social</h4><ul><li>Instagram</li><li>WhatsApp</li></ul></div>
        <p class="proto-note">Prototype. Products, prices and policies are samples, and product photos are AI-generated stand-ins until the real collection is shot. No payment is taken.</p>`;
      document.body.appendChild(footer);
    }
  }

  /* ---------- announcement bar ---------- */
  function initAnnouncements() {
    const msgs = (D.announcements || []).filter(Boolean);
    if (!msgs.length) return;
    const bar = document.createElement("div");
    bar.className = "announce"; bar.setAttribute("role", "region"); bar.setAttribute("aria-label", "Announcements");
    bar.innerHTML = `<div class="announce-track">${msgs.map((m, i) => `<p class="${i === 0 ? "on" : ""}">${esc(m)}</p>`).join("")}</div>`;
    document.body.prepend(bar);
    document.body.classList.add("has-announce");
    let i = 0;
    const items = $$("p", bar);
    if (items.length > 1 && !reduceMotion) setInterval(() => {
      if (document.hidden) return;
      items[i].classList.remove("on"); i = (i + 1) % items.length; items[i].classList.add("on");
    }, 4000);
    const onScroll = () => document.body.classList.toggle("announce-hidden", window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }

  /* ---------- search ---------- */
  function initSearch() {
    const box = $(".search"), input = $(".search-form input"), out = $("#search-results");
    let lastFocus = null;
    const haystack = (p) => [p.name, p.category, p.type, p.tagline, ...p.colors.map((c) => c.name)].join(" ").toLowerCase();
    const open = () => { lastFocus = document.activeElement; box.hidden = false; requestAnimationFrame(() => box.classList.add("open")); document.body.style.overflow = "hidden"; input.value = ""; paint(""); setTimeout(() => input.focus(), 60); };
    const close = () => { box.classList.remove("open"); document.body.style.overflow = ""; setTimeout(() => { box.hidden = true; }, 250); if (lastFocus) lastFocus.focus(); };
    const paint = (q) => {
      q = q.trim().toLowerCase();
      const words = q.split(/\s+/).filter(Boolean);
      const list = words.length ? D.products.filter((p) => words.every((w) => haystack(p).includes(w.replace(/s$/, "")))) : D.products;
      if (!list.length) { out.innerHTML = `<p class="search-empty">Nothing matches “${esc(q)}”. Try tee, shirt, pants, jacket or a colour like black.</p>`; return; }
      out.innerHTML = `<p class="search-count">${words.length ? `${list.length} ${list.length === 1 ? "piece" : "pieces"}` : "All pieces"}</p>
        <ul>${list.map((p) => `<li><a href="product.html?p=${p.slug}"><span class="sr-img" style="--tone:${tone(p)}">${art(p)}</span>
          <span class="sr-name">${esc(p.name)}<small>${esc(p.category)} · ${p.colors.map((c) => esc(c.name)).join(", ")}</small></span><span class="sr-price">${fmt(p.price)}</span></a></li>`).join("")}</ul>`;
    };
    input.addEventListener("input", () => paint(input.value));
    $(".search-form").addEventListener("submit", (e) => { e.preventDefault(); const first = $("a", out); if (first) location.href = first.getAttribute("href"); });
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-open-search]")) open();
      if (e.target.closest("[data-close-search]") || e.target === box) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !box.hidden) close();
      if (e.key === "/" && box.hidden && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
    });
  }

  function updateCount(bump) {
    $$(".bag-count").forEach((el) => (el.textContent = count()));
    if (bump && !reduceMotion) $$(".bag-btn").forEach((b) => { b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); });
  }

  let lastFocus = null;
  function openDrawer() {
    lastFocus = document.activeElement;
    $(".drawer").classList.add("open"); $(".scrim").classList.add("open");
    document.body.style.overflow = "hidden";
    setTimeout(() => $(".drawer").focus(), 50);
  }
  function closeDrawer() {
    const d = $(".drawer"); if (!d || !d.classList.contains("open")) return;
    d.classList.remove("open"); $(".scrim").classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(() => { if (d.classList.contains("open")) return; renderBag(); }, 600);
    if (lastFocus) lastFocus.focus();
  }

  function toast(msg) {
    const t = $(".toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function info(title, html) {
    $(".modal-card").innerHTML = `<h2>${title}</h2>${html}<button class="btn btn-ink btn-block" type="button" data-close-modal style="margin-top:18px">Done</button>`;
    $(".modal").classList.add("open");
  }

  /* ---------- bag view ---------- */
  let checkoutStep = "bag";
  let order = { ship: "standard", pay: "upi" };
  /* discount code: { code, type, value, min, label }; the order sheet re-checks it when the order arrives */
  let promo = null;
  try { promo = JSON.parse(localStorage.getItem("unorgnl-promo")) || null; } catch (e) { promo = null; }
  const savePromo = () => { try { promo ? localStorage.setItem("unorgnl-promo", JSON.stringify(promo)) : localStorage.removeItem("unorgnl-promo"); } catch (e) { /* storage blocked */ } };
  const discount = () => {
    if (!promo) return 0; const sub = subtotal();
    if (sub < (promo.min || 0)) return 0;
    return promo.type === "percent" ? Math.round(sub * promo.value / 100) : Math.min(promo.value, sub);
  };
  const afterDiscount = () => subtotal() - discount();
  const shippingCost = () => (order.ship === "express" ? 199 : afterDiscount() >= D.freeShippingOver ? 0 : D.shippingFee);
  const grandTotal = () => afterDiscount() + shippingCost() + (order.pay === "cod" ? 49 : 0);
  const discountRow = () => discount() ? `<div class="disc-row"><span>Discount · ${esc(promo.code)}</span><span>− ${fmt(discount())}</span></div>` : "";
  function promoBox() {
    const short = promo && !discount() && subtotal() < (promo.min || 0);
    return `<div class="promo">${promo
      ? `<div class="promo-on"><span class="promo-chip">${esc(promo.code)}</span><span class="promo-label">${short ? `Add ${fmt(promo.min - subtotal())} more to use this code` : esc(promo.label || "Code applied")}</span><button class="linkish" type="button" data-promo-remove>Remove</button></div>`
      : `<details class="promo-add"><summary>Have a discount code?</summary>
          <form class="promo-form" data-promo-form novalidate><div class="co-input"><input name="code" placeholder="Enter code" autocomplete="off" autocapitalize="characters" aria-label="Discount code"></div><button class="btn btn-line" type="submit">Apply</button></form>
          <p class="promo-msg" aria-live="polite"></p></details>`}</div>`;
  }
  function checkPromo(code) {
    code = code.trim().toUpperCase();
    const url = (D.backend || {}).ordersUrl;
    if (!url) {
      const rule = (D.demoDiscounts || []).find((d) => d.code === code);
      return Promise.resolve(rule ? { ok: true, ...rule } : { ok: false, error: "invalid" });
    }
    return fetch(`${url}?action=discount&code=${encodeURIComponent(code)}`).then((r) => r.json()).catch(() => ({ ok: false, error: "network" }));
  }
  document.addEventListener("submit", (e) => {
    const f = e.target.closest("[data-promo-form]"); if (!f) return;
    e.preventDefault();
    const code = f.elements.code.value, msg = f.parentElement.querySelector(".promo-msg");
    if (!code.trim()) { msg.textContent = "Enter a code first."; return; }
    msg.textContent = "Checking…";
    checkPromo(code).then((r) => {
      if (!r.ok) { msg.textContent = { invalid: "That code doesn't exist.", expired: "That code has expired.", used_up: "That code has been fully used.", network: "Couldn't check the code. Try again." }[r.error] || "That code can't be used."; return; }
      promo = { code: r.code, type: r.type, value: r.value, min: r.min || 0, label: r.label }; savePromo();
      toast(`${promo.code} applied`); rerenderTotals();
    });
  });
  document.addEventListener("click", (e) => { if (e.target.closest("[data-promo-remove]")) { promo = null; savePromo(); rerenderTotals(); } });
  const rerenderTotals = () => { if (checkoutStep === "bag") renderBag(false); else if (checkoutStep === "pay") renderCheckout("pay"); };

  let bagFresh = "", lastPct = null, wasFree = null;
  const lineKey = (l) => l.slug + l.color + l.size;
  function shipMeter() {
    const left = Math.max(0, D.freeShippingOver - afterDiscount());
    const pct = Math.min(100, (afterDiscount() / D.freeShippingOver) * 100);
    const free = left === 0, unlocked = free && wasFree === false;
    const from = lastPct === null ? pct : lastPct;
    lastPct = pct; wasFree = free;
    return { pct, from, html: `<div class="ship-meter${free ? " is-free" : ""}">
        <div class="ship-copy">${free ? "<b>Free delivery</b> unlocked" : `<b>${fmt(left)}</b> away from free delivery`}</div>
        <div class="ship-track"><i style="width:${from}%"></i><span class="ship-tag" style="left:${from}%">${free ? "✓" : "→"}</span></div>
        ${unlocked ? '<span class="ship-stamp" aria-hidden="true">free delivery</span>' : ""}
      </div>` };
  }
  function upsell() {
    const inBag = new Set(bag.map((l) => l.slug));
    const hasBottom = bag.some((l) => bySlug(l.slug).category === "Pants");
    const want = D.products.filter((p) => !inBag.has(p.slug) && (hasBottom ? p.category !== "Pants" : p.category === "Pants"));
    const rest = D.products.filter((p) => !inBag.has(p.slug) && want.indexOf(p) === -1);
    const list = want.concat(rest).slice(0, 3);
    if (!list.length) return "";
    return `<div class="bag-upsell"><p class="mono">${hasBottom ? "[Finish the fit] top it off" : "[Finish the fit] goes with it"}</p>
      <div class="upsell-row">${list.map((p) => `<a class="upsell" href="product.html?p=${p.slug}" style="--tone:${tone(p)}"><span class="upsell-img">${art(p)}</span><span class="upsell-name">${esc(p.name)}</span><span class="upsell-price">${fmt(p.price)}</span></a>`).join("")}</div></div>`;
  }

  function renderBag(animate = true) {
    checkoutStep = "bag";
    const drawer = $(".drawer"); drawer.classList.remove("is-checkout");
    drawer.dataset.step = "bag";
    $("#drawer-title").innerHTML = `your bag <span class="head-count">${count()}</span>`;
    const body = $(".drawer-body"), foot = $(".drawer-foot");
    if (!bag.length) {
      lastPct = null; wasFree = null;
      body.innerHTML = `<div class="empty"><div class="empty-hanger" aria-hidden="true"><svg viewBox="0 0 120 70"><path d="M60 6c10 0 10 14 0 14v8M10 64l50-36 50 36z" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <p>nothing here yet.<br>go find your fit.</p><a class="btn btn-orange" data-cta="Let's go" href="index.html#collection">Shop the collection <span class="arrow">→</span></a></div>`;
      foot.innerHTML = ""; foot.style.display = "none"; return;
    }
    foot.style.display = "";
    const meter = shipMeter();
    body.innerHTML = `${meter.html}<div class="bag-lines">${bag.map((l, i) => {
      const p = bySlug(l.slug); const c = p.colors.find((x) => x.name === l.color) || p.colors[0];
      const fresh = lineKey(l) === bagFresh;
      return `<div class="line-item${animate ? " in" : ""}${fresh ? " fresh" : ""}" style="--tone:${tone(p)};--d:${i * 70}ms" data-line="${i}">
        <a class="thumb" href="product.html?p=${p.slug}" aria-label="${esc(p.name)}">${art(p, c)}</a>
        <div class="li-main"><h3>${esc(p.name)}</h3>
          <div class="li-opts"><span class="li-dot" style="background:${c.hex}"></span>${esc(c.name)}<span class="li-size">${esc(l.size)}</span></div>
          <div class="li-row"><div class="stepper" role="group" aria-label="Quantity of ${esc(p.name)}"><button type="button" data-qty="-1" data-i="${i}" aria-label="One less">−</button><span aria-live="polite">${l.qty}</span><button type="button" data-qty="1" data-i="${i}" aria-label="One more">+</button></div>
          <span class="line-price">${fmt(p.price * l.qty)}</span></div></div>
        <button class="li-x" type="button" data-remove="${i}" aria-label="Remove ${esc(p.name)}"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.8"/></svg></button>
      </div>`;
    }).join("")}</div>${upsell()}`;
    bagFresh = "";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const bar = $(".ship-track i", body), tag = $(".ship-tag", body);
      if (bar) { bar.style.width = meter.pct + "%"; tag.style.left = meter.pct + "%"; }
    }));
    foot.innerHTML = `${promoBox()}<div class="totals"><div><span>Subtotal · ${count()} ${count() === 1 ? "piece" : "pieces"}</span><span>${fmt(subtotal())}</span></div>
      ${discountRow()}<div class="grand"><span>Total</span><span>${fmt(afterDiscount())}</span></div></div>
      <button class="btn btn-orange btn-block" type="button" data-go="details" data-cta="Let's go">Checkout <span class="arrow">→</span></button>
      <p class="foot-note">Delivery and payment on the next step. Prototype: no payment is taken.</p>`;
  }

  document.addEventListener("click", (e) => {
    const q = e.target.closest("[data-qty]");
    if (q) {
      const i = +q.dataset.i, l = bag[i]; l.qty += +q.dataset.qty;
      if (l.qty < 1) { removeLine(i); return; }
      save(); updateCount(true); renderBag(false);
    }
    const r = e.target.closest("[data-remove]");
    if (r) removeLine(+r.dataset.remove);
    const go = e.target.closest("[data-go]");
    if (go) { if (go.dataset.go === "bag") renderBag(); else renderCheckout(go.dataset.go); }
  });
  // the row slides out and collapses before the list re-renders
  function removeLine(i) {
    const row = $(`.line-item[data-line="${i}"]`);
    const done = () => { bag.splice(i, 1); save(); updateCount(true); renderBag(false); };
    if (!row || reduceMotion) return done();
    row.style.height = row.offsetHeight + "px";
    row.classList.add("leaving");
    requestAnimationFrame(() => { row.style.height = "0px"; });
    setTimeout(done, 340);
  }

  /* ---------- checkout inside the drawer ---------- */
  const STATES = ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Telangana", "Gujarat", "West Bengal", "Other"];
  let details = {};

  function summaryBlock() {
    const ship = shippingCost(); const cod = order.pay === "cod" ? 49 : 0; const n = count();
    return `<div class="totals"><div><span>Subtotal (${n} ${n === 1 ? "item" : "items"})</span><span>${fmt(subtotal())}</span></div>
      ${discountRow()}<div><span>Delivery</span><span>${ship ? fmt(ship) : "Free"}</span></div>
      ${cod ? `<div><span>Cash on delivery fee</span><span>${fmt(cod)}</span></div>` : ""}
      <div class="grand"><span>Total</span><span>${fmt(grandTotal())}</span></div></div>`;
  }

  const coSteps = (n) => `<ol class="co-steps" aria-label="Checkout steps">${["Details", "Delivery & payment", "Review"].map((t, i) =>
    `<li class="${i + 1 < n ? "done" : i + 1 === n ? "current" : ""}"${i + 1 === n ? ' aria-current="step"' : ""}><span class="co-step-dot">${i + 1 < n ? "✓" : i + 1}</span>${t}</li>`).join("")}</ol>`;
  const coSummary = () => {
    const n = count(), total = grandTotal();
    return `<details class="co-summary"><summary><span>Order summary · ${n} ${n === 1 ? "item" : "items"}</span><b>${fmt(total)}</b></summary>
      <ul>${bag.map((l) => { const p = bySlug(l.slug); const c = p.colors.find((x) => x.name === l.color) || p.colors[0];
        return `<li><span class="co-sum-img" style="--tone:${tone(p)}">${art(p, c)}<i>${l.qty}</i></span><span class="co-sum-name">${esc(p.name)}<small>${esc(c.name)} · ${esc(l.size)}</small></span><span>${fmt(p.price * l.qty)}</span></li>`; }).join("")}</ul></details>`;
  };
  const RULES = {
    phone: (v) => /^[6-9]\d{9}$/.test(v) || "Enter a 10-digit mobile number",
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Enter an email like name@example.com",
    name: (v) => v.trim().length > 1 || "Enter the name for delivery",
    addr: (v) => v.trim().length > 4 || "Enter house number and street",
    pin: (v) => /^\d{6}$/.test(v) || "Enter a 6-digit PIN code",
    city: (v) => v.trim().length > 1 || "Enter your city",
  };
  function checkField(input) {
    const rule = RULES[input.name]; if (!rule) return true;
    const res = rule(input.value), wrap = input.closest(".co-field"), err = wrap.querySelector(".co-err");
    const ok = res === true;
    err.textContent = ok ? "" : res;
    input.toggleAttribute("aria-invalid", !ok);
    wrap.classList.toggle("is-valid", ok);
    return ok;
  }

  function renderCheckout(step) {
    checkoutStep = step;
    $(".drawer").classList.add("is-checkout");
    const body = $(".drawer-body"), foot = $(".drawer-foot"); foot.style.display = "";
    const stepper = (n) => `<div class="steps" aria-hidden="true">${[1, 2, 3].map((i) => `<span class="${i <= n ? "done" : ""}"></span>`).join("")}</div>`;
    $(".drawer").dataset.step = step;

    if (step === "details") {
      $("#drawer-title").textContent = "checkout";
      const v = (k) => esc(details[k] || "");
      const field = (id, name, label, attrs, help = "") => `<div class="co-field"><label for="${id}">${label}</label>
        <div class="co-input"><input id="${id}" name="${name}" ${attrs} value="${v(name)}"><span class="co-ok" aria-hidden="true">✓</span></div>
        ${help ? `<p class="co-help">${help}</p>` : ""}<p class="co-err" id="${id}-err" aria-live="polite"></p></div>`;
      body.innerHTML = `${coSteps(1)}${coSummary()}
        <form id="details-form" class="co-form" novalidate>
          <fieldset><legend>Contact</legend>
            <div class="co-field"><label for="f-phone">Mobile number</label>
              <div class="co-input co-prefix"><span class="co-cc">+91</span><input id="f-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="10" required value="${v("phone")}"><span class="co-ok" aria-hidden="true">✓</span></div>
              <p class="co-help">Order updates come on WhatsApp.</p><p class="co-err" aria-live="polite"></p></div>
            ${field("f-email", "email", "Email", 'type="email" autocomplete="email" required')}
          </fieldset>
          <fieldset><legend>Delivery address</legend>
            ${field("f-name", "name", "Full name", 'autocomplete="name" required')}
            ${field("f-addr", "addr", "House number and street", 'autocomplete="address-line1" required')}
            ${field("f-area", "area", "Area or landmark <span>(optional)</span>", 'autocomplete="address-line2"')}
            <div class="co-row">
              ${field("f-pin", "pin", "PIN code", 'inputmode="numeric" autocomplete="postal-code" maxlength="6" required')}
              ${field("f-city", "city", "City", 'autocomplete="address-level2" required')}
            </div>
            <div class="co-field"><label for="f-state">State</label><div class="co-input co-select"><select id="f-state" name="state" autocomplete="address-level1">${STATES.map((st) => `<option ${details.state === st ? "selected" : ""}>${st}</option>`).join("")}</select></div></div>
          </fieldset>
        </form>`;
      foot.innerHTML = `<button class="btn btn-orange btn-block" type="button" id="to-pay">Continue to delivery</button>
        <button class="linkish co-back" type="button" data-go="bag">Back to bag</button>`;
      const form = $("#details-form");
      // digits only for phone and PIN; check each field when you leave it, and re-check while fixing it
      form.addEventListener("input", (e) => {
        if (e.target.name === "phone" || e.target.name === "pin") e.target.value = e.target.value.replace(/\D/g, "");
        if (e.target.hasAttribute("aria-invalid")) checkField(e.target);
      });
      form.addEventListener("focusout", (e) => { if (e.target.value) checkField(e.target); });
      $$("input", form).forEach((inp) => { if (inp.value) checkField(inp); });
      $("#to-pay").addEventListener("click", () => { if (validateDetails()) renderCheckout("pay"); });
    }

    if (step === "pay") {
      const freeShip = afterDiscount() >= D.freeShippingOver;
      body.innerHTML = `${coSteps(2)}${coSummary()}
        <div class="co-deliver"><div><span class="co-label">Delivering to</span><b>${esc(details.name)}</b>
          <span>${esc(details.addr)}${details.area ? ", " + esc(details.area) : ""}, ${esc(details.city)} ${esc(details.pin)}, ${esc(details.state || "")}</span>
          <span>+91 ${esc(details.phone)}</span></div><button class="linkish" type="button" data-go="details">Edit</button></div>
        <fieldset class="co-options"><legend>Delivery speed</legend>
          <label class="co-option"><input type="radio" name="ship" value="standard" ${order.ship === "standard" ? "checked" : ""}><span class="co-opt-main">Standard<small>3 to 6 working days</small></span><span class="co-opt-price">${freeShip ? "Free" : fmt(D.shippingFee)}</span></label>
          <label class="co-option"><input type="radio" name="ship" value="express" ${order.ship === "express" ? "checked" : ""}><span class="co-opt-main">Express<small>1 to 2 working days, metro cities</small></span><span class="co-opt-price">${fmt(199)}</span></label>
        </fieldset>
        <fieldset class="co-options"><legend>Payment method</legend>
          <label class="co-option"><input type="radio" name="pay" value="upi" ${order.pay === "upi" ? "checked" : ""}><span class="co-opt-main">UPI<small>GPay, PhonePe, Paytm</small></span></label>
          <label class="co-option"><input type="radio" name="pay" value="card" ${order.pay === "card" ? "checked" : ""}><span class="co-opt-main">Debit or credit card<small>Visa, Mastercard, RuPay</small></span></label>
          <label class="co-option"><input type="radio" name="pay" value="cod" ${order.pay === "cod" ? "checked" : ""}><span class="co-opt-main">Cash on delivery<small>Pay when it arrives</small></span><span class="co-opt-price">+ ${fmt(49)}</span></label>
        </fieldset>`;
      const paint = () => {
        foot.innerHTML = `${promoBox()}${summaryBlock()}<button class="btn btn-orange btn-block" type="button" data-go="ticket">Review order</button>
          <button class="linkish co-back" type="button" data-go="details">Back to details</button>`;
      };
      body.onchange = (e) => { if (e.target.name === "ship" || e.target.name === "pay") { order[e.target.name] = e.target.value; paint(); const sm = $(".co-summary b", body); if (sm) sm.textContent = fmt(grandTotal()); } };
      paint();
    }
    if (step === "ticket") renderTicket(body, foot);
    body.scrollTop = 0;
  }

  /* step 3: the order as a ticket. Tearing the stub places the order (TearTicket, same component as Rolling Mills) */
  let ticket = null, pendingNo = "";
  function renderTicket(body, foot) {
    const ship = shippingCost(), cod = order.pay === "cod" ? 49 : 0, total = grandTotal();
    pendingNo = "UNO-" + Math.floor(10000 + Math.random() * 89999);
    const payName = { upi: "UPI", card: "Card", cod: "Cash on delivery" }[order.pay];
    const lines = bag.slice(0, 3).map((l) => { const p = bySlug(l.slug); const c = p.colors.find((x) => x.name === l.color) || p.colors[0];
      return `<li><span class="ot-img" style="--tone:${tone(p)}">${art(p, c)}</span><span class="ot-name">${esc(p.name)}<em>${esc(c.name)} · ${esc(l.size)} × ${l.qty}</em></span><span>${fmt(p.price * l.qty)}</span></li>`; }).join("")
      + (bag.length > 3 ? `<li class="more"><span>+ ${bag.length - 3} more ${bag.length - 3 === 1 ? "piece" : "pieces"}</span></li>` : "");
    const ticketBody = `<div class="ot-body"><div class="ot-top"><span class="ot-logo"><i>u</i>norgnl.</span><span class="mono">order ticket</span></div>
        <ul class="ot-lines">${lines}</ul>
        <div class="ot-meta"><div><span class="mono">Deliver to</span><b>${esc(details.name)}</b><span>${esc(details.city)} ${esc(details.pin)}</span></div>
          <div><span class="mono">${order.ship === "express" ? "Express" : "Standard"} · ${payName}</span><b>${ship ? fmt(ship) : "Free"} delivery</b>${cod ? `<span>+ ${fmt(cod)} COD fee</span>` : ""}</div></div>
        ${discount() ? `<div class="ot-disc"><span>${esc(promo.code)}</span><span>− ${fmt(discount())}</span></div>` : ""}
        <div class="ot-total"><span class="mono">Total</span><b>${fmt(total)}</b></div></div>`;
    const ticketStub = `<div class="ot-stub"><span class="mono">tear to place order</span><b>${pendingNo}</b><span class="ot-barcode" aria-hidden="true"></span><span class="mono ot-pull">↓ pull the stub</span></div>`;
    body.innerHTML = `${coSteps(3)}
      <p class="ticket-hint">Check it, then <b>tear off the stub</b> to place the order.</p><div class="ticket-box" id="ticket-box"></div>`;
    foot.innerHTML = `<button class="btn btn-orange btn-block" type="button" id="tear-btn">Tear &amp; place order <span class="arrow">→</span></button>
      <button class="linkish co-back" type="button" data-go="pay">Back to delivery and payment</button>`;
    const box = $("#ticket-box");
    ticket = window.TearTicket ? window.TearTicket(box, {
      orientation: "vertical", width: 340, height: 540, stubSize: 140, radius: 18, holes: 13, holeSize: 7, notch: 4,
      rotate: -2, tiltMax: 6, parallax: 0, background: "#FFFEFB", color: "#111111", stubBackground: "#D7262B",
      borderColor: "#111111", borderWidth: 1.5, body: ticketBody, stub: ticketStub,
      ariaLabel: `Tear off the stub to place order ${pendingNo} for ${fmt(total)}`,
      onRelease: () => { sending = sendOrder(total); },
      onTear: () => finishOrder(total),
    }) : null;
    $("#tear-btn").addEventListener("click", () => { if (ticket) ticket.tear(); else { sending = sendOrder(total); finishOrder(total); } });
  }

  /* ---------- orders: Google Sheet (Apps Script) + Razorpay payment link + WhatsApp ---------- */
  let sending = null;
  const backend = () => (D.backend || {});
  const waLink = (text) => backend().whatsapp ? `https://wa.me/${backend().whatsapp}?text=${encodeURIComponent(text)}` : "";
  const orderText = (no) => `Hi ${D.brand}, I'd like to order${no ? ` (${no})` : ""}:\n` + bag.map((l) => { const p = bySlug(l.slug); return `- ${p.name}, ${l.color}, ${l.size} x${l.qty}`; }).join("\n")
    + `\nDeliver to: ${details.name}, ${details.city} ${details.pin}`;
  function sendOrder(total) {
    const b = $("#tear-btn"); if (b) { b.disabled = true; b.textContent = "Placing order…"; }
    const payload = { ref: pendingNo, hp: "", ship: order.ship, pay: order.pay, clientTotal: total, discount: promo && discount() ? promo.code : "",
      items: bag.map((l) => ({ slug: l.slug, color: l.color, size: l.size, qty: l.qty })),
      customer: { name: details.name, phone: details.phone, email: details.email, addr: details.addr, area: details.area || "", city: details.city, pin: details.pin, state: details.state } };
    const url = backend().ordersUrl;
    if (!url) return new Promise((r) => setTimeout(() => r({ ok: true, demo: true, orderNo: pendingNo, total }), 500));
    // text/plain keeps this a "simple" request, so Apps Script answers without a CORS preflight
    return fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) })
      .then((r) => r.json()).catch(() => ({ ok: false, error: "network" }));
  }
  function finishOrder(total) {
    const summary = orderText(pendingNo);
    Promise.resolve(sending).then((res) => {
      if (res && res.ok) { bag = []; save(); promo = null; savePromo(); updateCount(true); showDone(res, summary); }
      else showFailed(res && res.error, summary);
    });
  }

  function validateDetails() {
    const f = $("#details-form"); let firstBad = null;
    $$("input", f).forEach((inp) => { if (!checkField(inp) && !firstBad) firstBad = inp; details[inp.name] = inp.value.trim(); });
    details.state = f.elements.state.value;
    if (firstBad) firstBad.focus();
    return !firstBad;
  }


  function showDone(res, summary) {
    checkoutStep = "done";
    $(".drawer").dataset.step = "done";
    const no = res.orderNo, total = res.total, online = !!res.payUrl;
    $("#drawer-title").textContent = online ? "almost done" : "order placed";
    const wa = waLink(`Hi ${D.brand}, about my order ${no}.`);
    $(".drawer-body").innerHTML = `<div class="done-view"><div class="done-stub" aria-hidden="true"><span class="mono">your stub</span><b>${esc(no)}</b><span class="ot-barcode"></span></div>
      ${online ? `<h3>one last step.</h3><p>Your order <b>${esc(no)}</b> is saved. Pay <b>${fmt(total)}</b> to confirm it. UPI and cards work on the next page.</p>`
        : `<h3>it's yours.<br>no copies.</h3><p>Order <b>${esc(no)}</b> · ${fmt(total)}${order.pay === "cod" ? ". Pay when it arrives." : ""}</p>`}
      <p class="muted" style="font-size:14px">A confirmation is on its way to ${esc(details.email)}. Keep your order number to track it.</p>
      ${res.demo ? '<p class="mono muted">Demo mode: no order was sent and no payment was taken. Connect the Google Sheet to go live (backend/SETUP.md).</p>' : ""}</div>`;
    $(".drawer-foot").innerHTML = `${online ? `<a class="btn btn-orange btn-block" href="${esc(res.payUrl)}" data-cta="Secure">Pay ${fmt(total)} with Razorpay</a>` : ""}
      <a class="btn ${online ? "btn-line" : "btn-orange"} btn-block" href="track.html?no=${encodeURIComponent(no)}">Track your order</a>
      ${wa ? `<a class="linkish co-back" href="${wa}" target="_blank" rel="noopener">Questions? Message us on WhatsApp</a>` : ""}`;
  }
  function showFailed(error, summary) {
    checkoutStep = "failed";
    $("#drawer-title").textContent = "not placed";
    const wa = waLink(summary);
    $(".drawer-body").innerHTML = `<div class="done-view"><h3>that didn't<br>go through.</h3>
      <p>Your order wasn't placed and nothing was charged. Your bag is still here.</p>
      <p class="muted" style="font-size:14px">${error === "network" ? "Check your internet connection and try again." : "Try again in a moment."}${wa ? " Or send the order to us on WhatsApp." : ""}</p></div>`;
    $(".drawer-foot").innerHTML = `<button class="btn btn-orange btn-block" type="button" data-go="ticket">Try again</button>
      ${wa ? `<a class="btn btn-line btn-block" href="${wa}" target="_blank" rel="noopener">Order on WhatsApp</a>` : ""}`;
  }

  /* ---------- TRACK ORDER ---------- */
  function initTrack() {
    const form = $("#track-form"), out = $("#track-result");
    const q = new URLSearchParams(location.search);
    if (q.get("no")) form.elements.no.value = q.get("no");
    if (q.get("razorpay_payment_link_status") === "paid") {
      out.innerHTML = `<div class="track-note ok">Payment received, thank you. Your order status updates within a few minutes. Enter your mobile number to see it.</div>`;
    }
    if (!backend().ordersUrl) {
      out.insertAdjacentHTML("beforeend", `<div class="track-note">Order tracking turns on once the shop is connected to its order sheet.</div>`);
    }
    const FLOW = ["New", "Paid", "Packed", "Shipped", "Delivered"];
    form.addEventListener("input", (e) => { if (e.target.name === "phone") e.target.value = e.target.value.replace(/\D/g, ""); });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const no = form.elements.no.value.trim().toUpperCase(), phone = form.elements.phone.value.trim();
      if (!/^UNO-\d{5}(-\d)?$/.test(no)) { out.innerHTML = `<div class="track-note err">Enter your order number, like UNO-12345.</div>`; return; }
      if (!/^[6-9]\d{9}$/.test(phone)) { out.innerHTML = `<div class="track-note err">Enter the 10-digit mobile number you ordered with.</div>`; return; }
      if (!backend().ordersUrl) { out.innerHTML = `<div class="track-note">Order tracking turns on once the shop is connected to its order sheet.</div>`; return; }
      out.innerHTML = `<div class="track-note">Looking up ${esc(no)}…</div>`;
      fetch(`${backend().ordersUrl}?action=track&no=${encodeURIComponent(no)}&phone=${phone}`).then((r) => r.json()).then((r) => {
        if (!r.ok) { out.innerHTML = `<div class="track-note err">${r.error === "not_found" ? "We couldn't find that order. Check the number and the mobile you used." : "Something went wrong. Try again."}</div>`; return; }
        const at = Math.max(0, FLOW.indexOf(r.status === "New" && r.payment === "Cash on delivery" ? "Paid" : r.status));
        const stopped = r.status === "Cancelled" || r.status === "Returned";
        out.innerHTML = `<div class="track-card">
          <div class="track-top"><div><span class="co-label">Order</span><b>${esc(r.orderNo)}</b></div><div><span class="co-label">Total</span><b>${fmt(+r.total || 0)}</b></div></div>
          ${stopped ? `<p class="track-stopped">This order is ${esc(String(r.status).toLowerCase())}.</p>` : `<ol class="track-flow">${FLOW.map((s, i) => `<li class="${i < at ? "done" : i === at ? "current" : ""}"><span></span>${s === "New" ? "Placed" : s === "Paid" && r.payment === "Cash on delivery" ? "Confirmed" : s}</li>`).join("")}</ol>`}
          <p class="track-pay">Payment: ${esc(r.payment)}</p>
          ${r.payUrl ? `<a class="btn btn-orange btn-block" href="${esc(r.payUrl)}">Pay now with Razorpay</a>` : ""}
          ${r.trackingNo ? `<p class="track-ship">${esc(r.courier || "Courier")} · ${esc(r.trackingNo)}${r.trackingLink ? ` · <a class="linkish" href="${esc(r.trackingLink)}" target="_blank" rel="noopener">Track parcel</a>` : ""}</p>` : ""}
          <pre class="track-items">${esc(r.items || "")}</pre></div>`;
      }).catch(() => { out.innerHTML = `<div class="track-note err">We couldn't reach the order system. Check your connection and try again.</div>`; });
    });
  }

  /* ---------- product card: HUNTER box + 21st.dev patterns (break-out, float, tilt + glow, hover video) ---------- */
  const tone = (p) => (D.tones && D.tones[p.category]) || "var(--bone)";
  function cardHTML(p, i) {
    const m = p.media || {};
    return `<article class="pcard reveal" data-cat="${esc(p.category)}" data-slug="${p.slug}" style="--tone:${tone(p)};transition-delay:${(i % 4) * 80}ms">
      <a class="cover" href="product.html?p=${p.slug}" aria-label="${esc(p.name)}, ${fmt(p.price)}"></a>
      <div class="pcard-stage">
        <div class="pcard-top"><span class="cat">${esc(p.category)}</span><span class="price">${fmt(p.price)}</span></div>
        <span class="pcard-ground" aria-hidden="true"></span>
        ${p.colors.length > 1 ? `<button class="pc-arrow prev" type="button" data-step="-1" aria-label="Previous colour of ${esc(p.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><button class="pc-arrow next" type="button" data-step="1" aria-label="Next colour of ${esc(p.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>` : ""}
        <div class="pcard-figure"><div class="still">${art(p)}</div>${m.loop ? `<video muted loop playsinline preload="none" src="${m.loop}" aria-hidden="true"></video>` : ""}</div>
      </div>
      <div class="pcard-body">
        <h3 class="display">${esc(p.name)}</h3>
        <div class="pcard-row">
          <div class="dots" role="group" aria-label="Colours">${p.colors.map((c, k) => `<button type="button" style="background:${c.hex}" aria-label="${esc(c.name)}" aria-pressed="${k === 0}" data-dot="${k}"></button>`).join("")}</div>
          <div class="pcard-actions">
            <a class="btn-mini" href="product.html?p=${p.slug}" aria-label="Choose a size for ${esc(p.name)}">+ <span class="lbl">Choose size</span></a>
            <button class="heart" type="button" aria-pressed="false" aria-label="Save ${esc(p.name)}"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="none" stroke="currentColor" stroke-width="2"/></svg></button>
          </div>
        </div>
      </div>
    </article>`;
  }

  function initCards(root) {
    if (!root || root.dataset.cards) return; root.dataset.cards = "1";
    if (!lightCards) $$(".still", root).forEach((el) => cloth(el, { strength: 0.9 }));
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    // colour dots recolour the card
    root.addEventListener("click", (e) => {
      // arrows step through the colours, the same as tapping the next dot
      const arrow = e.target.closest(".pc-arrow");
      if (arrow) {
        e.preventDefault();
        const c = arrow.closest(".pcard"), dots = $$("[data-dot]", c), now = dots.findIndex((b) => b.getAttribute("aria-pressed") === "true");
        const nextDot = dots[(now + +arrow.dataset.step + dots.length) % dots.length];
        nextDot.click();
        const still = $(".still", c); still.classList.remove("slide-l", "slide-r"); void still.offsetWidth; still.classList.add(+arrow.dataset.step > 0 ? "slide-l" : "slide-r");
        return;
      }
      const dot = e.target.closest("[data-dot]"); if (!dot) return;
      const card = dot.closest(".pcard"); const p = bySlug(card.dataset.slug);
      $$("[data-dot]", card).forEach((b) => b.setAttribute("aria-pressed", String(b === dot)));
      $(".still", card).innerHTML = art(p, p.colors[+dot.dataset.dot]);
      if (!lightCards) cloth($(".still", card), { strength: 0.9 });
    });
    if (fine && !reduceMotion) {
      root.addEventListener("pointermove", (e) => {
        const card = e.target.closest(".pcard"); if (!card) return;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      });
      root.addEventListener("pointerover", (e) => {
        const card = e.target.closest(".pcard"); if (!card || card.contains(e.relatedTarget)) return;
        if (window.UNOCloth) window.UNOCloth.gust($(".still", card), true);
        const v = $("video", card); if (v) { v.play().then(() => card.classList.add("playing")).catch(() => {}); }
      });
      root.addEventListener("pointerout", (e) => {
        const card = e.target.closest(".pcard"); if (!card || card.contains(e.relatedTarget)) return;
        card.style.removeProperty("--mx"); card.style.removeProperty("--my");
        if (window.UNOCloth) window.UNOCloth.gust($(".still", card), false);
        const v = $("video", card); if (v) { v.pause(); card.classList.remove("playing"); }
      });
    } else if (!reduceMotion && "IntersectionObserver" in window) {
      // touch screens: play the motion loop while the card is on screen
      const io = new IntersectionObserver((ents) => ents.forEach((en) => {
        const v = $("video", en.target); if (!v) return;
        if (en.isIntersecting) v.play().then(() => en.target.classList.add("playing")).catch(() => {});
        else { v.pause(); en.target.classList.remove("playing"); }
      }), { threshold: 0.6 });
      $$(".pcard", root).forEach((c) => io.observe(c));
    }
  }

  /* ---------- ScrollExpand (vanilla port of the React component) ----------
     A clip-path frame grows from a rounded window to full bleed while the media zooms out.
     Same maths as the original: smoothstep easing, lerp smoothing, sticky stage in a tall track. */
  const smoothstep = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  const SX = { startRadius: 24, endRadius: 0, mediaZoom: 1.35, scrollDistance: 1.2, holdDistance: 0.35, smoothing: 0.1, overlayScrim: 0.45 };
  // the window is wider on phones so the piece is still readable before it opens
  const sxStart = () => (isSmall() ? { w: 74, h: 54 } : { w: 42, h: 58 });

  function scrollExpand(track, opts = {}) {
    if (!track) return null;
    const o = Object.assign({}, SX, sxStart(), opts);
    const stage = $(".sx-stage", track), frame = $(".sx-frame", track), media = $(".sx-media", track);
    const scrim = $(".sx-scrim", track), title = $(".sx-title", track), hint = $(".sx-hint", track), overlay = $(".sx-overlay", track);
    track.style.setProperty("--sx-len", 1 + o.scrollDistance + o.holdDistance);
    let target = 0, current = 0, raf = 0;
    const k = reduceMotion ? 1 : 1 - Math.exp(-1 / (60 * o.smoothing));

    const paint = (p) => {
      const e = smoothstep(0, 1, p);
      const w = o.w + (100 - o.w) * e, h = o.h + (100 - o.h) * e;
      const ix = (100 - w) / 2, iy = (100 - h) / 2;
      const r = o.startRadius + (o.endRadius - o.startRadius) * e;
      frame.style.clipPath = `inset(${iy.toFixed(3)}% ${ix.toFixed(3)}% ${iy.toFixed(3)}% ${ix.toFixed(3)}% round ${r.toFixed(2)}px)`;
      media.style.transform = `scale(${(o.mediaZoom + (1 - o.mediaZoom) * e).toFixed(4)})`;
      if (o.focusBlur) { const b = o.focusBlur * (1 - smoothstep(0, 0.55, p)); media.style.filter = b > 0.1 ? `blur(${b.toFixed(2)}px)` : "none"; }
      if (scrim) scrim.style.opacity = (o.overlayScrim * e).toFixed(3);
      if (title) { const out = smoothstep(0.4, 0.88, p); title.style.opacity = (1 - out).toFixed(3); title.style.transform = `translate3d(0, ${(-28 * out).toFixed(2)}px, 0) scale(${(1 + 0.06 * out).toFixed(4)})`; }
      if (hint) hint.style.opacity = (1 - smoothstep(0, 0.12, p)).toFixed(3);
      if (overlay) {
        const inn = smoothstep(0.68, 1, p);
        overlay.style.opacity = inn.toFixed(3);
        overlay.style.transform = `translate3d(0, ${(18 * (1 - inn)).toFixed(2)}px, 0)`;
        overlay.style.pointerEvents = inn > 0.5 ? "auto" : "none";
        overlay.toggleAttribute("inert", inn <= 0.5);
      }
      track.classList.toggle("is-open", e > 0.98);
    };
    const measure = () => {
      const stageH = stage.offsetHeight || window.innerHeight;
      target = Math.min(1, Math.max(0, -track.getBoundingClientRect().top / (stageH * o.scrollDistance)));
    };
    const loop = () => {
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.0005) current = target;
      paint(current);
      raf = current === target ? 0 : requestAnimationFrame(loop);
    };
    const kick = () => { measure(); if (!raf) raf = requestAnimationFrame(loop); };
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", () => { Object.assign(o, sxStart(), opts); kick(); });
    measure(); current = target; paint(current);
    return { paint };
  }

  /* click a product: the card's picture flies into the product page's starting window, then we navigate */
  function flyToProduct(card, href) {
    const still = $(".still > .garment", card);
    if (!still) return false;
    const vw = window.innerWidth, vh = window.innerHeight, fr = still.getBoundingClientRect();
    // where the product page draws the garment (mirrors the .pdp2-stage grid)
    const gutter = Math.min(40, Math.max(16, vw * 0.03));
    let w, cx, cy;
    if (vw > 960) {
      const col = vw - gutter * 2 - 250 - 320 - 48, avail = vh - 118;
      w = Math.min(col, 520, avail / 1.1); cx = gutter + 250 + 24 + col / 2; cy = 90 + avail / 2;
    } else {
      const box = vh * 0.64; w = Math.min((vw - gutter * 2) * 0.7, box / 1.1); cx = vw / 2; cy = 80 + box / 2;
    }
    let h = w * 1.1;
    // on desktop the product page opens on the close-up (scale 2.3, shifted down 44%), so land there
    if (!reduceMotion) { cy += h * 0.44; w *= 2.3; h *= 2.3; }
    const fly = document.createElement("div");
    fly.className = "pdp-fly"; fly.setAttribute("aria-hidden", "true");
    fly.innerHTML = `<div class="pdp-fly-bg"></div><div class="pdp-fly-garment" style="left:${cx - w / 2}px;top:${cy - h / 2}px;width:${w}px;height:${h}px">${still.outerHTML.replace(' loading="lazy"', "")}</div>`;
    document.body.appendChild(fly);
    const g = $(".pdp-fly-garment", fly);
    const dx = fr.left + fr.width / 2 - cx, dy = fr.top + fr.height / 2 - cy, sc = fr.width / w;
    const timing = { duration: 700, easing: "cubic-bezier(.7,0,.2,1)", fill: "forwards" };
    $(".pdp-fly-bg", fly).animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, delay: 120, fill: "forwards" });
    g.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${sc})` }, { transform: "none" }], timing);
    setTimeout(() => { try { sessionStorage.setItem("sx-from-card", "1"); } catch (e) {} location.href = href; }, 740);
    return true;
  }

  function initFly(root) {
    if (!root || reduceMotion || !("animate" in Element.prototype)) return;
    root.addEventListener("click", (e) => {
      const a = e.target.closest("a.cover, a.btn-mini"); if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      const card = a.closest(".pcard"); if (!card) return;
      if (flyToProduct(card, a.getAttribute("href"))) e.preventDefault();
    });
  }
  // coming back with the browser's back button: drop any leftover fly layer
  window.addEventListener("pageshow", () => $$(".sx-fly, .pdp-fly").forEach((n) => n.remove()));

  function initReveal() {
    const els = $$(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
  }

  function fillMarquee(el, words) {
    if (!el) return;
    const run = words.map((w) => `<span>${esc(w)}</span><span>✶</span>`).join("");
    el.innerHTML = run + run;
  }

  /* ---------- HOME ---------- */
  function initHome() {
    const hero = bySlug("supercharge-power-boy-tee");
    $("#hero-figure").innerHTML = art(hero, hero.colors[0]).replace(' loading="lazy"', ' fetchpriority="high"');
    cloth($("#hero-figure"), { strength: 1.2, res: 1.35 });
    // callouts live on the tee itself, so they point at the right spot on any screen and move with it
    if ($(".sx-callouts")) $("#hero-figure").appendChild($(".sx-callouts"));
    $("#chip-1").innerHTML = art(bySlug("remix-tee"));
    fillMarquee($("#marquee-1"), ["unorgnl.", "Nothing is original. Inspired by you.", "first run only", "supercharge power boy"]);
    fillMarquee($("#marquee-2"), ["unorgnl.", "unorgnl.", "unorgnl."]);

    // categories (momento): list with counts, image swaps with a blur on hover
    const cats = [...new Set(D.products.map((p) => p.category))];
    const list = $("#cats-list"), frame = $("#cats-frame");
    list.innerHTML = cats.map((c, i) => {
      const n = D.products.filter((p) => p.category === c).length;
      return `<li><a href="#collection" data-cat="${esc(c)}"><sup>[0${i + 1}]</sup>${esc(c)} (${n})</a></li>`;
    }).join("");
    const showCat = (c) => {
      const p = D.products.find((x) => x.category === c);
      frame.innerHTML = `<span class="ghost" aria-hidden="true">${String(cats.indexOf(c) + 1).padStart(2, "0")}</span><div class="blur-swap">${art(p)}</div>
        <span class="pill tag">${esc(p.name)} · ${fmt(p.price)}</span><a class="go" href="product.html?p=${p.slug}" aria-label="View ${esc(p.name)}">↗</a>
        <span class="cats-hint" aria-hidden="true">pull the fabric · drag around it to turn</span>`;
      cloth($(".blur-swap", frame), { strength: 1, interactive: true, area: frame });
      $$("a", list).forEach((a) => a.setAttribute("aria-current", String(a.dataset.cat === c)));
    };
    list.addEventListener("mouseover", (e) => { const a = e.target.closest("[data-cat]"); if (a && a.getAttribute("aria-current") !== "true") showCat(a.dataset.cat); });
    list.addEventListener("focusin", (e) => { const a = e.target.closest("[data-cat]"); if (a) showCat(a.dataset.cat); });
    list.addEventListener("click", (e) => { const a = e.target.closest("[data-cat]"); if (a) setFilter(a.dataset.cat); });
    showCat(cats[0]);
    // [Categories] label + the category lines wave sideways on scroll
    // a smaller wave on phones so no line slides off the edge
    wavyBlock($(".cats > div"), [$(".cats > div > .mono"), ...$$("li", list)], isSmall() ? { baseOffsetFactor: 0.12, baseAmplitude: 70 } : {});

    initFit();
    initLookbook();
    initUgc();
    initFaq();
    initHeroExtras();
    initRunway();

    // collection (HUNTER) + filters
    $("#grid").innerHTML = D.products.map(cardHTML).join("");
    initCards($("#grid"));
    const filters = ["All", ...cats];
    $("#filters").innerHTML = filters.map((f) => `<button class="pill" type="button" data-filter="${esc(f)}" aria-pressed="${f === "All"}">${esc(f === "All" ? "All collection" : f)}</button>`).join("");
    function setFilter(f) {
      $$("[data-filter]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === f)));
      $$(".pcard", $("#grid")).forEach((c) => c.classList.toggle("is-hidden", f !== "All" && c.dataset.cat !== f));
    }
    $("#filters").addEventListener("click", (e) => { const b = e.target.closest("[data-filter]"); if (b) setFilter(b.dataset.filter); });

    initFly($("#grid"));
    scrollExpand($(".sx-hero"), { holdDistance: reduceMotion ? 0.35 : 0.35 + 0.15 + RUNWAY_LEN + 0.2 });

    if (!hasGsap || !window.ScrollTrigger || reduceMotion) return;
    // intro: the window and title arrive, then scroll takes over
    gsap.from(".sx-hero .sx-frame", { scale: 0.86, opacity: 0, duration: 1.3, ease: "expo.out" });
    gsap.from(".sx-hero .sx-title", { y: 60, filter: "blur(12px)", duration: 1.2, ease: "expo.out", delay: 0.1, clearProps: "filter" });
  }

  /* ---------- Lookbook: looks built from the collection; tapping one loads it in the fitting room ---------- */
  const LOOKS = [
    { name: "Fully charged", top: "supercharge-power-boy-tee", bottom: "second-draft-cargo", note: "Print up top, utility below." },
    { name: "Red alert", top: "copy-bomber", bottom: "rerun-trouser", note: "The bomber does the talking." },
    { name: "Second take", top: "ditto-overshirt", bottom: "second-draft-cargo", note: "Tonal, layered, easy." },
    { name: "Off duty", top: "carbon-copy-shirt", bottom: "rerun-trouser", note: "Camp collar, clean taper." },
  ];
  function initLookbook() {
    const grid = $("#lb-grid"); if (!grid) return;
    grid.innerHTML = LOOKS.map((l, i) => {
      const t = bySlug(l.top), b = bySlug(l.bottom);
      return `<article class="lb-look lb-${i + 1}" style="--tone:${tone(t)}">
        <div class="lb-stage"><span class="lb-no" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
          <div class="lb-outfit"><span class="lb-top">${art(t)}</span><span class="lb-bottom">${art(b)}</span></div></div>
        <div class="lb-info"><h3>${esc(l.name)}</h3><p>${esc(l.note)}</p>
          <p class="lb-pieces"><a href="product.html?p=${t.slug}">${esc(t.name)}</a> + <a href="product.html?p=${b.slug}">${esc(b.name)}</a> · ${fmt(t.price + b.price)}</p>
          <button class="btn btn-ink" type="button" data-try-look="${i}">Try this look</button></div>
      </article>`;
    }).join("");
    grid.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-try-look]"); if (!btn) return;
      const l = LOOKS[+btn.dataset.tryLook];
      document.dispatchEvent(new CustomEvent("fit:set", { detail: { top: l.top, bottom: l.bottom } }));
      $("#fit").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  }

  /* ---------- Your fits: real customer posts, or invitation tiles until there are some ---------- */
  function initUgc() {
    const grid = $("#ugc-grid"); if (!grid) return;
    const posts = (D.ugc || []).filter((u) => u && u.image);
    const tiles = posts.length ? posts.slice(0, 8).map((u) => { const p = bySlug(u.slug);
      return `<a class="ugc-tile" href="${p ? "product.html?p=" + p.slug : "#collection"}"><img src="${esc(u.image)}" alt="${esc(u.handle || "Customer")} wearing ${p ? esc(p.name) : "unorgnl."}" loading="lazy"><span>${esc(u.handle || "")}${p ? ` · ${esc(p.name)}` : ""}</span></a>`; })
      : Array.from({ length: 6 }, (_, i) => i === 0
        ? `<div class="ugc-tile ugc-cta"><b>Your fit here</b><p>Post a photo in your piece and tag us on Instagram. We'll ask before we share it.</p></div>`
        : `<div class="ugc-tile ugc-empty" aria-hidden="true"><svg viewBox="0 0 48 48"><rect x="6" y="12" width="36" height="26" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="24" cy="25" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M17 12l3-5h8l3 5" fill="none" stroke="currentColor" stroke-width="2"/></svg></div>`);
    grid.innerHTML = tiles.join("");
  }

  /* ---------- FAQ ---------- */
  function initFaq() {
    const list = $("#faq-list"); if (!list) return;
    list.innerHTML = (D.faq || []).map(([q, a]) => `<details class="faq-item"><summary><span>${esc(q)}</span><i aria-hidden="true"></i></summary><p>${esc(a)}</p></details>`).join("");
  }

  /* ---------- hero: callouts, badge, drifting wordmark, a little mouse parallax ---------- */
  function initHeroExtras() {
    const hero = $(".sx-hero"), scene = $(".sx-hero .sx-scene"); if (!hero || reduceMotion) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0, tx = 0, ty = 0, x = 0, y = 0;
    const loop = () => { x += (tx - x) * 0.08; y += (ty - y) * 0.08; scene.style.setProperty("--px", x.toFixed(3)); scene.style.setProperty("--py", y.toFixed(3)); raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.001 ? requestAnimationFrame(loop) : 0; };
    hero.addEventListener("pointermove", (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; if (!raf) raf = requestAnimationFrame(loop); });
    hero.addEventListener("pointerleave", () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
  }

  /* ---------- hero runway, driven by scroll: once the hero is fully open, the tee steps off,
     then three models walk on one after another as you scroll, then the page moves on ---------- */
  const RUNWAY_LEN = window.matchMedia("(max-width: 960px)").matches ? 2.6 : 4.8;   // shorter show on phones                       // extra screen-heights of scroll the hero holds for the show
  function initRunway() {
    const hero = $(".sx-hero"), runway = $(".runway"), model = $(".runway .model"), tag = $(".runway-tag"), figure = $("#hero-figure");
    if (!hero || !runway || reduceMotion) return;
    const order = [1, 2, 3];                    // Red alert, Second take, Off duty
    const ease = (t) => t * t * (3 - 2 * t);
    const clamp01 = (v) => Math.min(1, Math.max(0, v));
    let dressed = -1, target = 0, current = 0, raf = 0;
    const dress = (n) => {
      if (n === dressed) return; dressed = n;
      const look = LOOKS[order[n]], t = bySlug(look.top), b = bySlug(look.bottom);
      $(".m-top", model).innerHTML = art(t).replace(' loading="lazy"', ""); $(".m-bottom", model).innerHTML = art(b).replace(' loading="lazy"', "");
      $("b", tag).innerHTML = `${esc(look.name)}<small>${esc(t.name)} + ${esc(b.name)} · ${fmt(t.price + b.price)}</small>`;
    };
    // preload every look so nothing pops in mid-walk
    order.forEach((n) => { [LOOKS[n].top, LOOKS[n].bottom].forEach((slug) => { const m = (bySlug(slug).media || {}).front; if (m) { const im = new Image(); im.src = m; } }); });
    const progress = () => {
      const vh = window.innerHeight, scrolled = -hero.getBoundingClientRect().top;
      return clamp01((scrolled - vh * (SX.scrollDistance + 0.15)) / (vh * RUNWAY_LEN));
    };
    const paint = (r) => {
      const vw = window.innerWidth, off = Math.max(vw * 0.75, vw / 2 + 340);   // far enough that nothing peeks in on a narrow phone
      // 0 - 0.12: the hero tee steps off to the left
      const teeOut = ease(clamp01(r / 0.12));
      figure.style.transform = teeOut > 0 ? `translateX(${(-off * teeOut).toFixed(1)}px)` : "";
      hero.classList.toggle("runway-on", r > 0.001);
      // 0.12 - 1: three looks, each walks in (38%), poses (24%), walks out (38%)
      const rr = (r - 0.12) / 0.88;
      if (rr <= 0) { model.style.transform = `translateX(${off}px)`; runway.classList.remove("tag-on"); model.classList.remove("posing"); return; }
      const n = Math.min(order.length - 1, Math.floor(rr * order.length)), s = rr * order.length - n;
      dress(n);
      let x, moving = true;
      if (s < 0.38) x = off * (1 - ease(s / 0.38));
      else if (s < 0.62) { x = 0; moving = false; }
      else x = -off * ease((s - 0.62) / 0.38);
      if (rr >= 1) x = -off;
      model.style.transform = `translateX(${x.toFixed(1)}px)`;
      // the stride follows the distance walked, so stopping the scroll stops the step
      const sw = moving ? Math.sin(x / 48) * 8 : 0;
      model.style.setProperty("--sw", sw.toFixed(2));
      model.style.setProperty("--bob", moving ? (Math.abs(Math.sin(x / 48)) * -1.2).toFixed(2) + "%" : "0%");
      model.classList.toggle("posing", !moving);
      runway.classList.toggle("tag-on", !moving);
    };
    const loop = () => { current += (target - current) * 0.09; if (Math.abs(target - current) < 0.0005) current = target; paint(current); raf = current === target ? 0 : requestAnimationFrame(loop); };
    const kick = () => { target = progress(); if (!raf) raf = requestAnimationFrame(loop); };
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    target = current = progress(); paint(current);
  }

  /* ---------- Build your fit: rails, a mirror you can turn, a swing tag ---------- */
  const HANGER = `<svg class="fit-hanger" viewBox="0 0 60 30" aria-hidden="true"><path class="hook" d="M30 11V8.2a4.4 4.4 0 1 0-4.4-4.4"/><path class="frame" d="M30 11 5 26.5c-1.6 1-1 2.5.8 2.5h48.4c1.8 0 2.4-1.5.8-2.5Z"/></svg>`;
  function initFit() {
    if (!$("#fit")) return;
    const pools = { top: D.products.filter((p) => p.category !== "Pants"), bottom: D.products.filter((p) => p.category === "Pants") };
    const st = { top: 0, bottom: 0, topSize: null, bottomSize: null };
    let turnDeg = 0, dragX = null, keyT = 0;
    const cur = (slot) => pools[slot][st[slot]];
    const rail = (slot) => $(slot === "top" ? "#fit-tops" : "#fit-bottoms");
    ["top", "bottom"].forEach((slot) => {
      rail(slot).innerHTML = pools[slot].map((p, i) => `<button class="fit-chip" type="button" role="radio" aria-checked="${i === 0}" data-slot="${slot}" data-i="${i}" style="--tone:${tone(p)}">
        <span class="fit-hang">${HANGER}<span class="fit-chip-img">${art(p)}</span></span><span class="fit-chip-name">${esc(p.name)}</span></button>`).join("");
    });
    const paintSlot = (slot, dir) => {
      const p = cur(slot), el = $("#fit-" + slot);
      const swap = () => { el.innerHTML = art(p); cloth(el, { strength: 1 }); if (turnDeg) setTimeout(() => turnAll(turnDeg), 60); };
      if (dir && !reduceMotion && el.animate) {
        el.animate([{ transform: "none", opacity: 1 }, { transform: `translateX(${-dir * 50}px)`, opacity: 0 }], { duration: 180, easing: "ease-in" }).finished.then(() => {
          swap(); el.animate([{ transform: `translateX(${dir * 50}px)`, opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 420, easing: "cubic-bezier(.2,.7,.1,1)" });
        });
      } else swap();
      $$(".fit-chip", rail(slot)).forEach((c, i) => {
        c.setAttribute("aria-checked", String(i === st[slot]));
        if (dir && i === st[slot]) { c.classList.remove("swing"); void c.offsetWidth; c.classList.add("swing"); }
      });
      if (dir) { const tag = $(".fit-tag"); tag.classList.remove("swing"); void tag.offsetWidth; tag.classList.add("swing"); }
      const name = $(`#fit-${slot}-name`); name.textContent = p.name; name.href = "product.html?p=" + p.slug;
      $(`#fit-${slot}-price`).textContent = fmt(p.price);
      st[slot + "Size"] = null;
      $(`#fit-${slot}-sizes`).innerHTML = (D.sizes[p.type] || ["One size"]).map((z) => `<button class="size" type="button" data-fit-size="${slot}" aria-pressed="false">${esc(z)}</button>`).join("");
      $("#fit-total").textContent = fmt(cur("top").price + cur("bottom").price);
      $("#fit-error").textContent = "";
    };
    paintSlot("top"); paintSlot("bottom");
    document.addEventListener("fit:set", (e) => {
      ["top", "bottom"].forEach((slot) => {
        const i = pools[slot].findIndex((p) => p.slug === e.detail[slot]);
        if (i >= 0 && i !== st[slot]) { const dir = i > st[slot] ? 1 : -1; st[slot] = i; paintSlot(slot, dir); }
      });
    });

    $("#fit").addEventListener("click", (e) => {
      const chip = e.target.closest(".fit-chip");
      if (chip) { const slot = chip.dataset.slot, i = +chip.dataset.i; if (i !== st[slot]) { const dir = i > st[slot] ? 1 : -1; st[slot] = i; paintSlot(slot, dir); } }
      const sz = e.target.closest("[data-fit-size]");
      if (sz) { const slot = sz.dataset.fitSize; st[slot + "Size"] = sz.textContent; $$(`[data-fit-size="${slot}"]`).forEach((b) => b.setAttribute("aria-pressed", String(b === sz))); $("#fit-error").textContent = ""; }
    });
    // arrow keys move through a rail, like a radio group
    $("#fit").addEventListener("keydown", (e) => {
      const chip = e.target.closest(".fit-chip"); if (!chip || !/Arrow(Left|Right|Up|Down)/.test(e.key)) return;
      e.preventDefault();
      const slot = chip.dataset.slot, n = pools[slot].length, step = /Right|Down/.test(e.key) ? 1 : -1;
      st[slot] = (st[slot] + step + n) % n; paintSlot(slot, step); $$(".fit-chip", rail(slot))[st[slot]].focus();
    });

    // drag the mirror to turn the outfit; it springs back when you let go
    const mirror = $("#fit-mirror");
    const turnAll = (deg) => { turnDeg = deg; mirror.style.setProperty("--turn", deg); if (window.UNOCloth) { UNOCloth.turn($("#fit-top"), deg); UNOCloth.turn($("#fit-bottom"), deg); } };
    const clampDeg = (d) => Math.max(-55, Math.min(55, d));
    mirror.addEventListener("pointerdown", (e) => { dragX = e.clientX; mirror.classList.add("is-turning", "turned"); try { mirror.setPointerCapture(e.pointerId); } catch (err) { /* synthetic or lost pointer */ } });
    mirror.addEventListener("pointermove", (e) => { if (dragX !== null) turnAll(clampDeg((e.clientX - dragX) * 0.35)); });
    const end = () => { if (dragX === null) return; dragX = null; mirror.classList.remove("is-turning"); turnAll(0); };
    mirror.addEventListener("pointerup", end); mirror.addEventListener("pointercancel", end);
    mirror.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault(); mirror.classList.add("turned");
      turnAll(clampDeg(turnDeg + (e.key === "ArrowRight" ? 20 : -20)));
      clearTimeout(keyT); keyT = setTimeout(() => turnAll(0), 1400);
    });

    $("#fit-add").addEventListener("click", () => {
      const miss = ["top", "bottom"].find((slot) => !st[slot + "Size"]);
      if (miss) {
        $("#fit-error").textContent = `Choose a ${miss} size`;
        const row = $(`#fit-${miss}-sizes`); row.classList.remove("shake"); void row.offsetWidth; row.classList.add("shake"); return;
      }
      const t = cur("top"), b = cur("bottom");
      addToBag(t.slug, t.colors[0].name, st.topSize, { silent: true });
      addToBag(b.slug, b.colors[0].name, st.bottomSize, { silent: true });
      Promise.all([flyToBag($("#fit-top")), new Promise((r) => setTimeout(r, 140)).then(() => flyToBag($("#fit-bottom")))])
        .then(() => { updateCount(true); renderBag(); openDrawer(); toast("The fit is in your bag"); });
    });
  }

  /* ---------- Reviews (ClientFeedback): 3 columns, big + small cards, blur reveal 0.4s apart ---------- */
  function initReviews() {
    const grid = $("#rev-grid"); if (!grid) return;
    // the layout of the original: [big, small] [ink, ink, ink] [small, big]
    const slots = [["big", "red"], ["ink", "ink", "ink"], ["red", "big"]];
    const real = (D.reviews || []).filter((r) => r && r.quote);
    const picks = ["supercharge-power-boy-tee", "copy-bomber", "remix-tee", "second-draft-cargo", "ditto-overshirt", "carbon-copy-shirt", "rerun-trouser"];
    let n = 0;
    const card = (kind) => {
      const i = n++;
      const r = real[i] || null, p = bySlug((r && r.slug) || picks[i % picks.length]) || D.products[0];
      const quote = r ? `“${esc(r.quote)}”` : `[Review of the ${esc(p.name)} goes here]`;
      const who = r ? esc(r.name) : "Customer name";
      const detail = r ? `${esc(r.detail || "")}${r.detail ? " · " : ""}${esc(p.name)}` : `City · ${esc(p.name)}`;
      return `<article class="rev-card ${kind} rev-reveal${r ? "" : " is-placeholder"}" style="--i:${i}">
        ${kind === "big" ? '<span class="rev-grid-bg" aria-hidden="true"></span>' : ""}
        ${r ? (r.sample ? '<span class="rev-sample mono">Sample</span>' : "") : '<span class="rev-ph mono">Placeholder</span>'}
        <div class="rev-body"><p class="rev-quote">${quote}</p>
          <div class="rev-foot"><div><h3>${who}</h3><p>${detail}</p></div><a class="rev-thumb" href="product.html?p=${p.slug}" style="--tone:${tone(p)}" aria-label="${esc(p.name)}">${art(p)}</a></div></div>
      </article>`;
    };
    grid.innerHTML = slots.map((col) => `<div class="rev-col">${col.map(card).join("")}</div>`).join("");
    const els = $$(".rev-reveal", $("#reviews"));
    if (reduceMotion || !("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("in")); return; }
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (!en.isIntersecting) return;
      els.forEach((el) => el.classList.add("in")); io.disconnect();
    }), { threshold: 0.15 });
    io.observe($("#reviews"));
  }

  /* ---------- arrival estimate: 1-2 working days to pack, 3-6 to deliver, Sundays skipped ---------- */
  function initArrival() {
    const el = $("#pdp-arrive"); if (!el) return;
    const add = (d, n) => { const x = new Date(d); while (n > 0) { x.setDate(x.getDate() + 1); if (x.getDay() !== 0) n--; } return x; };
    const now = new Date(), a = add(now, 1 + 3), b = add(now, 2 + 6);
    const day = (d) => d.toLocaleDateString("en-IN", { day: "numeric" });
    const mon = (d) => d.toLocaleDateString("en-IN", { month: "short" });
    const range = a.getMonth() === b.getMonth() ? `${day(a)}–${day(b)} ${mon(b)}` : `${day(a)} ${mon(a)} – ${day(b)} ${mon(b)}`;
    el.innerHTML = `✶ <b>Arrives ${range}</b> with standard delivery. Free over ${fmt(D.freeShippingOver)}.`;
  }

  /* ---------- complete the fit: the matching piece, added in two taps (size, then done) ---------- */
  function initPairUp(p) {
    const box = $("#pair-up"); if (!box) return;
    const look = LOOKS.find((l) => l.top === p.slug || l.bottom === p.slug);
    let other = look ? bySlug(look.top === p.slug ? look.bottom : look.top) : null;
    if (!other) other = D.products.find((x) => (p.category === "Pants" ? x.category !== "Pants" : x.category === "Pants") && x.slug !== p.slug);
    if (!other) return;
    const sizes = D.sizes[other.type] || ["One size"];
    box.hidden = false;
    box.innerHTML = `<a class="pu-img" href="product.html?p=${other.slug}" style="--tone:${tone(other)}">${art(other)}</a>
      <div class="pu-main"><span class="pu-label">Complete the fit</span><a class="pu-name" href="product.html?p=${other.slug}">${esc(other.name)}</a><span class="pu-price">${fmt(other.price)}</span>
        <div class="pu-sizes" role="group" aria-label="Size for ${esc(other.name)}" hidden>${sizes.map((z) => `<button type="button" class="size" data-pu-size="${esc(z)}">${esc(z)}</button>`).join("")}</div></div>
      <button type="button" class="pu-add" aria-expanded="false">+ Add</button>`;
    const btn = $(".pu-add", box), row = $(".pu-sizes", box);
    btn.addEventListener("click", () => {
      if (btn.classList.contains("done")) { renderBag(); openDrawer(); return; }
      const open = row.hidden; row.hidden = !open; btn.setAttribute("aria-expanded", String(open)); btn.textContent = open ? "Pick a size" : "+ Add";
    });
    row.addEventListener("click", (e) => {
      const b = e.target.closest("[data-pu-size]"); if (!b) return;
      addToBag(other.slug, other.colors[0].name, b.dataset.puSize, { silent: true });
      flyToBag($(".pu-img", box)).then(() => { updateCount(true); toast(`${other.name} added to bag`); });
      row.hidden = true; btn.classList.add("done"); btn.textContent = "Added ✓ View bag";
    });
  }

  /* ---------- product reviews: per product, with photos; new reviews go to the sheet for approval ---------- */
  const stars = (n) => `<span class="rv-stars" aria-label="${n} out of 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? "on" : ""}">★</i>`).join("")}</span>`;
  const FIT = { small: "Runs small", true: "True to size", large: "Runs large" };
  function initProductReviews(p) {
    const list = $("#rv-list"), panel = $("#rv-panel"), scrim = $("#rv-scrim"), chip = $("#rv-chip");
    if (!list || !panel) return;
    const WORDS = ["", "Not for me", "Okay", "Good", "Really good", "Love it"];
    const mine = () => { try { return (JSON.parse(localStorage.getItem("unorgnl-my-reviews")) || []).filter((r) => r.slug === p.slug); } catch (e) { return []; } };
    let live = [];
    const render = () => {
      const all = [...mine().map((r) => ({ ...r, mine: true })), ...live, ...(D.reviews || []).filter((r) => r.slug === p.slug)];
      const rated = all.filter((r) => r.rating);
      const avg = rated.length ? rated.reduce((a, r) => a + r.rating, 0) / rated.length : 0;
      const fits = all.filter((r) => r.fit), fitTrue = fits.filter((r) => r.fit === "true").length;
      // the small chip under the price
      chip.innerHTML = all.length
        ? `${stars(Math.round(avg))}<b>${avg.toFixed(1)}</b><span>${all.length} ${all.length === 1 ? "review" : "reviews"}</span>`
        : `<span class="rv-empty-star" aria-hidden="true">☆</span><span>Write the first review</span>`;
      // a one-line quote from the newest review, also opens the panel
      const teaser = $("#rv-teaser"), top = all.find((r) => (r.quote || r.text));
      if (teaser) {
        teaser.hidden = !top;
        if (top) { const q = (top.quote || top.text).trim(); teaser.innerHTML = `<q>${esc(q.length > 70 ? q.slice(0, 68).trim() + "…" : q)}</q><span>${esc(top.name || "Customer")}</span>`; teaser.setAttribute("aria-label", `Review from ${top.name || "a customer"}: ${q}. Open reviews`); }
      }
      chip.setAttribute("aria-label", all.length ? `Rated ${avg.toFixed(1)} out of 5 from ${all.length} reviews. Open reviews` : "No reviews yet. Write the first review");
      $("#rv-summary").innerHTML = all.length
        ? `<b>${avg.toFixed(1)}</b><div>${stars(Math.round(avg))}<span>${all.length} ${all.length === 1 ? "review" : "reviews"}${fits.length >= 2 ? ` · ${Math.round((fitTrue / fits.length) * 100)}% say true to size` : ""}</span></div>`
        : `<div><span>No reviews yet for the ${esc(p.name)}.</span></div>`;
      list.innerHTML = all.map((r, i) => `<article class="rv-item${r.mine ? " is-mine" : ""}" style="--d:${i * 50}ms">
          <div class="rv-top">${stars(r.rating || 5)}<span class="rv-who"><b>${esc(r.name || "Customer")}</b>${r.detail || r.city ? ` · ${esc(r.detail || r.city)}` : ""}</span>${r.sample ? '<span class="rv-tag">Sample</span>' : ""}</div>
          <p class="rv-text">${esc(r.quote || r.text || "")}</p>
          ${(r.photos || []).length ? `<div class="rv-pics">${r.photos.map((src, k) => `<button type="button" class="rv-pic" data-pic="${i}:${k}" aria-label="Open photo ${k + 1} from ${esc(r.name)}"><img src="${esc(src)}" alt="Photo from ${esc(r.name)}" loading="lazy"></button>`).join("")}</div>` : ""}
          <p class="rv-meta">${r.size ? `Bought ${esc(r.size)}` : ""}${r.size && r.fit ? " · " : ""}${r.fit ? FIT[r.fit] || "" : ""}${r.mine ? `<span class="rv-mine">Only you can see this. In the live shop, reviews appear after the shop checks them.</span>` : ""}</p>
        </article>`).join("");
      list._all = all;
    };
    render();
    const url = (D.backend || {}).ordersUrl;
    if (url) fetch(`${url}?action=reviews&slug=${encodeURIComponent(p.slug)}`).then((r) => r.json()).then((r) => { if (r.ok) { live = r.reviews || []; render(); } }).catch(() => {});

    // open / close the panel
    let lastFocus = null;
    const open = () => {
      lastFocus = document.activeElement;
      panel.hidden = false; scrim.hidden = false;
      requestAnimationFrame(() => { panel.classList.add("open"); scrim.classList.add("open"); list.classList.add("in"); });
      document.body.style.overflow = "hidden";
      setTimeout(() => panel.focus(), 60);
    };
    const close = () => {
      panel.classList.remove("open"); scrim.classList.remove("open"); list.classList.remove("in");
      document.body.style.overflow = "";
      setTimeout(() => { panel.hidden = true; scrim.hidden = true; }, 380);
      if (lastFocus) lastFocus.focus();
    };
    chip.addEventListener("click", open);
    if ($("#rv-teaser")) $("#rv-teaser").addEventListener("click", open);
    // a link ending in #reviews opens the panel straight away
    if (location.hash === "#reviews") setTimeout(open, 400);
    scrim.addEventListener("click", close);
    panel.addEventListener("click", (e) => { if (e.target.closest("[data-rv-close]")) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && panel.classList.contains("open") && !$(".modal").classList.contains("open")) close(); });

    // photo lightbox
    list.addEventListener("click", (e) => {
      const b = e.target.closest("[data-pic]"); if (!b) return;
      const [i, k] = b.dataset.pic.split(":").map(Number), r = list._all[i];
      $(".modal-card").innerHTML = `<img class="rv-big" src="${esc(r.photos[k])}" alt="Photo from ${esc(r.name)}"><p class="muted" style="margin:10px 0 14px">${esc(r.name)}${r.size ? ` · Bought ${esc(r.size)}` : ""}</p><button class="btn btn-ink btn-block" type="button" data-close-modal>Close</button>`;
      $(".modal").classList.add("open");
    });

    // write: one tap on a star starts it, the rest unfolds
    const form = $("#rv-form"), err = $("#rv-error"), photos = [];
    const starsBox = $(".rv-stars-input", form);
    starsBox.innerHTML = [5, 4, 3, 2, 1].map((n) => `<label><input type="radio" name="rating" value="${n}"><span aria-hidden="true">★</span><b class="sr">${n} star${n > 1 ? "s" : ""}</b></label>`).join("");
    $("#rv-size").innerHTML = (D.sizes[p.type] || ["One size"]).map((z) => `<option>${esc(z)}</option>`).join("");
    starsBox.addEventListener("change", (e) => {
      const n = +e.target.value;
      $(".rv-word", form).textContent = WORDS[n];
      const lab = e.target.closest("label"); lab.classList.remove("pop"); void lab.offsetWidth; lab.classList.add("pop");
      if (!form.classList.contains("rated")) { form.classList.add("rated"); $("#rv-ask").textContent = "Thanks. Tell us a little more."; setTimeout(() => form.elements.name.focus({ preventScroll: true }), 350); }
    });
    const reset = () => { form.reset(); form.classList.remove("rated", "posted"); photos.length = 0; paintPhotos(); $(".rv-word", form).textContent = ""; $("#rv-ask").textContent = "Own it? Tap a star to rate it."; err.textContent = ""; };
    $("#rv-cancel").addEventListener("click", reset);
    const shrink = (file) => new Promise((resolve, reject) => {
      const img = new Image(), u = URL.createObjectURL(file);
      img.onload = () => { const k = Math.min(1, 1280 / Math.max(img.width, img.height)); const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); resolve(c.toDataURL("image/jpeg", 0.82)); };
      img.onerror = () => { URL.revokeObjectURL(u); reject(new Error("not an image")); };
      img.src = u;
    });
    const paintPhotos = () => {
      $$(".rv-thumb", form).forEach((n) => n.remove());
      photos.forEach((src, i) => $(".rv-add", form).insertAdjacentHTML("beforebegin", `<span class="rv-thumb"><img src="${src}" alt=""><button type="button" data-rm="${i}" aria-label="Remove photo ${i + 1}">×</button></span>`));
      $(".rv-add", form).hidden = photos.length >= 3;
      $(".rv-photo-hint", form).textContent = photos.length ? `${photos.length} of 3` : "Add up to 3 photos";
    };
    $("#rv-file").addEventListener("change", async (e) => {
      err.textContent = "";
      for (const f of [...e.target.files].slice(0, 3 - photos.length)) {
        if (!/^image\//.test(f.type)) { err.textContent = "Photos only, please."; continue; }
        try { photos.push(await shrink(f)); } catch (x) { err.textContent = "That photo couldn't be read. Try another one."; }
      }
      e.target.value = ""; paintPhotos();
    });
    form.addEventListener("click", (e) => { const b = e.target.closest("[data-rm]"); if (b) { photos.splice(+b.dataset.rm, 1); paintPhotos(); } });
    form.addEventListener("submit", (e) => {
      e.preventDefault(); err.textContent = "";
      const f = form.elements;
      if (!f.rating.value) { err.textContent = "Tap a star first."; return; }
      if (f.name.value.trim().length < 2) { err.textContent = "Add your name."; f.name.focus(); return; }
      if (f.text.value.trim().length < 10) { err.textContent = "A few more words, please (10 characters or more)."; f.text.focus(); return; }
      if (!f.consent.checked) { err.textContent = "Tick the box so we can show your review."; return; }
      const review = { type: "review", hp: f.hp.value, slug: p.slug, name: f.name.value.trim(), city: f.city.value.trim(), rating: +f.rating.value, size: f.size.value, fit: f.fit.value, text: f.text.value.trim(), photos: photos.slice() };
      const btn = $(".rv-post", form); btn.disabled = true; $(".rv-post-label", btn).textContent = "Posting…";
      const done = (ok, msg) => {
        btn.disabled = false; $(".rv-post-label", btn).textContent = "Post review";
        if (!ok) { err.textContent = msg; return; }
        // the button becomes a tick, then the form folds away
        form.classList.add("posted"); $(".rv-post-label", btn).textContent = "Thanks!";
        setTimeout(() => { reset(); $("#rv-ask").textContent = msg; }, 1400);
      };
      if (!url) {
        try { const all = JSON.parse(localStorage.getItem("unorgnl-my-reviews")) || []; all.unshift({ ...review, detail: review.city, quote: review.text }); localStorage.setItem("unorgnl-my-reviews", JSON.stringify(all.slice(0, 20))); } catch (x) { /* storage blocked */ }
        setTimeout(() => { render(); done(true, "Saved on this device. (Demo mode)"); }, 500);
        return;
      }
      fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(review) })
        .then((r) => r.json()).then((r) => done(r.ok, r.ok ? "Thanks! It'll show once we've checked it." : "That didn't go through. Try again in a moment."))
        .catch(() => done(false, "Couldn't reach the shop. Check your connection and try again."));
    });
  }

  /* ---------- THE INDEX (big name list with a cursor preview) ---------- */
  function initIndex(currentSlug) {
    const list = $("#index-list"); if (!list) return;
    // each row carries a small thumbnail (shown on touch screens, where there is no hover)
    list.innerHTML = D.products.map((p, i) => `<li><a href="product.html?p=${p.slug}" data-peek="${p.slug}" ${p.slug === currentSlug ? 'aria-current="page"' : ""}>
      <span class="mono">[${String(i + 1).padStart(2, "0")}]</span><span class="idx-thumb" style="--tone:${tone(p)}" aria-hidden="true">${art(p)}</span><span class="name">${esc(p.name)}</span><span class="idx-price">${fmt(p.price)}</span></a></li>`).join("");
    const peek = $(".index-peek");
    if (!peek || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    // desktop: the preview sits beside the cursor (never over the name) and glides after it
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0, shown = "", minX = 0;   // minX: just past the hovered name, so the preview never covers it
    const place = () => {
      const w = peek.offsetWidth || 260, h = peek.offsetHeight || 325;
      const nx = Math.min(innerWidth - w - 16, Math.max(tx + 32, minX)), ny = Math.min(innerHeight - h - 16, Math.max(16, ty - h / 2));
      x += (nx - x) * 0.22; y += (ny - y) * 0.22;
      peek.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      raf = Math.abs(nx - x) + Math.abs(ny - y) > 0.5 ? requestAnimationFrame(place) : 0;
    };
    const showFor = (a, cx, cy) => {
      // measure where the name text actually ends (the element itself stretches across the row)
      const nm = $(".name", a); if (nm) { const rg = document.createRange(); rg.selectNodeContents(nm); minX = rg.getBoundingClientRect().right + 28; } else minX = 0;
      if (a.dataset.peek !== shown) { shown = a.dataset.peek; peek.innerHTML = art(bySlug(shown)); }
      if (!peek.classList.contains("show")) { tx = cx; ty = cy; const w = peek.offsetWidth || 260, h = peek.offsetHeight || 325; x = Math.min(innerWidth - w - 16, Math.max(cx + 32, minX)); y = Math.min(innerHeight - h - 16, Math.max(16, cy - h / 2)); peek.style.transform = `translate(${x}px, ${y}px)`; }
      peek.classList.add("show");
    };
    list.addEventListener("mousemove", (e) => {
      const a = e.target.closest("[data-peek]"); if (!a) return;
      showFor(a, e.clientX, e.clientY); tx = e.clientX; ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(place);
    });
    list.addEventListener("mouseleave", () => peek.classList.remove("show"));
    window.addEventListener("scroll", () => peek.classList.remove("show"), { passive: true });
    // keyboard: tabbing to a name shows its preview next to the row
    list.addEventListener("focusin", (e) => { const a = e.target.closest("[data-peek]"); if (!a) return; const r = a.getBoundingClientRect(); showFor(a, r.left + Math.min(r.width * 0.55, 520), r.top + r.height / 2); });
    list.addEventListener("focusout", () => peek.classList.remove("show"));
  }


  /* ---------- PRODUCT (W-store scroll journey) ---------- */
  function initProduct() {
    // always open at the top of a product page, so the close-up is the first thing you see (Chrome restores the old position after load)
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const toTop = () => window.scrollTo(0, 0);
    toTop(); window.addEventListener("load", () => setTimeout(toTop, 0), { once: true });
    window.addEventListener("pageshow", (e) => { if (e.persisted) toTop(); });
    const p = bySlug(new URLSearchParams(location.search).get("p")) || D.products[0];
    document.title = p.name + " · unorgnl.";
    const sizes = D.sizes[p.type] || ["One size"];
    let color = p.colors[0].name;
    let size = sizes.length === 1 ? sizes[0] : null;

    // on model: shoot photos when they exist, honest placeholders until then
    const om = (p.media && p.media.model) || [];
    $("#om-grid").innerHTML = om.length
      ? om.map((src, i) => `<figure class="om-shot"><img src="${esc(src)}" alt="${esc(p.name)} worn by a model, photo ${i + 1}" loading="lazy"></figure>`).join("")
      : [1, 2, 3].map((n) => `<figure class="om-shot om-empty" style="--tone:${tone(p)}"><svg viewBox="0 0 60 120" aria-hidden="true"><circle cx="30" cy="14" r="9"/><path d="M14 34c4-6 28-6 32 0l6 40h-9l-3 42h-8l-2-36-2 36h-8l-3-42h-9z"/></svg><figcaption>Shot ${n}</figcaption></figure>`).join("");
    $("#om-note").textContent = om.length ? `Model wears size M.` : `On-model photos arrive with the photoshoot.`;

    // arriving from a product card: the garment has already flown into place, so no entrance animation
    let fromCard = false;
    try { fromCard = sessionStorage.getItem("sx-from-card") === "1"; sessionStorage.removeItem("sx-from-card"); } catch (e) {}
    // fade the garment in without touching the rig transform (the scroll timeline owns the zoom)
    if (!fromCard && hasGsap && !reduceMotion) gsap.from(".pdp2-canvas", { opacity: 0, duration: 0.9, ease: "power2.out", delay: 0.05 });

    $("#pdp-name").textContent = p.name;
    $("#crumb-name").textContent = p.name;
    $("#pdp-desc").textContent = p.tagline;
    $("#pdp-fit").textContent = p.fit;
    $("#pdp-price").innerHTML = `${fmt(p.price)}<small>Incl. of all taxes</small>`;
    $("#pdp-specs").innerHTML = p.specs.map(([a, b]) => `<div><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join("");
    $("#sticky-price").textContent = fmt(p.price);

    const paint = () => {
      const c = p.colors.find((x) => x.name === color);
      $("#layer-front").innerHTML = art(p, c);
      $("#layer-back").innerHTML = art(p, c, { back: true, label: p.name + " back view" });
      cloth($("#layer-front"), { strength: 0.7, res: 2, interactive: true, area: $(".pdp2-canvas") });
      cloth($("#layer-back"), { strength: 0.7, res: 2, interactive: true, area: $(".pdp2-canvas") });
      $("#color-name").textContent = c.name;
    };
    $("#swatches").innerHTML = p.colors.map((c) => `<button class="swatch" type="button" style="background:${c.hex}" aria-label="${esc(c.name)}" aria-pressed="${c.name === color}" data-color="${esc(c.name)}"></button>`).join("");
    $("#swatches").addEventListener("click", (e) => {
      const b = e.target.closest("[data-color]"); if (!b) return;
      color = b.dataset.color; $$("[data-color]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); paint();
      if (hasGsap && !reduceMotion) gsap.fromTo("#rig .layer", { filter: "blur(10px)" }, { filter: "blur(0px)", duration: 0.5 });
    });
    $("#sizes").innerHTML = sizes.map((s) => `<button class="size" type="button" aria-pressed="${s === size}" data-size="${esc(s)}">${esc(s)}</button>`).join("");
    $("#sizes").addEventListener("click", (e) => {
      const b = e.target.closest("[data-size]"); if (!b) return;
      size = b.dataset.size; $$("[data-size]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); $("#size-error").textContent = "";
    });
    $$("[data-add]").forEach((b) => b.addEventListener("click", () => {
      if (!size) { $("#size-error").textContent = "Pick a size first"; $("#sizes").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); return; }
      addToBag(p.slug, color, size, { from: $("#layer-front") }).then(() => toast(p.name + " added to bag"));
    }));

    $("#size-guide").addEventListener("click", (e) => {
      e.preventDefault();
      const rows = p.type === "cargo" ? [["28", "72", "100"], ["30", "77", "101"], ["32", "82", "102"], ["34", "87", "103"], ["36", "92", "104"]]
        : [["S", "56", "70"], ["M", "59", "72"], ["L", "62", "74"], ["XL", "65", "76"], ["XXL", "68", "78"]];
      const head = p.type === "cargo" ? ["Size", "Waist (cm)", "Length (cm)"] : ["Size", "Chest width (cm)", "Length (cm)"];
      info("size guide", `<p class="muted" style="font-size:14px;margin-bottom:12px">${esc(p.fit)}</p>` +
        (["cap", "tote"].includes(p.type) ? "" : `<table><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join("")}</tr>`).join("")}</table>`) +
        `<p class="mono muted" style="margin-top:12px">Sample measurements</p>`);
    });
    $$("[data-info]").forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault();
      if (a.dataset.info === "ship") info("shipping and returns", `<p>Orders ship within 48 hours. Standard delivery takes 3 to 6 working days, free over ${fmt(D.freeShippingOver)}. Return or exchange unworn pieces within 7 days.</p><p class="mono muted" style="margin-top:10px">Sample policy</p>`);
      else info("payment", `<p>Pay by UPI, debit or credit card, or cash on delivery (${fmt(49)} fee). Payments are processed securely by the payment provider.</p><p class="mono muted" style="margin-top:10px">Sample policy</p>`);
    }));

    $("#pairs").innerHTML = D.products.filter((x) => x.slug !== p.slug && x.category === p.category).concat(D.products.filter((x) => x.slug !== p.slug && x.category !== p.category)).slice(0, 4).map(cardHTML).join("");
    initCards($("#pairs"));
    initFly($("#pairs"));
    initIndex(p.slug);
    initProductReviews(p);
    initArrival();
    initPairUp(p);
    // phones: the sticky "Add to bag" bar only shows once the main button has scrolled out of view
    const mainAdd = $(".pdp2-right [data-add]"), sticky = $(".sticky-buy");
    if (mainAdd && sticky && "IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => sticky.classList.toggle("show", !en.isIntersecting && en.boundingClientRect.top < 0), { threshold: 0 }).observe(mainAdd);
    }
    paint();

    // views: 01 collar close-up -> 02 full front -> 03 turn to back -> 04 detail
    const VIEWS = [
      { key: "Close-up", scale: 2.3, x: 0, y: 44, back: false },
      { key: "Front", scale: 1, x: 0, y: 0, back: false },
      { key: "Back", scale: 1, x: 0, y: 0, back: true },
    ];
    const pills = $("#views");
    pills.innerHTML = VIEWS.map((v, i) => `<button class="pill" type="button" data-view="${i}" aria-pressed="false">0${i + 1} ${v.key}</button>`).join("");
    const mark = (i) => $$("[data-view]", pills).forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.view === i)));
    const rig = $("#rig"), front = $("#layer-front"), back = $("#layer-back");
    let current = reduceMotion ? 1 : 0;

    function setInstant(v) {
      rig.style.transform = `translate(${v.x}%, ${v.y}%) scale(${v.scale})`;
      front.style.opacity = v.back ? 0 : 1; back.style.opacity = v.back ? 1 : 0;
    }

    function tweenTo(i) {
      const v = VIEWS[i], was = VIEWS[current]; current = i; mark(i);
      if (!hasGsap || reduceMotion) { setInstant(v); return; }
      if (v.back !== was.back) {
        gsap.timeline()
          .to(rig, { scaleX: 0.04, scaleY: 1, xPercent: 0, yPercent: 0, duration: 0.28, ease: "power2.in" })
          .set(front, { opacity: v.back ? 0 : 1 }).set(back, { opacity: v.back ? 1 : 0 })
          .to(rig, { scaleX: v.scale, scaleY: v.scale, xPercent: v.x, yPercent: v.y, duration: 0.5, ease: "expo.out" });
      } else {
        gsap.to(rig, { scale: v.scale, xPercent: v.x, yPercent: v.y, duration: 0.8, ease: "expo.inOut" });
      }
    }

    const scrollMode = hasGsap && window.ScrollTrigger && !reduceMotion && !isSmall();
    if (scrollMode) {
      gsap.set(rig, { scale: VIEWS[0].scale, xPercent: VIEWS[0].x, yPercent: VIEWS[0].y });
      const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
      // close-up (held) -> zooms out to the front (held) -> flips to the back (held)
      tl.addLabel("v0", 0)
        .to({}, { duration: 0.35 })
        .to(rig, { scale: 1, xPercent: 0, yPercent: 0, duration: 1 }).addLabel("v1")
        .to({}, { duration: 0.45 })
        .to(rig, { scaleX: 0.04, duration: 0.45, ease: "power2.in" })
        .set(front, { opacity: 0 }).set(back, { opacity: 1 })
        .to(rig, { scaleX: 1, duration: 0.55, ease: "power2.out" }).addLabel("v2")
        .to({}, { duration: 0.45 });
      const st = ScrollTrigger.create({
        trigger: "#pdp2", start: "top top", end: "bottom bottom", scrub: 0.8, animation: tl,
        onUpdate: (self) => {
          const t = self.progress * tl.duration();
          const idx = [0, 1, 2].reduce((best, i) => (Math.abs(tl.labels["v" + i] - t) < Math.abs(tl.labels["v" + best] - t) ? i : best), 0);
          mark(idx);
        },
      });
      pills.addEventListener("click", (e) => {
        const b = e.target.closest("[data-view]"); if (!b) return;
        const y = st.start + (st.end - st.start) * (tl.labels["v" + b.dataset.view] / tl.duration());
        window.scrollTo({ top: y + 2, behavior: "smooth" });
      });
      mark(0);
    } else {
      setInstant(VIEWS[current]); mark(current);
      pills.addEventListener("click", (e) => { const b = e.target.closest("[data-view]"); if (b) tweenTo(+b.dataset.view); });
    }
  }

  /* ---------- main CTA: rolling letters, self-drawing outline, splash on press ----------
     Markup and SVG paths from the pasted "Join Today" button; the styling is ours (site.css, .cta-fx).
     Any element with data-cta="second label" is upgraded, including ones rendered later (bag drawer). */
  const SPLASH = ["M54.1054 99.7837C54.1054 99.7837 40.0984 90.7874 26.6893 97.6362C13.2802 104.485 1.5 97.6362 1.5 97.6362",
    "M285.273 99.7841C285.273 99.7841 299.28 90.7879 312.689 97.6367C326.098 104.486 340.105 95.4893 340.105 95.4893",
    "M281.133 64.9917C281.133 64.9917 287.96 49.8089 302.934 48.2295C317.908 46.6501 319.712 36.5272 319.712 36.5272",
    "M281.133 138.984C281.133 138.984 287.96 154.167 302.934 155.746C317.908 157.326 319.712 167.449 319.712 167.449",
    "M230.578 57.4476C230.578 57.4476 225.785 41.5051 236.061 30.4998C246.337 19.4945 244.686 12.9998 244.686 12.9998",
    "M230.578 150.528C230.578 150.528 225.785 166.471 236.061 177.476C246.337 188.481 244.686 194.976 244.686 194.976",
    "M170.392 57.0278C170.392 57.0278 173.89 42.1322 169.571 29.54C165.252 16.9478 168.751 2.05227 168.751 2.05227",
    "M170.392 150.948C170.392 150.948 173.89 165.844 169.571 178.436C165.252 191.028 168.751 205.924 168.751 205.924",
    "M112.609 57.4476C112.609 57.4476 117.401 41.5051 107.125 30.4998C96.8492 19.4945 98.5 12.9998 98.5 12.9998",
    "M112.609 150.528C112.609 150.528 117.401 166.471 107.125 177.476C96.8492 188.481 98.5 194.976 98.5 194.976",
    "M62.2941 64.9917C62.2941 64.9917 55.4671 49.8089 40.4932 48.2295C25.5194 46.6501 23.7159 36.5272 23.7159 36.5272",
    "M62.2941 145.984C62.2941 145.984 55.4671 161.167 40.4932 162.746C25.5194 164.326 23.7159 174.449 23.7159 174.449"];
  const ctaChars = (t) => [...t].map((c, i) => `<span style="--i:${i + 1}">${c === " " ? "&nbsp;" : esc(c)}</span>`).join("");
  function upgradeCTA(el) {
    if (el.classList.contains("cta-fx")) return;
    const one = el.textContent.replace(/[→↓↗]/g, "").trim(), two = el.dataset.cta || one;
    el.setAttribute("aria-label", one);
    el.classList.add("cta-fx");
    el.innerHTML = `<span class="bg" aria-hidden="true"></span>
      <svg class="splash" viewBox="0 0 342 208" preserveAspectRatio="none" fill="none" aria-hidden="true">${SPLASH.map((d, i) => `<path pathLength="1" stroke-linecap="round" d="${d}"${i % 4 > 1 ? ' stroke-opacity="0.3"' : ""}/>`).join("")}</svg>
      <span class="wrap" aria-hidden="true">
        <svg class="path" viewBox="0 0 221 42" preserveAspectRatio="none" fill="none"><path pathLength="1" stroke-linecap="round" d="M182.674 2H203C211.837 2 219 9.16344 219 18V24C219 32.8366 211.837 40 203 40H18C9.16345 40 2 32.8366 2 24V18C2 9.16344 9.16344 2 18 2H47.8855"/></svg>
        <span class="outline"></span>
        <span class="content"><span class="char state-1">${ctaChars(one)}</span><span class="icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span><span class="char state-2">${ctaChars(two)}</span></span>
      </span>`;
    el.addEventListener("pointerdown", () => { el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); });
    el.addEventListener("animationend", (e) => { if (e.target.closest(".splash")) el.classList.remove("pop"); });
    // leaving the page: let the splash play before the next page loads
    if (el.tagName === "A") el.addEventListener("click", (e) => {
      const href = el.getAttribute("href") || "";
      if (reduceMotion || href.startsWith("#") || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault(); el.classList.add("pop"); setTimeout(() => { location.href = href; }, 320);
    });
  }
  const upgradeAll = () => $$("[data-cta]:not(.cta-fx)").forEach(upgradeCTA);
  new MutationObserver(upgradeAll).observe(document.body, { childList: true, subtree: true });

  /* ---------- WavyBlock (vanilla port of the motion/react component) ----------
     Each line slides sideways on a cosine of scroll progress, offset by its index,
     and follows that target on a spring (stiffness 300, damping 22). Same config as the original. */
  function wavyBlock(container, items, cfg = {}) {
    const c = Object.assign({ baseOffsetFactor: 0.1, baseExtra: 0, baseAmplitude: 160, lengthEffect: 0.6, frequency: 35, progressScale: 6, phaseShiftDeg: -180, stiffness: 300, damping: 22, mass: 1 }, cfg);
    const rad = (d) => (d * Math.PI) / 180;
    const lengthFactor = 1; // the original computes maxLen / maxLen, which is always 1
    const st = items.map(() => ({ x: 0, v: 0, target: 0 }));
    // useScroll offset ['start end', 'end start']: 0 when the block's top meets the viewport bottom, 1 when its bottom leaves the top
    const progress = () => { const r = container.getBoundingClientRect(), vh = window.innerHeight; return Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height))); };
    const calc = (i, p) => c.baseOffsetFactor * window.innerWidth + c.baseExtra
      + c.baseAmplitude * (1 - c.lengthEffect * lengthFactor) * Math.cos(rad(c.frequency * i) + c.progressScale * p + rad(c.phaseShiftDeg));
    const apply = () => items.forEach((el, i) => { el.style.transform = `translate3d(${st[i].x.toFixed(2)}px,0,0)`; });
    let raf = 0, last = 0;
    const loop = (now) => {
      const dt = Math.min(1 / 30, (now - (last || now)) / 1000 || 1 / 60); last = now;
      let moving = false;
      st.forEach((s) => {
        for (let k = 0; k < 4; k++) { const h = dt / 4; s.v += ((-c.stiffness * (s.x - s.target) - c.damping * s.v) / c.mass) * h; s.x += s.v * h; }
        if (Math.abs(s.x - s.target) > 0.05 || Math.abs(s.v) > 0.05) moving = true; else { s.x = s.target; s.v = 0; }
      });
      apply();
      raf = moving ? requestAnimationFrame(loop) : 0; if (!raf) last = 0;
    };
    const update = () => {
      const p = progress();
      st.forEach((s, i) => { s.target = calc(i, p); if (reduceMotion) s.x = s.target; });
      if (reduceMotion) apply(); else if (!raf) raf = requestAnimationFrame(loop);
    };
    st.forEach((s, i) => { s.x = s.target = calc(i, progress()); });
    apply();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* ---------- boot ---------- */
  renderChrome();
  updateCount();
  renderBag();
  if (page === "home") initHome();
  if (page === "product") initProduct();
  if (page === "track") initTrack();
  initReveal();
  upgradeAll();
})();
