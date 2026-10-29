/* product-video-skills · motion helpers shared by every scene.
 *
 * Rules (HyperFrames doctrine, hyperframes-animation):
 * - Everything is a function of the paused timeline's time: no Math.random, Date.now,
 *   infinite repeats or CSS transitions. "Randomness" uses a seeded PRNG.
 * - Entrances use fromTo (explicit start state, so seeking to t=0 is exact).
 * - Long-tail curves (power3/power4/expo); no bounces.
 * - Times are expressed in beats of the music: PV.b(n). The grid (BPM and first downbeat)
 *   comes from assets/music.js (window.PV_MUSIC, written by render.mjs from music.json).
 *
 * Canonical copy: product-video-skills/lib/pv.js. Reference: skills/pv-motion/references/pv-lib.md.
 */
(function () {
  const PV = (window.PV = window.PV || {});

  // ── Language and copy ────────────────────────────────────────────────────
  // assets/i18n.js: window.PV_I18N = { url, fallback, locales: { en: 'en-US', ... }, en: {...}, es: {...} }
  // assets/lang.js (written by render.mjs): window.PV_LANG = 'en'.
  PV.I18N = window.PV_I18N || {};
  const LOCALES = PV.I18N.locales || { en: 'en-US' };
  const FALLBACK = PV.I18N.fallback || Object.keys(LOCALES)[0] || 'en';
  PV.LANG = window.PV_LANG && PV.I18N[window.PV_LANG] ? window.PV_LANG : FALLBACK;
  PV.LOCALE = LOCALES[PV.LANG] || PV.LANG;
  PV.URL = PV.I18N.url || 'example.com';
  PV.t = (key) => {
    const v = (PV.I18N[PV.LANG] || {})[key];
    if (v !== undefined) return v;
    const f = (PV.I18N[FALLBACK] || {})[key];
    return f !== undefined ? f : key;
  };
  PV.fmt = (n, decimals = 0) => Number(n).toLocaleString(PV.LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  // ── Music: beat grid ─────────────────────────────────────────────────────
  // From assets/music.js (window.PV_MUSIC = { bpm, first_downbeat }), written by render.mjs
  // from music.json. Without it: 120 BPM, downbeat at 0.
  const MUSIC = window.PV_MUSIC || {};
  PV.BPM = Number(MUSIC.bpm) || 120;
  PV.B = 60 / PV.BPM;
  PV.b = (n) => n * PV.B;
  PV.BAR = 4 * PV.B;
  PV.DOWNBEAT0 = Number.isFinite(Number(MUSIC.first_downbeat)) ? Number(MUSIC.first_downbeat) : 0;

  // ── Seeded PRNG (mulberry32) ─────────────────────────────────────────────
  PV.rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // ── Real screens (manifest written by video/capture/capture.mjs) ─────────
  PV.shot = (id) => {
    const s = (window.SCREENS || {})[id];
    if (!s) throw new Error(`[pv] missing capture "${id}" in screens.js`);
    return s;
  };
  /** Rectangle of a target in image coordinates (CSS px, unscaled). Accepts a literal rect. */
  PV.rect = (id, key) => {
    const s = PV.shot(id);
    const r = typeof key === 'string' ? s.targets[key] : key;
    if (!r) throw new Error(`[pv] missing target "${key}" in "${id}"`);
    const sy = s.fullPage ? 0 : s.scrollY || 0;
    return { x: r.x, y: r.y - sy, w: r.w, h: r.h };
  };
  /**
   * Crops a fragment of a capture: `el` contains an <img> of that capture.
   * opts: scale (screen px per CSS px), pad (CSS margin around the target),
   * padX/padY, w/h (force the CSS size of the crop).
   */
  PV.crop = (el, id, key, opts = {}) => {
    const s = PV.shot(id);
    const r = PV.rect(id, key);
    const scale = opts.scale ?? 1;
    const px = opts.padX ?? opts.pad ?? 0;
    const py = opts.padY ?? opts.pad ?? 0;
    const w = (opts.w ?? r.w + 2 * px);
    const h = (opts.h ?? r.h + 2 * py);
    el.style.width = `${w * scale}px`;
    el.style.height = `${h * scale}px`;
    const img = el.querySelector('img');
    img.style.width = `${s.viewport.w * scale}px`;
    img.style.height = s.fullPage ? `${s.docHeight * scale}px` : `${s.viewport.h * scale}px`;
    img.style.left = `${-(r.x - px) * scale}px`;
    img.style.top = `${-(r.y - py) * scale}px`;
    return { w: w * scale, h: h * scale, scale };
  };
  /** Whole screen as a plane, `width` screen px wide. */
  PV.plane = (el, id, width, opts = {}) => {
    const s = PV.shot(id);
    const scale = width / s.viewport.w;
    const viewH = opts.h ?? s.viewport.h;
    el.style.width = `${width}px`;
    el.style.height = `${viewH * scale}px`;
    const img = el.querySelector('img');
    img.style.width = `${width}px`;
    img.style.height = `${(s.fullPage ? s.docHeight : s.viewport.h) * scale}px`;
    return { w: width, h: viewH * scale, scale };
  };

  // ── Measuring text without layout ────────────────────────────────────────
  // Scenes build their timeline while their clip is still hidden (display:none in the
  // render), so offsetWidth/getBoundingClientRect return 0. Measure with canvas from the
  // computed style, which is available even when the element isn't painted.
  const measureCtx = document.createElement('canvas').getContext('2d');
  PV.textWidth = (el, text) => {
    const cs = getComputedStyle(el);
    measureCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const ls = parseFloat(cs.letterSpacing) || 0;
    const t = String(text);
    return measureCtx.measureText(t).width + ls * t.length;
  };

  // ── Text ─────────────────────────────────────────────────────────────────
  /** Writes `text` into `el` as masked words; returns the .wi spans. */
  PV.words = (el, text) => {
    el.textContent = '';
    const out = [];
    String(text).split(/\s+/).filter(Boolean).forEach((word, i, arr) => {
      const w = document.createElement('span'); w.className = 'w';
      const wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = word;
      w.appendChild(wi); el.appendChild(w); out.push(wi);
      if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return out;
  };
  /** Writes `text` as single characters; returns the .ch spans. */
  PV.chars = (el, text) => {
    el.textContent = '';
    return Array.from(String(text)).map((c) => {
      const s = document.createElement('span'); s.className = 'ch';
      s.textContent = c === ' ' ? '\u00a0' : c; el.appendChild(s); return s;
    });
  };

  // ── Entrances (always fromTo, long tail) ─────────────────────────────────
  const blur = (px) => `blur(${px}px)`;
  /** Arrives sideways with a speed streak: x + stretch + blur that resolves as it brakes. */
  PV.streakIn = (tl, els, t, o = {}) => {
    const d = (o.from === 'left' ? -1 : 1) * (o.dist ?? 180);
    tl.fromTo(els, { x: d, scaleX: 1.25, opacity: 0, filter: blur(o.blur ?? 14) },
      { x: 0, scaleX: 1, opacity: 1, filter: blur(0), duration: o.dur ?? 0.5, ease: o.ease ?? 'expo.out', stagger: o.stagger ?? 0.06, transformOrigin: o.from === 'left' ? '100% 50%' : '0% 50%' }, t);
  };
  /** Scale hit from the camera: big and blurred → sharp. */
  PV.slam = (tl, els, t, o = {}) => {
    tl.fromTo(els, { scale: o.scale ?? 1.7, opacity: 0, filter: blur(o.blur ?? 16) },
      { scale: 1, opacity: 1, filter: blur(0), duration: o.dur ?? 0.45, ease: o.ease ?? 'power4.out', stagger: o.stagger ?? 0.05 }, t);
  };
  /** Rises from the mask (.w > .wi). */
  PV.rise = (tl, wis, t, o = {}) => {
    tl.fromTo(wis, { yPercent: o.from ?? 112 }, { yPercent: 0, duration: o.dur ?? 0.6, ease: o.ease ?? 'power4.out', stagger: o.stagger ?? 0.07 }, t);
  };
  /** Flips up from its base (card flip). */
  PV.flipIn = (tl, els, t, o = {}) => {
    tl.fromTo(els, { rotationX: -95, opacity: 0, transformOrigin: '50% 100%', transformPerspective: 800 },
      { rotationX: 0, opacity: 1, duration: o.dur ?? 0.55, ease: o.ease ?? 'power3.out', stagger: o.stagger ?? 0.05 }, t);
  };
  /** Appears by opacity and blur, without moving (for ornaments). */
  PV.fadeIn = (tl, els, t, o = {}) => {
    tl.fromTo(els, { opacity: 0, filter: blur(o.blur ?? 0) }, { opacity: o.to ?? 1, filter: blur(0), duration: o.dur ?? 0.4, ease: o.ease ?? 'power2.out', stagger: o.stagger ?? 0 }, t);
  };
  /** Draws hairlines (scaleX/scaleY 0 → 1). */
  PV.drawLines = (tl, els, t, o = {}) => {
    const list = Array.from(els.length !== undefined ? els : [els]);
    list.forEach((el, i) => {
      const prop = el.classList.contains('v') ? 'scaleY' : 'scaleX';
      tl.fromTo(el, { [prop]: 0, opacity: 1 }, { [prop]: 1, duration: o.dur ?? 0.7, ease: o.ease ?? 'power3.inOut' }, t + i * (o.stagger ?? 0.08));
    });
  };

  /** Text that decodes from (seeded) random glyphs into the real text. */
  PV.decode = (tl, el, text, t, o = {}) => {
    const GLYPHS = o.glyphs ?? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#+*';
    const rand = PV.rng(o.seed ?? 7);
    const noise = Array.from({ length: 24 }, () => Array.from(text, () => GLYPHS[Math.floor(rand() * GLYPHS.length)]));
    const st = { p: 0 };
    const write = () => {
      const n = text.length;
      const shown = Math.floor(st.p * (n + 4));
      const frame = Math.floor(st.p * 23);
      let s = '';
      for (let i = 0; i < n; i++) {
        const c = text[i];
        if (c === ' ' || c === '·') { s += c; continue; }
        s += i < shown - 4 ? c : i < shown ? noise[frame][i] : '\u2007'; // figure space keeps the width
      }
      el.textContent = st.p >= 1 ? text : s;
    };
    tl.fromTo(st, { p: 0 }, { p: 1, duration: o.dur ?? 0.9, ease: 'none', onUpdate: write, immediateRender: true, onStart: write }, t);
    write();
  };

  /** Number counter with regional formatting. */
  PV.count = (tl, el, to, t, o = {}) => {
    const st = { v: o.from ?? 0 };
    const dec = o.decimals ?? 0;
    const write = () => { el.textContent = `${o.prefix ?? ''}${PV.fmt(st.v, dec)}${o.suffix ?? ''}`; };
    tl.fromTo(st, { v: o.from ?? 0 }, { v: to, duration: o.dur ?? 1.1, ease: o.ease ?? 'expo.out', onUpdate: write, immediateRender: true }, t);
    write();
  };

  // ── Velocity-matched cuts ────────────────────────────────────────────────
  /** Exit toward the camera (outgoing half of the zoom-through). Ends at t + dur. */
  PV.zoomOut = (tl, el, t, o = {}) => {
    const dur = o.dur ?? 0.24;
    tl.to(el, { scale: o.scale ?? 1.32, filter: blur(o.blur ?? 18), duration: dur, ease: 'power3.in' }, t);
    tl.to(el, { opacity: 0, duration: dur, ease: 'none' }, t);
  };
  /** Entrance from behind the camera (incoming half of the zoom-through). */
  PV.zoomIn = (tl, el, t, o = {}) => {
    tl.fromTo(el, { scale: o.from ?? 0.72, opacity: 0.15, filter: blur(o.blur ?? 18) },
      { scale: 1, opacity: 1, filter: blur(0), duration: o.dur ?? 0.55, ease: 'expo.out' }, t);
  };
  /** Oversized arrival that settles back (inverse zoom-through, for a payoff). */
  PV.arrive = (tl, el, t, o = {}) => {
    tl.fromTo(el, { scale: o.from ?? 1.3, opacity: 0.15, filter: blur(o.blur ?? 16) },
      { scale: 1, opacity: 1, filter: blur(0), duration: o.dur ?? 0.55, ease: 'expo.out' }, t);
  };
  /** Outgoing half of a lateral whip. dir = -1 left, 1 right. */
  PV.whipOut = (tl, el, t, o = {}) => {
    const dur = o.dur ?? 0.22;
    tl.to(el, { x: (o.dir ?? -1) * (o.dist ?? 420), filter: blur(o.blur ?? 22), duration: dur, ease: 'power4.in' }, t);
    tl.to(el, { opacity: 0, duration: dur, ease: 'power2.in' }, t);
  };
  /** Incoming half of a lateral whip (same direction as the exit). */
  PV.whipIn = (tl, el, t, o = {}) => {
    tl.fromTo(el, { x: -(o.dir ?? -1) * (o.dist ?? 420), opacity: 0.2, filter: blur(o.blur ?? 22) },
      { x: 0, opacity: 1, filter: blur(0), duration: o.dur ?? 0.5, ease: 'power4.out' }, t);
  };

  // ── Rhythm: the music's pulse on an element (visual sidechain) ───────────
  PV.pulse = (tl, els, fromBeat, toBeat, o = {}) => {
    const every = o.every ?? 1;
    for (let k = fromBeat; k < toBeat; k += every) {
      tl.fromTo(els, { opacity: o.peak ?? 1 }, { opacity: o.rest ?? 0.72, duration: PV.B * every * 0.9, ease: 'power2.out' }, PV.b(k));
    }
  };

  // ── Cursor: travel, click with ripple ────────────────────────────────────
  PV.click = (tl, cursor, t, P, o = {}) => {
    const svg = cursor.querySelector('svg');
    const ripple = cursor.querySelector('.ripple');
    const travel = o.travel ?? 0.7;
    if (o.from) tl.set(cursor, { x: o.from[0], y: o.from[1] }, t - travel - 0.02);
    tl.to(cursor, { opacity: 1, duration: 0.2, ease: 'none' }, t - travel - 0.02);
    tl.to(cursor, { x: P[0], y: P[1], duration: travel, ease: 'power3.inOut' }, t - travel);
    tl.to(svg, { scale: 0.8, duration: 0.07, ease: 'power2.out' }, t);
    tl.to(svg, { scale: 1, duration: 0.18, ease: 'power2.out' }, t + 0.07);
    tl.fromTo(ripple, { scale: 0.2, opacity: 0.9 }, { scale: 1.1, opacity: 0, duration: 0.55, ease: 'power3.out' }, t + 0.02);
  };
  PV.cursorHTML = '<div class="ripple"></div><svg viewBox="0 0 34 34" aria-hidden="true"><path d="M6 4 L6 27 L12.2 21.4 L16.4 30.6 L20.6 28.7 L16.5 19.8 L25 19.6 Z" fill="#ffffff" stroke="#0a0a0a" stroke-width="2" stroke-linejoin="round"/></svg>';

  // ── Word cycle inside a pill (token cycle) ───────────────────────────────
  /**
   * Builds in `host` a pill with the words `items` stacked and swaps them at `times`.
   * The pill changes width (and color, if `colors` is given).
   */
  PV.cycle = (tl, host, items, times, o = {}) => {
    host.classList.add('pill');
    if (o.cls) o.cls.split(' ').forEach((c) => host.classList.add(c));
    host.style.position = 'relative'; host.style.overflow = 'hidden';
    host.style.justifyContent = 'flex-start'; host.style.padding = '0';
    host.style.height = o.height ?? '1.16em';
    host.textContent = '';
    const toks = items.map((txt) => {
      const s = document.createElement('span');
      s.textContent = o.upper === false ? txt : String(txt).toUpperCase();
      s.style.cssText = 'position:absolute;left:0.42em;top:0.1em;line-height:1;white-space:nowrap';
      s.setAttribute('data-layout-allow-overlap', ''); // stacked on purpose: only one is inside the mask
      host.appendChild(s); return s;
    });
    const em = parseFloat(getComputedStyle(host).fontSize);
    const widths = toks.map((s) => PV.textWidth(s, s.textContent) + 0.84 * em);
    // Outside the mask the words also stay at opacity 0 (invisible and out of the layout checks).
    gsap.set(toks, { yPercent: 120, opacity: 0 });
    gsap.set(host, { width: widths[0], ...(o.colors ? { backgroundColor: o.colors[0] } : {}) });
    tl.fromTo(host, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.42, ease: 'expo.out' }, times[0]);
    tl.fromTo(toks[0], { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'expo.out' }, times[0] + 0.08);
    for (let i = 1; i < items.length; i++) {
      const t = times[i];
      tl.to(toks[i - 1], { yPercent: -120, opacity: 0, duration: 0.18, ease: 'power3.in' }, t - 0.12);
      tl.to(host, { width: widths[i], ...(o.colors ? { backgroundColor: o.colors[i] } : {}), duration: 0.34, ease: 'power3.inOut' }, t - 0.12);
      tl.fromTo(toks[i], { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.42, ease: 'expo.out' }, t + 0.04);
    }
    return { toks, widths };
  };

  /** Resolved value of a --pv-<name> token (for color tweens). */
  PV.color = (name) => getComputedStyle(document.documentElement).getPropertyValue(`--pv-${name}`).trim();

  // ── 2D camera over a "world" with transform-origin 0 0 ───────────────────
  /** Camera state that centers point P (world coordinates) at scale S. */
  PV.camAt = (S, P) => ({ scale: S, x: 960 - S * P[0], y: 540 - S * P[1] });

  // ── Navigation through the sidebar ───────────────────────────────────────
  /**
   * Entering a section: the product's real sidebar arrives enlarged on the left with the
   * previous section active, the cursor clicks the new one (the active item changes, as in
   * the product) and the camera dives in through that item. Needs, at the end of the scene:
   * .pv-nav-dim, .pv-nav > .pv-rail (img of the previous section + img of the current one),
   * .pv-rail-ring and .pv-rail-cursor. Uses the targets `navItem` and `navEnd` of the shot,
   * and `sidebar` (or `nav`) for the width of the crop.
   * Returns the moment the section's content should come in.
   */
  PV.navIntro = (R, tl, shotId, o = {}) => {
    const nav = R.querySelector('.pv-nav'), dim = R.querySelector('.pv-nav-dim');
    const rail = nav.querySelector('.pv-rail'), ring = nav.querySelector('.pv-rail-ring'), cur = nav.querySelector('.pv-rail-cursor');
    const tg = PV.shot(shotId).targets;
    const S = o.scale ?? 1.7;
    const side = tg.sidebar || tg.nav;
    const cropW = o.width ?? (side ? side.x + side.w : 256);
    const crop = { x: 0, y: 0, w: cropW, h: tg.navEnd.y + tg.navEnd.h + 20 };
    const g = PV.crop(rail, shotId, crop, { scale: S });
    // Every sidebar capture has the same 1920×1080 viewport: the same crop works for both images.
    const imgs = rail.querySelectorAll('img');
    const now = imgs[imgs.length - 1];
    now.style.cssText = imgs[0].style.cssText;
    const X0 = o.x ?? 110, Y0 = Math.round(540 - g.h / 2);
    gsap.set(rail, { x: X0, y: Y0 });
    const it = tg.navItem;
    const rx = X0 + (it.x - 4) * S, ry = Y0 + (it.y - 4) * S, rw = (it.w + 8) * S, rh = (it.h + 8) * S;
    gsap.set(ring, { x: rx, y: ry, width: rw, height: rh, opacity: 0 });
    gsap.set(nav, { transformOrigin: `${rx + rw / 2}px ${ry + rh / 2}px` });
    cur.innerHTML = PV.cursorHTML;
    gsap.set(cur, { x: X0 + g.w + 240, y: Y0 + g.h * 0.8, opacity: 0 });
    gsap.set(now, { opacity: imgs.length > 1 ? 0 : 1 });
    const t0 = o.at ?? 0;
    tl.fromTo(dim, { opacity: 0 }, { opacity: 0.55, duration: 0.3, ease: 'power2.out' }, t0);
    tl.fromTo(rail, { x: X0 - 520, opacity: 0, filter: 'blur(14px)' }, { x: X0, opacity: 1, filter: 'blur(0px)', duration: 0.42, ease: 'expo.out' }, t0);
    const tc = t0 + PV.b(0.75);
    PV.click(tl, cur, tc, [rx + rw * 0.42, ry + rh * 0.56], { travel: 0.36 });
    if (imgs.length > 1) tl.set(now, { opacity: 1 }, tc + 0.03);
    tl.fromTo(ring, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.22, ease: 'power3.out' }, tc + 0.03);
    // Exit: the camera dives in through the chosen item (zoom-through centered on the ring).
    const tout = t0 + PV.b(1.25);
    tl.to(nav, { scale: 2.6, opacity: 0, filter: 'blur(12px)', duration: 0.3, ease: 'power3.in' }, tout);
    tl.to(dim, { opacity: 0, duration: 0.3, ease: 'power2.in' }, tout);
    return t0 + PV.b(1.4);
  };

  /** Registers a scene's timeline once the fonts it measures with are loaded. */
  PV.scene = (id, build) => {
    const root = document.querySelector(`[data-composition-id="${id}"]`);
    const make = () => {
      const tl = gsap.timeline({ paused: true });
      build(root, tl);
      window.__timelines[id] = tl;
      if (window.__hfForceTimelineRebind) window.__hfForceTimelineRebind();
    };
    // Measurements (pill widths, camera centers) depend on the real fonts.
    const css = getComputedStyle(document.documentElement);
    const first = (v, d) => (v.split(',')[0] || d).trim().replace(/^['"]|['"]$/g, '') || d;
    const display = first(css.getPropertyValue('--pv-font-display'), 'Space Grotesk');
    const mono = first(css.getPropertyValue('--pv-font-mono'), 'JetBrains Mono');
    const faces = [`700 100px "${display}"`, `600 100px "${display}"`, `500 100px "${display}"`, `500 20px "${mono}"`];
    if (document.fonts && document.fonts.load) Promise.all(faces.map((f) => document.fonts.load(f))).then(make, make);
    else make();
  };
})();
