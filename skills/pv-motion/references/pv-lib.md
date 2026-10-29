# `pv.js` · function reference

Motion helpers shared by every scene (`lib/pv.js`, copied into `video/launch/assets/lib/` by `tools/new-video.mjs`). They all take the scene's timeline `tl` and an absolute time `t` in seconds (almost always `PV.b(n)`), and write seek-safe `fromTo` tweens. The options `o` have defaults tuned for 1920×1080 at ~95–120 BPM: adjust them, don't rewrite them.

## Context

| Function / constant | What it does |
|---|---|
| `PV.I18N` | `window.PV_I18N` from `assets/i18n.js`: `{ url, locales, fallback, en: {...}, es: {...} }`. |
| `PV.LANG` | The active language: `window.PV_LANG` (`assets/lang.js`, written by `render.mjs`) if `PV_I18N` has that language, otherwise the fallback. |
| `PV.LOCALE` | `PV_I18N.locales[PV.LANG]` (e.g. `en-US`), or the language code itself. |
| `PV.URL` | `PV_I18N.url` (the product URL, without `https://`); `example.com` if missing. |
| `PV.t(key)` | Copy for the active language; falls back to `PV_I18N.fallback` (or the first language in `locales`), then to the key itself. Returns strings or arrays. |
| `PV.fmt(n, decimals)` | Number in the active locale (`en-US` → `1,284`; `es-AR` → `1.284`). |
| `PV.BPM`, `PV.B`, `PV.b(n)`, `PV.BAR`, `PV.DOWNBEAT0` | The grid: BPM, length of a beat, `n` beats in seconds, one bar, first downbeat. From `window.PV_MUSIC` (`assets/music.js`, written by `render.mjs` from `music.json`); without it, 120 BPM and downbeat 0. |
| `PV.rng(seed)` | mulberry32 PRNG: reproducible randomness for decodes and scatters. |
| `PV.color(name)` | Resolved value of `--pv-<name>` (`PV.color('action')`), for tweens of `backgroundColor` and for `PV.cycle`'s `colors`. |

## Captures (manifest)

| Function | What it does |
|---|---|
| `PV.shot(id)` | The manifest record for capture `id`. Throws `[pv] missing capture "id" in screens.js` if absent (shows up in `hyperframes check`). |
| `PV.rect(id, keyOrRect)` | Rectangle `{x, y, w, h}` of a target in CSS px of the image, corrected by `scrollY` when the capture isn't fullPage. Accepts a literal rect. Throws `[pv] missing target "key" in "id"`. |
| `PV.crop(el, id, keyOrRect, { scale, pad, padX, padY, w, h })` | Turns `el` (a `.frag` holding an `<img>` of the capture) into a crop of the target: sets the container size and the image's negative offset. Returns `{ w, h, scale }` in screen px. `scale` is screen px per CSS px (1 = real size; 2 = double). Instead of a manifest key it accepts a literal rect `{ x, y, w, h }` in CSS px of the capture, to crop an area that isn't a target or to combine targets: `{ x: row.x, y: row.y, w: st.x + st.w + 28 - row.x, h: row.h }` crops a row up to its status column. |
| `PV.plane(el, id, width, { h })` | Turns `el` (a `.plane` with an `<img>`) into the whole capture, `width` px wide. Returns `{ w, h, scale }`. With `fullPage`, the image is taller than the plane: to scroll, an inner `clip` and `tl.to(img, { y: -anchorY * scale })`. |

Always position with `gsap.set(el, { x, y })` from the returned `w`/`h`: `x: 960 - g.w / 2` centers.

## Measuring without layout

| Function | What it does |
|---|---|
| `PV.textWidth(el, text)` | Width of `text` in `el`'s computed font, measured on a canvas (plus letter-spacing). Works while the element is hidden. For pill widths, centering titles that shrink, and fitting a line (`fit = Math.min(1, 1700 / width)`). |

## Text

