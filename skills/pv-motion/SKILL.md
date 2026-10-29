---
name: pv-motion
description: Manual under pv-video. The visual and motion language of the videos in code (lib/pv.css, lib/pv.js) - anatomy of a scene, background with color washes and grid, kinetic type, pills that cycle words, 3D planes and cropped fragments of real captures, cursor and click, counters, text decode, velocity-matched cuts (zoom-through, whip, vertical cut, flash), 2D camera, entering a section through the real sidebar, and recipes by scene type. Use for "write a scene", "animation", "transition", "how the title comes in", "the pill", "the fragment flies toward the camera", "camera", "cursor", "more dynamic", "less template-like".
---

# Motion language

> Manual under `pv-video`. If something here contradicts `pv-video`, `pv-video` wins. HyperFrames' technical contract (seek-safety, `data-*`) is in `pv-render`.

The language lives in two files shared by every scene: `lib/pv.css` (classes) and `lib/pv.js` (motion helpers on top of GSAP), plus `lib/theme.css` (the default `--pv-*` tokens). A scene is an HTML file with a `<template>` holding its own styles, its DOM and a `PV.scene(id, (R, tl) => { ... })` that builds its timeline in beats. Function reference: `references/pv-lib.md`. Recipes per scene type: `references/scene-recipes.md`. Runnable scenes: `examples/acme-desk/video/launch/compositions/`.

## The principles

1. **Everything is a function of time.** One paused GSAP timeline per scene; `fromTo` with an explicit start state; "randomness" with `PV.rng(seed)`. No `Math.random`, `Date.now`, `setTimeout`, `requestAnimationFrame`, CSS transitions or `repeat: -1`.
2. **Everything in beats.** `const b = PV.b;` then `b(4)`, `b(9.5)`. Hits land on whole beats; anticipations 0.1 to 0.25 s before (`b(4) - 0.24` so the exit ends on the beat).
3. **Long-tail curves, no bounce.** Entrances with `expo.out` or `power4.out` (0.4 to 0.6 s); exits with `power3.in` or `power4.in` (0.2 to 0.3 s); camera moves with `power3.inOut` (0.9 to 1.3 s); sweeps with `power1.inOut`. `back`, `elastic` and `bounce` are banned.
4. **Velocity matched at every cut.** The outgoing scene leaves with `PV.zoomOut` / `PV.whipOut` ending exactly on the bar, and the incoming one starts at 0 with `PV.zoomIn` / `PV.whipIn` / an entrance from below. No scene stops before cutting or starts still.
5. **Real screens as material.** Planes (`PV.plane`) and fragments (`PV.crop`) of the captures, using the manifest's measurements. The whole app small only as a blurred background plane behind big numbers.
6. **Type without plates.** Type lives on the scene, with a gradient `.scrim` only where a capture sits behind it. One accent per shot.
7. **Nothing is measured from the layout while building.** The scene is built with its clip hidden (`display: none` in the render): `offsetWidth` gives 0. Measure with `PV.textWidth`, `PV.rect` or CSS.
8. **Blur as speed.** Entrances and exits carry `filter: blur(10–24px)` that resolves as they brake. Never on text at rest.

## Anatomy of a scene

