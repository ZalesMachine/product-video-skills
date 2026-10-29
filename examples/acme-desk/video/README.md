# Acme Desk · launch video

A 36-second launch video of Acme Desk, in English and Spanish, made with product-video-skills. **Acme Desk is fictional**: the app in `../app` exists only to be captured, and every name, company, ticket and number on screen is invented demo data (`capture/demo-data.mjs`, account "Harbor & Pine", domains `.example`).

Frames of the render: `../snapshots/`. Measurement of the render: `../review/report.md`.

## How it's generated

```bash
cd examples/acme-desk
npm install                                          # puppeteer
npm run video:capture                                # build (copy app/) + captures en/es + manifest + brand
node video/render.mjs --lang en --quality draft --name acme-desk
node video/render.mjs --name acme-desk               # en + es, high → video/launch/renders/acme-desk-{en,es}.mp4
```

| Piece | Where |
|---|---|
| Scenes | `launch/compositions/hook.html`, `dashboard.html`, `tickets.html`, `finale.html` |
| Montage (starts and durations in beats) | `launch/index.html`, `launch/STORYBOARD.md` |
| Copy per language | `launch/assets/i18n.js` (section names are the app's: Dashboard/Panel, Tickets) |
| Capture | `capture/config.mjs` (build, tokens map, logo), `capture/shots.mjs`, `capture/demo-data.mjs` |
| Library | `launch/assets/lib/` (copied from the repo's `lib/` by `tools/new-video.mjs`) |

`hook.html` and `finale.html` are the template's scenes unchanged; `dashboard.html` is the template's `section.html` renamed; `tickets.html` was written for this video (list in cascade, chips toward the camera, 2D camera, click).

## Content decisions

- **What is shown:** the hook, two sections (Dashboard and Tickets) and the closing montage. Customers and the login appear only as fragments and in the montage.
- **Action moment per section:** the CSAT number in Dashboard; the ticket that gets solved in Tickets.
- **Special accent:** the chat channel's pink only appears inside the captures (channel dots and bars), never as a video accent.
- **Numbers:** 1,284 solved, 14 min first reply and 96 % CSAT come from `capture/demo-data.mjs`; the scene writes them in `PV.count` calls. Change both together.
- **No "new" chip, no "coming soon":** everything shown exists in the demo app.

## Music

`music.json` is in **placeholder** mode: `render.mjs` generates a deterministic beat at 100 BPM (kick, off-beat hats, bass, a crash every 16 beats) with the first downbeat at 0, so the example runs anywhere without downloading a track. A real video replaces it with a measured, licensed track (`skills/pv-music`): set `source`, `sha256`, `license`, `bpm` and `grid`, delete `placeholder`, and recompute the starts in `launch/index.html`.

## Maintenance

- Changing the app's markup: run `npm run video:capture -- --probe --only tickets` to list classes, fix `capture/shots.mjs`, recapture, then `hyperframes check` and snapshots of the scenes that use that capture.
- Changing the library: `node ../../tools/new-video.mjs . --lib-only` from `examples/acme-desk`.
- Render (en, high): 36.0 s, 1920×1080 @ 30, 8 of 8 measured cuts within 0 frames of a beat (`../review/report.md`).