| Function | What it does |
|---|---|
| `PV.words(el, text)` | Writes `text` into `el` as `<span class="w"><span class="wi">word</span></span>` with a mask; returns the `.wi` spans for `PV.rise`. |
| `PV.chars(el, text)` | Writes `text` as one `<span class="ch">` per character (spaces become non-breaking); returns the `.ch` spans for `streakIn`/`slam`/tweens with `stagger`. |
| `PV.decode(tl, el, text, t, { dur, seed, glyphs })` | Decodes `text` from seeded random glyphs in `dur` s (0.9). Pending characters are figure spaces, so the width holds. For the URL and eyebrows. |
| `PV.count(tl, el, to, t, { from, dur, decimals, prefix, suffix, ease })` | Counts from `from` to `to` in the active locale, `expo.out` 1.1 s. Pair it with `PV.slam`. |

## Entrances (always `fromTo`, long tail)

| Function | Motion | Defaults |
|---|---|---|
| `PV.streakIn(tl, els, t, { from, dist, blur, dur, ease, stagger })` | Arrives sideways with a streak: `x` + `scaleX 1.25` + blur that resolves. `from: 'left'` arrives from the left. | 180 px, blur 14, 0.5 s `expo.out`, stagger 0.06 (0.022–0.03 per character) |
| `PV.slam(tl, els, t, { scale, blur, dur, ease, stagger })` | Hit from the camera: big and blurred → sharp. | 1.7×, blur 16, 0.45 s `power4.out` |
| `PV.rise(tl, wis, t, { from, dur, ease, stagger })` | Rises from the mask (`yPercent 112 → 0`). | 0.6 s `power4.out`, stagger 0.07 |
| `PV.flipIn(tl, els, t, { dur, ease, stagger })` | Flips up from its base (`rotationX -95 → 0`). | 0.55 s `power3.out` |
| `PV.fadeIn(tl, els, t, { blur, to, dur, ease, stagger })` | Opacity (+ optional blur), no displacement. For ornaments. | 0.4 s `power2.out` |
| `PV.drawLines(tl, els, t, { dur, ease, stagger })` | Draws hairlines: `scaleX`/`scaleY` 0 → 1 depending on the `.h`/`.v` class. | 0.7 s `power3.inOut`, stagger 0.08 |

## Cuts

| Function | Motion |
|---|---|
| `PV.zoomOut(tl, el, t, { scale, blur, dur })` | Exit toward the camera: `scale 1 → 1.32`, blur 18, opacity to 0 in `dur` (0.24). Ends at `t + dur`: call it with `b(N) - 0.24`. |
| `PV.zoomIn(tl, el, t, { from, blur, dur })` | Entrance from behind the camera: `scale 0.72 → 1`, opacity 0.15 → 1, 0.55 s `expo.out`. |
| `PV.arrive(tl, el, t, { from, blur, dur })` | Oversized arrival (1.3 → 1) that settles. For payoffs. |
| `PV.whipOut(tl, el, t, { dir, dist, blur, dur })` | Leaves sideways (`dir: -1` left) 420 px with blur 22 in 0.22 s `power4.in`. |
| `PV.whipIn(tl, el, t, { dir, dist, blur, dur })` | Enters sideways in the same direction (same `dir` as the exit). 0.5 s `power4.out`. |

## Rhythm, cursor, pill, camera, navigation