```html
<!doctype html>
<html><head><meta charset="UTF-8" /></head><body><template>
  <style>
    #sc-example { position: absolute; inset: 0; --c1: var(--pv-data); --c2: var(--pv-action); --c3: var(--pv-brand); }
    .e-world { position: absolute; inset: 0; }                 /* what comes in and goes out with the cut */
    .e-head { position: absolute; left: 120px; top: 118px; }   /* title top-left */
    .e-title { font-size: 112px; }
    .e-cap { position: absolute; right: 120px; top: 196px; font-size: 54px; font-weight: 700; letter-spacing: -0.03em; }
  </style>
  <div id="sc-example" class="scene" data-composition-id="example" data-width="1920" data-height="1080">
    <div class="bg"><i data-layout-allow-overflow class="wash w1"></i><i data-layout-allow-overflow class="wash w2"></i><i data-layout-allow-overflow class="wash w3"></i><div class="grid"></div><div class="vignette"></div></div>
    <div class="e-world">
      <div class="stage3d"><div class="plane e-plane"><img src="assets/screens/current/dashboard.png" alt="" /></div></div>
      <div class="frag e-frag"><img src="assets/screens/current/dashboard.png" alt="" /></div>
      <div class="e-head"><div class="kt e-title"></div></div>
      <div class="e-cap"><span class="e-cycle"></span></div>
    </div>
    <!-- Navigation, last so it stays on top: sidebar with the previous section active (tickets) and the current one (dashboard) -->
    <div class="pv-nav-dim"></div>
    <div class="pv-nav"><div class="frag pv-rail"><img src="assets/screens/current/tickets.png" alt="" /><img src="assets/screens/current/dashboard.png" alt="" /></div><div class="pv-rail-ring"></div><div class="cursor pv-rail-cursor"></div></div>
  </div>
  <script>
    PV.scene('example', (R, tl) => {
      const $ = (s) => R.querySelector(s), b = PV.b;
      PV.zoomIn(tl, $('.e-world'), 0);                                   // continues the previous zoom-through
      const C0 = PV.navIntro(R, tl, 'dashboard');                       // real sidebar (tickets → dashboard) + click → when the content comes in
      PV.streakIn(tl, PV.chars($('.e-title'), PV.t('dash.title').toUpperCase()), C0, { from: 'left', dist: 200, stagger: 0.025, blur: 16 });
      PV.cycle(tl, $('.e-cycle'), PV.t('dash.caps'), [b(2), b(5), b(9)], { cls: 'data' });
      const pg = PV.plane($('.e-plane'), 'dashboard', 1500);
      tl.fromTo($('.e-plane'), { x: 960 - pg.w / 2, y: 150, rotationX: 24, opacity: 0.3, filter: 'blur(3px)' }, { rotationX: 16, duration: b(12), ease: 'none' }, 0);
      const g = PV.crop($('.e-frag'), 'dashboard', 'kpi1', { scale: 1.2 });
      tl.fromTo($('.e-frag'), { x: 960 - g.w / 2, y: 700, scale: 0.5, opacity: 0, filter: 'blur(12px)' }, { y: 560, scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.55, ease: 'expo.out' }, b(2));
      PV.zoomOut(tl, $('.e-world'), b(12) - 0.24, { scale: 1.3 });      // exit toward the camera, ends on beat 12
    });
  </script>
</template></body></html>
```

The `data-composition-id` of the scene root, the id passed to `PV.scene` and the `data-composition-id` of the host in `index.html` are the same. `<style>` and `<script>` go **inside** the `<template>` (HyperFrames drops the ones in `<head>` for sub-compositions). Prefix every class per scene (`.e-*`, `.t-*`): the assembled page must have unique ids and no class collisions.

## Vocabulary

