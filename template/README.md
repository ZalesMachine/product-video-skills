# Template · a product's `video/`

Skeleton of a motion-design video project. It lives inside the product repo as `video/` and is filled in following `skills/pv-video/SKILL.md`. The beat grid comes from `music.json`, the capture shots from `capture/shots.mjs`, the brand from the product's CSS tokens.

Out of the box it is configured for the demo app in `examples/acme-desk` (its routes, selectors, endpoints and copy), so you can see a working setup before replacing it with yours.

## Set up

```bash
node <product-video-skills>/tools/new-video.mjs <product>      # copies this folder to <product>/video + lib/ to video/launch/assets/lib
cd <product> && npm i -D puppeteer                             # if the product doesn't have it
```

Add to the product's `package.json`:

```json
"video:capture": "node video/capture/capture.mjs",
"video:preview": "node video/render.mjs --lang en --prepare-only && cd video/launch && HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@0.8.107 preview",
"video:render": "node video/render.mjs",
"video": "npm run video:capture && npm run video:render"
```

When `lib/` changes in product-video-skills, refresh the copy with `node <product-video-skills>/tools/new-video.mjs <product> --lib-only`.

## Fill in, in this order

| File | What goes in it |
|---|---|
| `music.json` | The measured track (`pv-music`): source, sha256, BPM, grid. It starts in `placeholder` mode (a generated beat at 100 BPM) so the skeleton renders before you choose a track; replace it before the storyboard is approved. `render.mjs` verifies it and writes `launch/assets/music.js`. |
| `launch/STORYBOARD.md` | The table of scenes in beats (`pv-story`). |
| `launch/assets/i18n.js` | Copy per language with the keys the scenes use, the product URL, and `locales` (one render per language listed). |
| `capture/config.mjs` | How the product is built and served, the CSS with its tokens and how they map onto the video's (`brand.map`), the logo. |
| `capture/shots.mjs` | Which routes to capture and which elements to measure (`pv-capture`). |
| `capture/demo-data.mjs` | The mocks of `/api/*` with the fictional account. |
| `launch/index.html` | One host per scene with `data-start`/`data-duration` computed from the grid, and the `<audio>`. |
| `launch/compositions/*.html` | One scene per file. `hook.html`, `section.html` and `finale.html` are starting points: rename them and fill them in (`pv-motion`). |
| `README.md` | Replace this file with the video's README (see `examples/acme-desk/video/README.md`): how it's generated, content decisions, music, maintenance. |

## Run

```bash
npm run video:capture                                # captures + manifest + brand
node video/render.mjs --lang en --prepare-only       # ready for check / snapshot / preview
cd video/launch && HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@0.8.107 check
cd video/launch && HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@0.8.107 snapshot --at 2,6,10 --describe false
node video/render.mjs --lang en --quality draft
node video/render.mjs                                # every language, high
```

Everything under `launch/assets/{screens,brand,audio}`, `launch/assets/lang.js`, `launch/assets/music.js`, `launch/renders/`, `launch/snapshots/`, `launch/review/` and `.cache/` is regenerated and not committed (`.gitignore`). `launch/assets/lib/` is committed: it's the product's own copy of the library.
