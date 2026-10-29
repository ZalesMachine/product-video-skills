# Lessons

What was approved and what was rejected in the videos made with this method, plus the rules that cost a round. Newer entries win. Add your verdict at the end, in your team's words.

## Direction

| Approved | Rejected |
|---|---|
| Showing the whole app, section by section, with the real menu names | A "benefits" tour without screens, or screens without naming them |
| What's new with a "New" chip; what doesn't exist yet with a "Coming soon" tag and generic drawn cards | Mixing what exists with what doesn't, or drawing UI that doesn't exist as if it were real |
| A redesign shown as one more feature, with the earlier version rebuilt from the previous commit and an action line that transforms it | "Before" / "After" labels |
| Each "coming soon" item with 8 beats to be read | Four items on a single screen |
| Short copy that says what's on screen ("Solved in a click") | Copy the animation already says, or abstract copy ("supercharge your business") |
| The URL in the hook and in the ending | An ending with nowhere to go |

## Image

| Approved | Rejected |
|---|---|
| The product's dark ground with brand-colored washes that change per scene, a technical grid and a vignette | Flat black, or generic neon gradients |
| Big kinetic type in a display font at 700, uppercase, on the scene, without plates | Opaque plates, frames, corner labels, scene numbering |
| Pills that change word on each hit, with their own width and color | Bullet lists; text that appears and stays |
| Real screens as 3D planes with a glow in the section's color, and cropped fragments flying toward the camera | The whole app small as content; UI redrawn by hand |
| One action accent per shot: check, stamp, number, line | Action color on backgrounds, in running text, on several elements at once |
| The special accent only for its one concept | The special accent as "another accent" |
| The logo as it is in the product; the glow goes on the title | A recolored logo, or a logo with glow |

## Motion

| Approved | Rejected |
|---|---|
| Velocity-matched cuts: zoom-through as the main cut, whip and vertical cut as accents, a flash on the drop | The same cut every time, or a different one per scene; crossfades |
| Entrances with blur that resolves and long tails (`expo.out`, `power4.out`) | Bounces, `back.out`, elastic, confetti |
| The real sidebar, enlarged, with a click on the section when entering each one | Titles that appear out of nowhere without saying where we are |
| A cursor that travels, squashes and fires an action ripple on clicks | A cursor that appears already on the button |
| A slow 2D camera on the breakdown (1.2 s, `power3.inOut`) | A nervous camera in the reading scene |
| A final montage of one shot per beat with a short flash | An ending on the last screen standing still |

## Music

| Approved | Rejected |
|---|---|
| A track with structure (16-beat phrases, breakdown, drop 2), measured and saved in `music.json` | Choosing the music after animating |
| Scenes in whole beats starting on bars; the reading scene on the breakdown; the big announcement on the drop | Scenes that last "as long as the text takes" |
| Fade to black with the track's natural fade-out | Cutting the music abruptly |

## Rules that cost a round

- Scenes are built with their clip hidden during the render: `offsetWidth` and `getBoundingClientRect` return 0. Measure with `PV.textWidth` (canvas), with the manifest, or position in CSS.
- A `tl.set` at t=0 may not apply in the render: the start state goes in a `gsap.set` while building or in the `fromTo`.
- Chrome's "new" headless sometimes hangs `Page.captureScreenshot` on macOS, even on an empty page: use `chrome-headless-shell` and retry once per capture.
- `npx hyperframes` without `HYPERFRAMES_SKIP_SKILLS=1` writes into the user's global skills.
- `hyperframes beats` reads a track in double time (190 for 95) and its phase alternates with the off-beat: use `tools/beat-grid.mjs` (or `beat-grid.py` with librosa) and check by ear. The kick low-passed + the grid with the most kick per beat gives the same grid as librosa (same BPM, downbeat within one frame, same breakdown and drop).
- Long lines in the other language break the ending if the size is fixed: compute `fit` with `PV.textWidth` (≤ 1700 px).
- `fullPage` captures with a sticky sidebar stretch it: hide it with CSS in the `-full` shot and use the normal shot for the sidebar.
- A visible bug in the earlier version is fixed in the capture (`legacyFix`), because the video compares design, not bugs.
- Dashboards compute "last N days" with `new Date()`: freeze the date in the capture or the screens change every day.
- Music from video platforms can't be downloaded by URL: `music.json` points to the local file and verifies its sha256; on another machine, copy it there.
- A feature that exists but nobody uses yet doesn't go in the video.
- The video's font is the brand's (the website's), not necessarily the product's: the video speaks with the brand's voice, the product shows up in the captures.
- The manifest's `"selector@n"` doesn't accept descendants (`.row@1 .status` gives `null`): to measure a child of the n-th match use `:nth-child(n)` on the parent.
- Hidden views of a single-page app stay in the DOM: `.page-head` without a prefix measures another view's element (size 0 → `null`). Prefix with the view's container (`#view-x .page-head`).
- Homebrew's ffmpeg doesn't ship the `drawtext` filter: `tools/contact-sheet.sh` detects it and builds the sheet without text, printing the times.
- A `font-family` written in a scene's CSS triggers `font_family_without_font_face` even if the `@font-face` is in `index.html`: inherit from `.scene` or use `var(--pv-font-display)`.
- The lint warns `duplicate_media_discovery_risk` for every repeated `<img>` of the same capture. It's inherent to the fragment language; don't "fix" it.
- `PV.words` words inside their mask can peek before their `rise` if the block is tight against other text: keep the container at `opacity: 0` until its beat.
- `review.mjs`'s stillness detector misses hearts, thin rings and slow drifts: it's a hint. Chasing the number leads to tweaks that don't change what you see; look at the stretch in the filmstrip before touching it.
- When the track changes, update every place that holds the grid (`music.json`, and any hard-coded BPM in comments or constants). In the template the grid comes only from `music.js`.
- A full-width table row at 1× has ~15 px text and doesn't read in the video: crop it with a literal rect up to the column that matters and scale it ≥ 1.3×; isolate the row with a 2D camera for the click.
- A placeholder beat lets you build and time scenes before the track is chosen, but the structure (breakdown, drop) comes from the real track: measure it before the storyboard is approved.

## Verdicts

| Date | Video | Approved | Rejected |
|---|---|---|---|
| — | examples/acme-desk · demo, 0:36, en + es, placeholder beat | Reference build, no team verdict: hook with orbiting fragments, dashboard with big numbers and fragments toward the camera, tickets in cascade with a 2D camera click, per-beat finale with lockup and URL. | — |
