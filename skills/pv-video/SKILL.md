---
name: pv-video
description: Entry point for making or changing a motion-design product video built from code (launch, feature announcement, product promo, reel) with HyperFrames and GSAP. Defines the whole flow (brief, music, storyboard in beats, real captures with demo data, scenes, render, review), the format, the quality bar and when to open each manual (pv-brand, pv-music, pv-story, pv-capture, pv-motion, pv-render, pv-review). Use for "launch video", "product video", "motion design", "video like the example", "add a scene", "English/Spanish version of the video", "make a video of our app".
---

# Product video · motion design from code

A product video here is **a sequence of scenes on the grid of a music track**, with real screens of the product captured with fictional data, big kinetic type, and cuts that match velocity. It is written as a HyperFrames project (HTML + GSAP) inside the product repo, in `video/`, and rendered per language with one command. The reference is `examples/acme-desk/`: look at its frames (`snapshots/`) and its storyboard before you start.

## The core (keep it)

| What | How |
|---|---|
| **Format** | 16:9, 1920×1080, 30 fps, H.264 + AAC. Length: whatever the story needs, in whole beats (a 12-scene launch ran 192 beats = 2:02 at 95 BPM; the example is 60 beats = 36 s at 100 BPM). For social, 15 to 30 s cuts of the same master, never a different language. |
| **Music** | An instrumental track, royalty-free or licensed, with a clear structure (intro, 16-beat phrases, breakdown, drop). It is measured and saved to `music.json`; the structure decides the edit (`pv-music`). Until the track is chosen, a generated placeholder beat lets you build and time. |
| **Screens** | Real: the built frontend captured with puppeteer, the API mocked with a demo account, a manifest of rectangles per element (`pv-capture`). The camera and the crops use those measurements. |
| **Visual language** | Dark ground (`--pv-ground`) with brand color washes that change per scene and a technical grid; kinetic type in the display font, 700, uppercase; pills that swap their word on every hit; 3D planes and cropped fragments of real screens; zoom-through, whip and vertical cuts with a flash on the strong ones (`pv-motion`). |
| **Brand** | The product's tokens mapped onto `--pv-*` in `brand.css`; accents with one job each (action = CTA/success/"new", data = numbers, brand = the product name, special = one reserved concept only); the product logo as it is (`pv-brand`). |
| **Copy** | In `i18n.js` per language, with the product's real section names. No frame, corner labels or scene numbers. The product URL appears in the hook and in the closing. |
| **Determinism** | One paused timeline per scene via `PV.scene`, `fromTo` with explicit start states, no randomness or clocks. Same input, same video. |
| **No voice-over** | By default the music and the on-screen text carry the rhythm. If a video needs a voice, it is aligned word by word (see `references/launch-video-kit.md`); never improvised. |

## What's open

The content (which scenes, in what order), the track, the color washes per scene, the length, the languages and which parts of the product appear. Each of those decisions is written in `STORYBOARD.md` and in the video's README before animating.

## Model and way of working

Claude Opus 5.5 at high effort. In testing, a single agent rebuilt a 2-minute, 12-scene launch video from these skills, the template and the tools in about 45 minutes of agent time (captures, check, snapshots and six draft renders), and a pricier model didn't add significant quality. The whole flow fits in one long session with one agent. What takes time is rendering and looking; don't save on the model only to iterate more afterwards.

## The flow