| Function | What it does |
|---|---|
| `PV.pulse(tl, els, fromBeat, toBeat, { every, peak, rest })` | Heartbeat: opacity `peak → rest` on every beat between `fromBeat` and `toBeat` (visual sidechain on the washes). |
| `PV.click(tl, cursor, t, [x, y], { travel, from })` | Moves the cursor to `[x, y]` in `travel` s (`power3.inOut`, default 0.7), squashes the SVG at `t` and fires the `.ripple` (action color). `from` sets the start position. The cursor needs `innerHTML = PV.cursorHTML`. |
| `PV.cycle(tl, host, items, times, { cls, colors, height, upper })` | Builds in `host` a pill with `items` stacked and swaps them at `times` (absolute). Changes the width (measured with `textWidth`) and, with `colors`, the background. `cls` adds pill classes (`'data'`, `'brand round'`). `upper: false` keeps the case. Returns `{ toks, widths }`. |
| `PV.camAt(S, [px, py])` | Camera state `{ scale, x, y }` that centers world point `P` at scale `S` (world with `transform-origin: 0 0`). Use with `tl.to(world, { ...PV.camAt(1.5, P), duration: 1.2, ease: 'power3.inOut' }, t)`. |
| `PV.navIntro(R, tl, shotId, { scale, x, at, width })` | Entering a section: the real sidebar enlarged `scale` (1.7) arrives from the left at `at` (0) with the **previous section active** (first `<img>`), the cursor clicks `navItem` of `shotId` at 0.75 beats, the active item changes (second `<img>`, the current section), an action ring marks it and the camera dives in through that item (zoom-through centered on the ring, at 1.25 beats). The crop is `width` wide (default: the right edge of the `sidebar` target, else of `nav`, else 256 px) and as tall as `navEnd` + 20. `x` is the rail's left position (110). Returns `at + 1.4 beats`: when the content should come in. Needs, **last** in the scene (to stay on top): `.pv-nav-dim`, and `.pv-nav` with `.pv-rail` (one or two `<img>`: previous and current; with one there's no item change), `.pv-rail-ring` and `.cursor.pv-rail-cursor`. All sidebar captures share the 1920×1080 viewport, so the same crop works for both images. |
| `PV.scene(id, build)` | Waits for the font faces the measurements depend on (700/600/500 of the first family in `--pv-font-display`, 500 of the first family in `--pv-font-mono`), creates `gsap.timeline({ paused: true })`, calls `build(root, tl)`, registers it in `window.__timelines[id]` and tells the runtime (`__hfForceTimelineRebind`). |

## Frequent patterns

```js
// Title by characters arriving with a streak from the left when the navigation ends
PV.streakIn(tl, PV.chars($('.x-title'), PV.t('x.title').toUpperCase()), C0, { from: 'left', dist: 200, stagger: 0.025, blur: 16 });

// Data pill that changes word on beats 2, 5, 9 and 12
PV.cycle(tl, $('.x-cycle'), PV.t('x.caps'), [b(2), b(5), b(9), b(12)], { cls: 'data' });

// Pill that also changes color (the last one in action = the action moment)
const C = PV.color;
PV.cycle(tl, $('.x-cycle'), PV.t('x.caps'), [b(2), b(5), b(8)], { colors: [C('data'), C('data'), C('action')] });

// Real fragment flying out of the plane toward the camera
const g = PV.crop(frag, 'dashboard', 'channels', { scale: 1.45, pad: 4 });
tl.fromTo(frag, { x: 1880 - g.w + 140, y: 300, rotationY: -18, opacity: 0, filter: 'blur(14px)', transformPerspective: 1400 },
  { x: 1700 - g.w, rotationY: 0, opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'expo.out' }, b(9));

// Big number that counts and hits, with a mono label below
PV.count(tl, $('.x-n1'), 1284, b(1.6), { dur: 1.1 });
PV.slam(tl, $('.x-n1'), b(1.6), { scale: 1.5, blur: 14, dur: 0.45 });
PV.fadeIn(tl, $('.x-l1'), b(1.6) + 0.2, { dur: 0.3 });

// 2D camera: go to a point of the world and back to the wide shot
tl.to(world, { ...PV.camAt(1.5, [hl.x + hl.w * 0.9, hl.y + 70]), duration: 1.2, ease: 'power3.inOut' }, b(3) - 0.2);
tl.to(world, { ...PV.camAt(0.92, [960, 560]), duration: b(3), ease: 'power2.inOut' }, b(19.5));

// Exit on beat 12 and entrance of the next scene
PV.zoomOut(tl, $('.x-world'), b(12) - 0.24, { scale: 1.3 });   // scene A
PV.zoomIn(tl, $('.y-world'), 0);                                // scene B
```

## `pv.css` classes not covered above

`.kt .w / .wi / .ch` (word and character masks), `.sheen` (reflection sweeping a plane: `xPercent -60 → 60` in 1.2 s), `.frag.flat` (fragment without glow), `.pill.ghost` (outline with a tint, for tags), `.badge-new` ("New" chip), `.flash` (`--flash` sets the color), `.vignette`, `.dots`. `--glow` (planes, fragments, `.kt.glow`) defaults to `--pv-brand`; `--acc` (`.kt .acc`) and `--dot` (`.dot`) default to `--pv-action`.

The attributes `data-layout-allow-overflow` (washes that leave the frame) and `data-layout-allow-overlap` (words stacked in a pill, titles in two lines) tell HyperFrames' layout inspector the overlap is intentional.