| Element | Class / helper | What it is |
|---|---|---|
| Background | `.bg` + `.wash.w1/.w2/.w3` + `.grid` + `.dots` + `.vignette` | The product's ground (`--pv-ground`), three radial washes in the scene's `--c1..3`, a masked 120 px technical grid, dots, vignette. Washes come in with `scale 0.7 → 1` in the hook and beat with `PV.pulse`. |
| Ornaments | `.hair.h/.v`, `.cross`, `.ring`, `.tick-label`, `.frame-corners` | Hairlines that draw themselves (`PV.drawLines`), technical crosses at corners, dashed rings that turn, mono labels. They frame the product name. |
| Kinetic type | `.kt` + `.kt-xl/-l/-m/-s/-xs`, `.glow`, `.dim`, `.acc` | Display font (`--pv-font-display`) at 700, uppercase, `letter-spacing: -0.04em`. Enters by characters (`PV.chars` + `PV.streakIn`/`PV.slam`) or by masked words (`PV.words` + `PV.rise`). `.glow` uses `--glow` (default brand); `.acc` uses `--acc` (default action). |
| Eyebrow / index | `.eyebrow` (+ `.dot`), `.idx`, `.badge-new` | Mono labels (`--pv-font-mono`): URL with an action dot, the action "New" chip, a "Coming soon" tag as a `.pill.ghost`. |
| Pill | `.pill` (+ `.action/.brand/.data/.special/.ghost/.round`), `PV.cycle` | A word on an accent with inner light. Cycles words: the outgoing one rises, the pill changes width and color, the incoming one rises from below. |
| Plane | `.stage3d > .plane` + `PV.plane` | A whole capture as a 3D card with border, shadow and a glow in `--glow` (default brand; set it to the section's color). `.sheen` is a reflection that sweeps it. |
| Fragment | `.frag` + `PV.crop` | A crop of a capture by a manifest target or a literal rect (a row, a KPI, a chip, a card), with border and shadow. Flies toward the camera from its place in the plane. `.frag.flat` has no glow. |
| Cursor | `.cursor` + `PV.cursorHTML` + `PV.click` | White arrow with a dark outline and an action-colored ripple on click. Travels with `power3.inOut` and squashes the SVG when pressing. |
| Sidebar | `.pv-nav-dim` + `.pv-nav > .pv-rail` (previous img + current img) + `.pv-rail-ring` + `.pv-rail-cursor` + `PV.navIntro` | The product's real sidebar, enlarged 1.7×, arrives from the left with the previous section active; the cursor clicks the new one (the active item changes, as in the product), an action ring marks it and the camera dives in through that item. Returns when the content should come in (~1.4 beats). |
| Flash | `.flash` | White layer that starts at 0.35–0.6 opacity and falls in 0.45 s. Only on the drop and on strong phrase starts. `--flash` sets its color. |
| 2D camera | `.x-world { transform-origin: 0 0 }` + `PV.camAt(S, P)` | A 1920×1080 "world" scaled and translated to center a point. One writer per world. |
| Counter | `PV.count` | A number that counts with regional formatting, `expo.out`, paired with `PV.slam`. |
| Decode | `PV.decode` | Text that resolves from seeded random glyphs (the URL). |

## Cuts

| Cut | Exit (scene A, ends on the bar) | Entrance (scene B, from 0) | When |
|---|---|---|---|
| Zoom-through | `PV.zoomOut(tl, world, T - 0.24, { scale: 1.3–1.5 })`: scales toward the camera with blur 18 and opacity to 0 | `PV.zoomIn(tl, world, 0)`: from 0.72 with blur, `expo.out` 0.55 s | The main cut (60–70 % of the cuts). |
| Lateral whip | `PV.whipOut(tl, world, T - 0.22, { dir: -1 })`: 420 px to the left with blur 22 | `PV.whipIn(tl, world, 0, { dir: -1 })`: arrives from the right | Change of topic. |
| Vertical cut | `tl.to(world, { y: -360, filter: 'blur(20px)', duration: 0.22, ease: 'power4.in' }, T - 0.22)` + opacity | `fromTo(world, { y: 360, opacity: 0.2, blur 20 }, { y: 0 ... power4.out 0.5 })` | Once per video, and between panels of the same block. |
| Flash | — | `.flash` from 0.35–0.6 to 0 in 0.45 s, together with `PV.slam` of the title | Drop, strong phrase start. No more than 3 per video. |
| Arrival | — | `PV.arrive(tl, el, t, { from: 1.3 })`: oversized, settles back | Payoffs: the product name, a contrast scene. |
| Fade to black | `.f-black` from 0 to 1 in 2 beats, `power1.in` | — | Only the end, with the track fading out. |

Splice rule: the exit uses `.in`, the entrance the mirror `.out`, and the fastest points meet at the cut. A scene never ends still.

## Recipes (summary; detail in `references/scene-recipes.md`)

- **Hook**: fixed word + a pill cycling one word per beat (0–4); real fragments flying out of the center to an orbit with rings (2–4); optional light contrast scene with `PV.arrive` and a 3D pill (4–8); "Introducing / the new" by characters; product name with glow, logo, hairline frame and decoded URL; riser with the next scene's screen rising behind (12–16).
- **Before/after**: two overlapping planes, the new one with `clip-path: inset(0 100% 0 0)` swept by an action-colored line (`power3.inOut` 0.95 s); two pairs; close with both versions side by side tilted toward the center.
- **Section with cards**: real cards arrive scattered with rotation, snap into a grid inside a dashed action frame, the cursor opens one and a ring lights up.
- **Section with scroll**: the plane with the sidebar fixed and an inner `clip` where the `-full` capture scrolls for real to manifest anchors; a fragment toward the camera; an action check to close.
- **List in cascade**: real rows fall from depth one every 0.4 beats (`rotationX: -35 → 0`), status chips jump 2× above their row, the other rows leave and a 2D camera isolates one; cursor click, the result lands on it with an action ring.
- **Big numbers**: three `PV.count` + `PV.slam` on consecutive beats over the blurred plane (opacity 0.32, blur 3), the real KPI strip appears below as their source; then real cards (chart, breakdown) toward the camera.
- **Title that hits over a table**: `.flash` + a 230 px title coming from 2.2× that shrinks to the corner on bar 1 (`textWidth` to center it), the real tilted table passing upward through the whole scene (`ease: 'none'`), chips at 2× flying out in a column, a counter + unit.
- **Reading scene with a 2D camera**: the world at 0.72 on the right with the title on the left; `camAt(1.5, target)`, a selection that grows with `scaleX`, a real comment floating, joined by an SVG curve that draws itself; a click with an action press and a confirmation toast; an approval stamp; back to the wide shot.
- **Two features**: header with the "New" chip, two cards with media (`rotationX: -80 → 0` from the base), label with a color dot, subtitle; 3 beats between them.
- **Big announcement**: 210 px title + decoded eyebrow on the drop; fixed header with a tag and dashes that light up; 8-beat panels (name in two lines, subtitle, a drawn visual from the right with `rotationY: -18`), each visual with its own micro-story.
- **Numeric payoff**: title by characters, a lead-in by words, `count` to a big number at 300 px with `slam` 1.8× and three rings opening on the kick.
- **Finale**: eight real planes, one per beat, each with its own tilt; two lines rising by words (the last word in action; `fit` with `textWidth` ≤ 1700 px); zoom-through to the lockup (logo, name with glow and frame, URL as an address bar, decoded); black in the last 2 beats.

## What not to do (what reads as template)

- Bounces, `back.out`, confetti, glitch, loose particles.
- Opaque text plates; corner labels; scene numbering; "before"/"after" written on screen.
- The whole app at thumbnail size as content (only as a blurred background).
- Tweening `width`/`height`/`top`/`left` to move things (only `x`, `y`, `scale`, `rotation`; `width` only for the pill that changes word, plus `clip-path`/`scaleX` for sweeps).
- The same cut in every scene, or a different cut per scene. One main cut, two accents.
- More than 3 flashes, more than one accent per shot, more than one idea per beat.
- A UI fragment at 1× when its text is 15 px: crop tighter and scale up (≥ 1.3×) until it reads.

## Before calling a scene done

- [ ] `hyperframes check` without errors (from `video/launch`).
- [ ] Snapshots at its first beat, at each pill change, and 0.1 s before / 0.2 s after its exit cut.
- [ ] The state at t=0 is right (everything that comes in later has `opacity: 0` or an initial `gsap.set`).
- [ ] No `offsetWidth`/`getBoundingClientRect` in the scene's code.
- [ ] Copy from `PV.t`, numbers with `PV.count`/`PV.fmt`, colors from `--pv-*` tokens.