1. **Brief (10 minutes, with the team).** What is launched or announced, for whom, in which languages, where it's published, how long it can be, what stays out. What is "new" (gets a chip) and what is "coming soon" (gets a tag). Write the content decisions in the video's README (see the example's "Content decisions").
2. **Set up.** `node tools/new-video.mjs <product-dir>` copies `template/` to `<product-dir>/video` and the library into `video/launch/assets/lib/`. Add the npm scripts it prints.
3. **Brand.** Read `pv-brand`. Map the product's CSS tokens onto `--pv-*` in `capture/config.mjs` (`brand.map`); whatever you don't map keeps the defaults of `lib/theme.css`.
4. **Music.** Choose the track and measure it (`pv-music`). No scene is built without a measured `music.json`. The placeholder beat is for blocking out only; it is replaced before the storyboard is approved.
5. **Storyboard.** Write `STORYBOARD.md` in beats: one row per scene with start, length in beats, what the music does and the exit cut (`pv-story`). Write `i18n.js`. Show it to the team and wait for the OK.
6. **Captures.** Configure `capture/config.mjs`, `capture/shots.mjs` and `capture/demo-data.mjs`, run the capture, check the PNGs and the manifest (`pv-capture`).
7. **Scenes.** One composition per scene in `launch/compositions/`, with the helpers of `pv.js` (`pv-motion`). After each scene: `hyperframes check` and snapshots of its seconds.
8. **Render.** `node video/render.mjs --lang en --quality draft`, contact sheet, look, fix, and only then `--quality high` for each language (`pv-render`).
9. **Review.** `tools/review.mjs` (cuts against the grid, still stretches, loudness), visual checklist, the team's verdict and a row in `lessons.md` (`pv-review`).

Stages 6 and 7 run in parallel once the storyboard is approved: the capture runs while the first scenes are written against an older manifest or provisional rectangles.

## Where everything lives (in the product repo)

```text
video/
  README.md                 how it's generated, content decisions, music, maintenance
  music.json                track, source, sha256, BPM, measured grid (or the placeholder)
  render.mjs                prepares language + captures, hyperframes check + render
  capture/
    capture.mjs             app build, local server, puppeteer, manifest, brand
    config.mjs              how to build/serve the app, storage, brand map, logo
    shots.mjs               which screens to capture and which elements to measure
    demo-data.mjs           mocks of /api/* with the fictional account
  launch/
    index.html              mounts the scenes in beats + the music
    hyperframes.json
    STORYBOARD.md
    compositions/*.html     one scene per file
    assets/i18n.js          copy per language (+ url, locales, fallback)
    assets/lib/             pv.css, pv.js, theme.css, fonts/ (copied from lib/ of this repo)
    assets/{brand,screens,audio,lang.js,music.js}   generated, not committed
    renders/, snapshots/    generated
```

The skeleton is `template/`; `tools/new-video.mjs` copies it. `--lib-only` refreshes `assets/lib/` after the library changes here.

## Quality bar

- Something moves from the first frame and something happens on every beat; no still stretch longer than 2 beats except the ending.
- Every scene cut lands on a bar and every text or number hit on a beat.
- Every screen you see is real and legible: fragments at 1× or larger, never the whole app tiny except as a blurred background plane.
- One accent per shot. Action only for action, success and "new"; data for numbers; brand for the product name; special for its one concept.
- Text enters by words or characters with a long tail (`expo.out`, `power4.out`), never with a bounce.
- Every scene ends moving into the next one (zoom-through, whip, vertical cut) and the next one starts already in flight.
- The closing: a one-cut-per-beat montage, a closing line, logo + product name + URL, fade to black with the end of the track.
- Data on screen is fictional (a demo account: "Harbor & Pine" in the example), and the video's README says so.
- Nothing is invented: numbers, feature names and claims come from the product or from the team's brief. Copy uses the product's real section names.

## Rules that cost a round

- Scenes are built while their clip is hidden in the render: `offsetWidth` and `getBoundingClientRect` return 0. Measure with `PV.textWidth`, the manifest or CSS.
- A `tl.set` at t=0 can vanish in the render: start states go in `gsap.set` at build time or in `fromTo`.
- See `skills/pv-review/references/lessons.md` for the full list.

## Manuals

| Skill | When to open it |
|---|---|
| `pv-brand` | At the start, and whenever the product's tokens need mapping. |
| `pv-music` | To choose and measure a track, or to replace the placeholder beat. |
| `pv-story` | To write the storyboard in beats and the copy. |
| `pv-capture` | To capture screens of an app (current or earlier version) with demo data. |
| `pv-motion` | To write or change a scene: the `pv.js` API, recipes per scene type, cuts. |
| `pv-render` | To run HyperFrames: check, snapshots, preview, render, versions, known errors. |
| `pv-review` | To measure and look at a render, and close with a verdict. |
