# product-video-skills

Everything you need to make motion-design videos of a software product (a launch, a feature announcement, a promo, a reel) from code, with an AI agent doing most of the work. The video is written in HTML and GSAP, rendered by [HyperFrames](https://github.com/heygen-com/hyperframes), and built from **real screens of your app** captured with fictional demo data. No After Effects, no screen recording, any number of languages. Same input, same video.

![Contact sheet of the example video](examples/acme-desk/snapshots/acme-desk-en-contact.jpg)

*The example in this repo: a 36-second launch video of **Acme Desk**, a fictional helpdesk (`examples/acme-desk`). Every screen in it is the demo app, captured by the pipeline.*

## What's inside

1. **Skills** (`skills/`): the method, written so an agent (Claude Code, Codex) or a person can follow it step by step. `pv-video` is the entry point; the others are the manuals for each stage.
2. **Library and template** (`lib/`, `template/`): the visual language in code (`pv.css`, `pv.js`, a default theme and two OFL fonts) and a project skeleton you set up inside your product repo with one command.
3. **Tools** (`tools/`): measure the beat grid of a track, review a render against it, contact sheets, and the setup script.
4. **A complete example** (`examples/acme-desk/`): a small fictional app, its capture setup, four scenes, the storyboard and frames of the render. It runs end to end on any machine: the music is a generated placeholder beat.

## What makes these videos look good

- **Everything runs on the music's grid.** Each scene lasts a whole number of beats and starts on a bar; visual hits land on the kick. The structure of the track (breakdown, drop) decides which scene goes where.
- **Real screens, fictional data.** The app is built and captured with a demo account and a manifest of rectangles. Crops and camera moves use those measurements, never hand-placed coordinates.
- **No title cards, no frames.** Big kinetic type over the scene, pills that swap their word on every hit, 3D planes and real fragments that fly toward the camera.
- **Velocity-matched cuts.** The outgoing scene is still moving when the next one comes in (zoom-through, whip with a streak, vertical cut). Nothing settles before a cut.
- **Brand by tokens.** Colors come from your product's CSS tokens, mapped onto four accents with one job each (action, brand, data, one special concept).
- **Determinism.** Everything is a function of a paused timeline's time: no `Math.random`, no clocks, no CSS transitions. Renders are reproducible.
- **Frames before renders.** Contact sheets and snapshots of every new scene before rendering the whole video.

## Start a video for your product

Clone this repo, open your **product repo** in Claude Code and paste:

```text
Read <path to product-video-skills>/CLAUDE.md and skills/pv-video/SKILL.md. I want a motion-design video
of <product / announcement> in the style of examples/acme-desk. Start with the brief and a storyboard in
beats; show me frames before rendering.
```

By hand, the flow is:

| Step | Skill | Result |
|---|---|---|
| 1 | [pv-video](skills/pv-video/SKILL.md) | The brief: what is shown, for whom, in which languages, how long. |
| 2 | [pv-brand](skills/pv-brand/SKILL.md) | Your product's tokens mapped onto the video's (`brand.css`), logo, type. |
| 3 | [pv-music](skills/pv-music/SKILL.md) | The track and its measured beat grid (`music.json`). |
| 4 | [pv-story](skills/pv-story/SKILL.md) | `STORYBOARD.md`: scenes in beats, copy per language (`i18n.js`). |
| 5 | [pv-capture](skills/pv-capture/SKILL.md) | Real captures of the app with demo data and their manifest of rectangles. |
| 6 | [pv-motion](skills/pv-motion/SKILL.md) | The scenes (`compositions/*.html`) in the language of `pv.css` / `pv.js`. |
| 7 | [pv-render](skills/pv-render/SKILL.md) | `hyperframes check`, snapshots, render per language. |
| 8 | [pv-review](skills/pv-review/SKILL.md) | Contact sheets, measurement against the grid, checklist, verdict. |

Setting up the project inside your product repo:

```bash
node <path to product-video-skills>/tools/new-video.mjs <your product repo>   # template + lib → <repo>/video
cd <your product repo> && npm i -D puppeteer
# add the video:* scripts it prints to package.json, then follow skills/pv-video
```

To make the skills discoverable by an agent working in your product repo, copy or link them into `.claude/skills/` (see `skills/README.md`).

## Try the example first

```bash
cd examples/acme-desk
npm install                                   # puppeteer (downloads Chrome for the captures)
npm run video:capture                         # builds the demo app, captures it in en + es
node video/render.mjs --lang en --quality draft --name acme-desk
open video/launch/renders/acme-desk-en.mp4
```

The first HyperFrames run downloads its headless Chrome (~150 MB). A draft of the 36-second example renders in about 20 seconds on an Apple Silicon Mac.

## Recommended model

**Claude Opus 5.5 at high effort.** In testing, a single agent rebuilt a 2-minute, 12-scene launch video from these skills in about 45 minutes of agent time; a pricier model didn't add significant quality. Let it work scene by scene: the bottleneck is render and review time, not the model.

## Requirements

- Node 22 or later and `ffmpeg` (`brew install node ffmpeg` on macOS).
- HyperFrames downloads headless Chrome on its first render. Puppeteer (for the captures) is installed by the product repo.
- Measuring a track's grid only needs Node and ffmpeg (`tools/beat-grid.mjs`); `tools/beat-grid.py` does the same with `librosa`.
- HyperFrames always runs pinned: `npx --yes hyperframes@0.8.107`, with `HYPERFRAMES_SKIP_SKILLS=1` so it doesn't install anything into your machine's global agent skills. Upgrading is a decision, not an accident (see `pv-render`).

## Repo map

```text
skills/        pv-video (start here), pv-brand, pv-music, pv-story, pv-capture, pv-motion, pv-render, pv-review
lib/           pv.css, pv.js (shared visual language) · theme.css (default tokens) · fonts/ (Space Grotesk, JetBrains Mono, OFL)
template/      skeleton of a video project: index.html, three starter scenes, render.mjs, capture/, music.json
tools/         new-video.mjs (setup), beat-grid.mjs/.py (music grid), review.mjs (measure a render), contact-sheet.sh
examples/      acme-desk: a fictional helpdesk app + its launch video, end to end
references/    what was taken from launch-video-kit and from code-generated motion design posts
```

## Credits

- [HyperFrames](https://github.com/heygen-com/hyperframes) (HeyGen, Apache 2.0) renders; its official skills (`hyperframes-core`, `hyperframes-animation`) are the seek-safety doctrine `pv.js` follows.
- [launch-video-kit](https://github.com/timscheuerai/launch-video-kit) (Tim Scheuer, MIT): the idea of skills as manuals, the measured review, the lessons table. What was taken and what wasn't: `references/launch-video-kit.md`.
- Fonts and other third-party pieces: `THIRD_PARTY_NOTICES.md`.

MIT licensed (`LICENSE`).
