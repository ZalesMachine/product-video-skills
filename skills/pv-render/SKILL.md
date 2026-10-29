---
name: pv-render
description: Manual under pv-video. Run HyperFrames for a product video - project structure (index.html mounting scenes on beats + the music), the sub-composition and seek-safety contract, render.mjs per language (lang.js, screens/current, music.js, placeholder beat, sha256 of the music, bar cuts), hyperframes check, snapshot, preview (Studio), draft/high renders, the pinned version and how to upgrade it, and the known errors. Use for "render", "hyperframes", "check fails", "snapshot", "preview", "Studio", "the render looks different", "upgrade hyperframes", "lint".
---

# Rendering with HyperFrames

> Manual under `pv-video`. If something here contradicts `pv-video`, `pv-video` wins. The full contract is in HyperFrames' official skills (`references/hyperframes-notes.md` says how to read them); this is what this workflow uses.

[HyperFrames](https://github.com/heygen-com/hyperframes) (HeyGen, Apache 2.0) renders HTML to video: it opens the composition in headless Chrome, seeks every frame on the paused timeline and captures it. That's why **everything has to be a function of time**. Always run it pinned and without touching the machine's global skills:

```bash
cd video/launch && HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@0.8.107 <command>
```

`render.mjs` wraps that. The workflow doesn't depend on `npx hyperframes init` or on a `package.json` of its own: the project lives inside the product repo, in `video/`.

## Project structure (`video/launch/`)

- `index.html`: the root composition. Loads `assets/lib/theme.css`, `assets/brand/brand.css`, `assets/lib/pv.css`, GSAP 3.14 (CDN), `lang.js`, `music.js`, `i18n.js`, `screens/current/screens.js` and `assets/lib/pv.js`; declares local `@font-face` rules; mounts each scene as a host `<div data-composition-id="x" data-composition-src="compositions/x.html" data-start data-duration data-track-index="1" data-width data-height>` plus `<audio id="music" data-timeline-role="music" src="assets/audio/music.mp3" data-start="0" data-duration data-volume="0.9" data-fade-out="2">`. Registers `window.__timelines['main'] = gsap.timeline({ paused: true })`.
- `compositions/*.html`: one scene per file, inside `<template>`, with `<style>` and `<script>` inside (`pv-motion`).
- `hyperframes.json`: `paths` (`blocks`, `components`, `assets`) and `media.autoProxy`.
- `assets/`: `lib/` (the copy of this repo's `lib/`, refreshed with `tools/new-video.mjs <product> --lib-only`), `i18n.js`, and what's generated (`brand/`, `screens/`, `audio/`, `lang.js`, `music.js`).

Times in `index.html` with three decimals: `data-start = first_downbeat + beat × 60/BPM` (the hook starts at 0 with the track); `data-duration = beats × 60/BPM`; the root lasts until the end of the last scene, and so does the `<audio>`.

## `render.mjs`

1. **Languages**: the keys of `locales` in `launch/assets/i18n.js` (read with `node:vm`), or `--lang`.
2. **`ensureMusic()`**: with `music.placeholder` (`{ bars }`), generates a deterministic placeholder beat at `music.bpm` with ffmpeg (kick, off-beat hats, bass, a crash every 16 beats); otherwise copies the track from `music.source` (local path, `~` allowed) or downloads `music.url`, and verifies its `sha256`. The original lives in `video/.cache/music-source.mp3`; if `cuts.launch` is set, it removes those bars with a short crossfade (`pv-music`) into `launch/assets/audio/music.mp3`. A stamp file avoids redoing it when nothing changed.
3. **`prepare(lang)`**: copies `assets/screens/<lang>/` to `assets/screens/current/`, writes `assets/lang.js` (`window.PV_LANG`) and `assets/music.js` (`window.PV_MUSIC = { bpm, first_downbeat, beat }` from `music.json`).
4. **`hyperframes check`**, then **`hyperframes render --quality <q> --fps 30 --output renders/<name>-<lang>.mp4`**.

```bash
node video/render.mjs --lang en --quality draft      # iterate
node video/render.mjs --lang en --prepare-only       # only prepare (for check, snapshot or preview)
node video/render.mjs --name launch                  # every language, high
```

## The work cycle

1. **Prepare the language** (`--prepare-only`), because `check`, `snapshot` and `preview` read `assets/screens/current/`, `lang.js` and `music.js`.
2. **`check`** after every scene: lint + runtime validation (JS errors, missing assets) + layout + contrast. A lint error turns the layout audits off: `0 sample(s)` doesn't mean "clean", it means "didn't run".
3. **`snapshot --at a,b,c --describe false`**: PNGs of the requested seconds in `snapshots/`, plus a `contact-sheet.jpg`. For one scene: its first beat, every pill change, and 0.1 s before and 0.2 s after its exit cut. `--zoom '#sc-x .frag'` crops at high density. Without `GEMINI_API_KEY`, `--describe false` avoids the warning.
4. **`preview`** (`npm run video:preview`): Studio in the browser with an editable timeline and the waveform. To hear the grid and drag scene starts. Whatever you change in Studio must be carried to `index.html`/the scenes by hand.
5. **`draft` render** of the whole video, contact sheet (`tools/contact-sheet.sh`, `tools/review.mjs`), look.
6. **`high` render** per language. Verify with `ffprobe`: duration equal to the root's `data-duration`, 30 fps, audio present.

## Seek-safety (what breaks a render)

- One paused timeline per composition, registered under the same id as `data-composition-id`. `PV.scene` does it, and waits for the fonts before building: **registering after building is done** is what matters.
- `fromTo` with an explicit start state; `immediateRender: true` only when the start state must show at t=0 (counters, decode). For elements that come in late, `gsap.set(el, { opacity: 0 })` while building (not `tl.set` at 0).
- No `Math.random`, `Date.now`, `performance.now`, `setTimeout`, `requestAnimationFrame`, CSS transitions or animations, `repeat: -1`. A finite `yoyo` with `repeat: 1` is fine.
- Don't tween `display`, `visibility` or `autoAlpha` on the `.clip` (the runtime owns the clip's visibility). Animate children (`.x-world`).
- Don't mix a CSS `transform` with GSAP tweens on the same element (`gsap_css_transform_conflict`): the start state goes in the `fromTo`.
- `width`/`height`/`top`/`left` are not animated to move things (measured exceptions: the pill's width, `clip-path`, `top` of three absolute results).
- Scenes are built with their clip hidden: **don't measure the DOM**. `PV.textWidth`, the manifest, CSS.
- Text written by script inherits the container's font; there's no serif fallback because `.scene` sets `font-family`.
- Local fonts with `@font-face` (lint: `font_family_without_font_face` if a family has no face declared).
- `<audio>` with an `id`; no `crossorigin` on media.
- Unique ids in the assembled page: prefix per scene (`#sc-hook`, `.h-*`; `#sc-tickets`, `.t-*`).

## Known errors and their fix

| Symptom | Cause | Fix |
|---|---|---|
| `[pv] missing capture "x" in screens.js` in `check` | The capture of that language wasn't run, or the shot id changed | `npm run video:capture -- --lang en --only x`; check `shots.mjs`. |
| `[pv] missing target "y" in "x"` | The selector didn't match (`no target` in the capture) | `--probe`, update the selector, capture again. |
| `Captures missing for en: run npm run video:capture` | `render.mjs` found no `screens.js` for the language | Run the capture (every language listed in `locales`). |
| `Music missing: copy "…" to …` / `does not match the sha256` | The track isn't at `source`, or it's a different file | Copy the right file; if you changed the track on purpose, measure it again and update `music.json` (`pv-music`). |
| Elements at 0×0 or pills without width | The layout was measured while building | Use `PV.textWidth` or the manifest. |
| Something shows at t=0 that shouldn't | Missing start state | `gsap.set(el, { opacity: 0 })` while building, or `fromTo`. |
| Something that should show at t=0 disappears in the render | `tl.set(..., 0)` | Start state in CSS or in `gsap.set` while building. |
| The cut doesn't land on the beat | `data-start` badly rounded, or an exit without the `- 0.24` | Recompute with three decimals; `tools/review.mjs --music`. |
| Render differs from the preview | System fonts or Chrome version | Local fonts with `@font-face`; `--docker` for full determinism. |
| Headless Chrome hangs while capturing | "New" headless on macOS | `capture.mjs` uses `chrome-headless-shell` and retries once. |
| `check` reports intentional overlaps | Stacked words or washes off-frame | `data-layout-allow-overlap` / `data-layout-allow-overflow` / `data-layout-ignore`. |
| Silent audio | `<audio>` without `id` or `data-duration` | Add them. |
| The machine's global hooks or skills changed | `npx hyperframes` without `HYPERFRAMES_SKIP_SKILLS` | Always `HYPERFRAMES_SKIP_SKILLS=1`. |
| `duplicate_media_discovery_risk` (lint warning, one per repeated `<img>`) | Several fragments use the same capture | Inherent to the fragment language. A warning, not an error: ignore it. |
| `font_family_without_font_face` for a font written in a scene's CSS | The lint looks for the `@font-face` in the same file | Don't write `font-family` in scenes: inherit from `.scene`, or use `var(--pv-font-display)` / `var(--pv-font-mono)`. |
| `PV.words` words peek out before their `rise` | The `.w` mask shows part of the glyph when the block is tight against another | Keep the container at `opacity: 0` (`gsap.set`) until its beat and `set` it to 1 there. |

## Version

Pinned to `0.8.107` in `render.mjs` and in the product's `package.json` (`video:preview`). To upgrade:

```bash
cd video/launch && npx hyperframes@latest upgrade --project . --check   # what changes
```

Then: change the pin in `render.mjs` and `package.json`, `check`, `draft` render of one language, compare the contact sheet with the previous one, and only then the `high` render. Note the new version in the video's README and in `references/hyperframes-notes.md`.

## Quality and timing

| `--quality` | For | A 2-minute video on an M-series Mac |
|---|---|---|
| `draft` | Iterating, contact sheets | ~20–30 s |
| `standard` | Team review | ~45 s |
| `high` | Delivery | ~1 min |

`--workers 4` is usually the sweet spot; `--gpu` uses VideoToolbox on macOS for the encode. The first render downloads Chrome (~150 MB).
