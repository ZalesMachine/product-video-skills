# Working in product-video-skills

This repo is a manual and a toolbox for making motion-design videos of a software product (launches, feature announcements, promos) from code: HyperFrames + GSAP, real screens of the app captured with demo data, every cut on the beat of the music. Read `README.md`, then `skills/pv-video/SKILL.md`: that skill is the entry point and says when to open the others.

## Rules

- **Model: Claude Opus 5.5** at high effort. If you are running on another model, say so when you start.
- **The example is the bar.** Before proposing a new visual language, look at `examples/acme-desk/snapshots/` and the scenes in `examples/acme-desk/video/launch/compositions/`. A new video changes the content and the music; it changes the visual language only if the request says so.
- **Write in the team's language** (storyboard, the video's README, on-screen copy per language). On-screen names are the product's real names (its menu and section labels), never synonyms.
- **Nothing is invented.** Numbers, feature names and claims come from the product or from the team's brief. The data on screen belongs to a fictional demo account, and the video's README says so.
- **Music grid first.** No scene is built without a measured `music.json` (BPM, first downbeat, phrases, breakdown, drop). Scenes last whole beats and start on bars. The `placeholder` beat in `music.json` is for trying the kit and blocking out timing only: replace it with a measured track before the storyboard is approved.
- **Real screens.** The UI is captured from the app's build with demo data and a manifest of rectangles (`pv-capture`). UI is never drawn by hand, except for things that don't exist yet (and those use generic cards with no third-party brands).
- **Frames before renders.** `npx hyperframes snapshot --at ...` or `tools/contact-sheet.sh` on a `draft` render before a `high` render. Show them to the team with the storyboard.
- **Determinism (seek-safety).** One paused GSAP timeline per scene registered with `PV.scene(id, ...)`; `fromTo` with an explicit start state; no `Math.random`, `Date.now`, timers, CSS transitions or `repeat: -1`. Scenes never measure the layout while they build (use the manifest, `PV.textWidth` or CSS).
- **HyperFrames pinned** at `0.8.107` and run with `HYPERFRAMES_SKIP_SKILLS=1` so it doesn't touch the machine's global skills. Upgrading: `pv-render`.
- **Generated files are not committed.** Captures, extracted brand, audio, renders and cache are in `.gitignore` (see `template/gitignore`). Music is not redistributed: `music.json` points to the file and checks its sha256.
- **Close with a verdict.** Every video ends with a row in `skills/pv-review/references/lessons.md`: what was approved, what was rejected and why. That is what makes the next one start better.

## Typical commands (inside a product repo that has `video/`)

```bash
node <this repo>/tools/new-video.mjs .           # once: template + lib → ./video
npm run video:capture                            # captures + manifest + brand (puppeteer)
npm run video:preview                            # HyperFrames Studio with the editable timeline
node video/render.mjs --lang en --quality draft
npx --yes hyperframes@0.8.107 snapshot --at 5.2,10.7 --describe false   # from video/launch
node <this repo>/tools/review.mjs video/launch/renders/<video>.mp4 video/launch/review/v1 --music video/music.json
```
