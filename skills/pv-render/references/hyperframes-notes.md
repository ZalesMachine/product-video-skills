# Notes on HyperFrames

What this workflow needs to know about HyperFrames, with the version it was tested on. For everything else, the official skills.

## Version

`0.8.107`. launch-video-kit was written against `0.8.77`; between the two, little of what this workflow uses changed (`check` replaces `validate`/`inspect`/`layout`; `snapshot` gained `--zoom` and `--angle`; `beats` detects the beats of the music).

## Official skills

They are not installed on the machine (that's why `HYPERFRAMES_SKIP_SKILLS=1`), but they live in the HyperFrames repo and are worth reading when you need to go beyond `pv.js`:

```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/heygen-com/hyperframes /tmp/hf && cd /tmp/hf && git sparse-checkout set skills
```

| Skill | What it has |
|---|---|
| `skills/hyperframes-core/SKILL.md` + `references/` | The contract: `data-*`, sub-compositions, determinism, `class="clip"`, variables, media. Read `determinism-rules.md` and `sub-compositions.md`. |
| `skills/hyperframes-animation/` | `rules-index.md` (atomic recipes: `kinetic-beat-slam`, `waterfall-entry`, `viewport-change`, `coordinate-target-zoom`, `cursor-click-ripple`, `card-morph-anchor`, `svg-path-draw`, `counting-dynamic-scale`, `motion-blur-streak`…), `transitions/catalog.md`, `blueprints-index.md`, `adapters/gsap-*.md`. `pv.js` is this repo's version of several of those rules. |
| `skills/hyperframes-cli/SKILL.md` | Every command and flag. |
| `skills/music-to-video/` | The official workflow for videos cut to music (beat grid, `beats.json`). `music.json` plays the same role here with less ceremony. |
| `skills/media-use/` | Music, SFX, icons, voice (local TTS with Kokoro: `npx hyperframes tts`), image treatments. |

On the machine, `npx hyperframes docs <topic>` (`data-attributes`, `gsap`, `compositions`, `rendering`, `troubleshooting`) prints the short docs without network.

## The contract on one page

- A **standalone** (`index.html`) has the root `data-composition-id` directly in `<body>`, without `<template>`. A **sub-composition** goes inside `<template>`, with `<style>` and `<script>` inside (the ones in `<head>` are dropped). Host, template and the `window.__timelines` key share the same id.
- A sub-composition's root is sized with `inset: 0` / `100%`, never a hand-written `1920px`; the canvas size is `data-width`/`data-height`. (`pv.css` uses `.scene { position: absolute; inset: 0 }`.)
- The render's duration is the root's `data-duration`, not the timeline's: whatever runs past it is cut, whatever is missing freezes.
- `data-track-index` is just a row in Studio: it doesn't order or prevent overlaps (`z-index` does).
- Media: `<video>`/`<audio>` with `data-start`, `data-duration`, `data-media-start`, `data-volume`, `data-fade-in/out`; the framework finds and decodes them; never `play()` or `currentTime` by hand.
- The runtime creates `window.__timelines` before the scripts; a scene can register its timeline from a callback (fonts) as long as it does it once and complete. `__hfForceTimelineRebind` tells the runtime when it registers late.
- `data-hidden` hides an element in preview and render (Studio's eye).
- Per-instance variables: `data-composition-variables` (declaration, on the sub-comp's `<html>`) and `data-variable-values` (values, on the host); `window.__hyperframes.getVariables()`. Not used here: the language comes in through `lang.js` because it changes captures and copy at the same time.

## Commands used

```bash
HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@0.8.107 check
HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@0.8.107 snapshot --at 5.2,10.7,20.8 --describe false
HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@0.8.107 snapshot --at 22 --zoom '#sc-tickets .t-solved' --describe false
HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@0.8.107 preview
HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@0.8.107 render --quality high --fps 30 --output renders/x.mp4
HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@0.8.107 timeline --json      # what's in the timeline without reading every html
HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@0.8.107 beats --json .       # beats of the music (often reads double time)
HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@0.8.107 doctor               # dependencies (ffmpeg, Chrome)
```

## Differences from launch-video-kit

- They render the picture silent and mix outside (`audio.py`, -14 LUFS) because HyperFrames has no master bus. This workflow puts the music in the root's `<audio>` with `data-volume` and `data-fade-out`, and the render comes out with sound. If a video carries voice and SFX, go back to their scheme (silent render + ffmpeg mix + mux).
- They write the copy into the HTML at build time (Python) to avoid the serif fallback. Here it's written by script, and there's no fallback because the font is set on `.scene` and `PV.scene` waits for `document.fonts.load`.
- They use a single `onUpdate` tween that draws everything as a function of `t`. Here it's regular GSAP tweens with `fromTo`: more readable for a dozen distinct scenes, and just as seek-safe.
