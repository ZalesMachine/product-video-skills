---
name: pv-brand
description: Manual under pv-video. The brand applied to the video — the --pv-* tokens (dark ground, text levels, four accents with one job each), how a product's own CSS tokens are mapped onto them (config.brand.map → assets/brand/brand.css), the accent rules, color washes per scene, type (Space Grotesk + JetBrains Mono, OFL, or your own display font), and the logo. Use for "video colors", "which font", "the logo", "tokens", "brand.css", "brand map", "color washes", "our product is light", or when a product's brand has to be brought into the video.
---

# Brand in the video

> Manual under `pv-video`. If anything here contradicts `pv-video`, `pv-video` wins.

The video's brand is not written by hand: **it comes from the product's tokens**. The video only ever reads `--pv-*` tokens (`pv.css`, `pv.js` and the scenes). `lib/theme.css` defines defaults for all of them; the capture (`pv-capture`) writes `launch/assets/brand/brand.css`, loaded after it, which copies the product's first `:root` block and maps the product's tokens onto `--pv-*` (`config.brand.map`). There isn't a single brand hex in `pv.css` or in the scenes: only `var(--pv-*)` and `color-mix()`. If a product token changes, the next render reflects it.

## Tokens

| Token | Default (`lib/theme.css`) | Use in the video |
|---|---|---|
| `--pv-ground` | `#0b0c10` | Background of every scene and of the planes. |
| `--pv-panel`, `--pv-popover` | white 5 %, `#16171c` | Cards and toasts drawn in the video (the few things that aren't captures). |
| `--pv-border` | white 10 % | Hairlines, rings, corner frames (`pv.css` uses white 12–30 % by weight). |
| `--pv-text-1`, `-70`, `-55`, `-40` | white 100/70/55/40 % | Titles, sub-lines, labels, decoration. `-40` is never text that has to be read. |
| `--pv-on-accent` | `#0b0c10` | Text on any solid accent (pills, stamps, chips). |
| `--pv-action` | `#ffd166` | **Action, CTA, success, "new"**: the New chip, a validation check, an approved stamp, the numbers that matter, the before/after sweep line, the cursor's ripple. |
| `--pv-brand` | `#9d8cff` | **Brand and authority**: the glow on the product name, the hook's pill, planes of brand-heavy sections, the sidebar's glow. |
| `--pv-data` | `#5cc8f0` | **Data and evidence**: pills of data sections (dashboards, reports, lists), charts, selections. |
| `--pv-special` | `#ff8fb1` | **One reserved concept only** (a channel, a sub-product). Never a generic "other accent". In the example it is the chat channel. |
| `--pv-danger` | `#ff6b6b` | Problems only. A launch video rarely needs it, and that's fine. |
| `--pv-font-display`, `--pv-font-mono` | Space Grotesk, JetBrains Mono | Kinetic type; technical labels. |

Rules that carry over from any good design system and hold in the video:

- **One accent per shot.** If everything is action-colored, nothing is. Each scene has one action element (the thing that matters) and the rest in white or in the section's color.
- **Action is never a large background** nor the color of running text. It goes on pills, stamps, numbers and lines.
- **Each accent keeps its job across the whole video.** Don't reuse `special` because a scene "needs another color".
- **Tints with `color-mix()`**, not hand-written `rgba()`, so they follow the token.

## Mapping a product's tokens (`config.brand.map`)

In `video/capture/config.mjs`:

```js
brand: {
  styleCss: 'src/styles/tokens.css',   // the product CSS whose first :root block holds its tokens (null = defaults only)
  map: {                               // video token → product token (or any CSS value)
    ground: 'var(--bg)', 'on-accent': 'var(--on-accent)',
    action: 'var(--accent)', brand: 'var(--brand)', data: 'var(--info)', special: 'var(--chat)', danger: 'var(--danger)',
  },
  logo: 'public/logo.svg',             // SVG or PNG → assets/brand/logo.png (SVG is rasterized at 1024 px)
  fonts: [],                           // optional extra Google Fonts, downloaded once as local files
},
```

`writeBrand()` in `capture.mjs` writes `brand.css` = the product's `:root` block + a `:root { --pv-x: … }` block from the map. Unmapped tokens keep `theme.css`. Choose the mapping by **job**, not by hue: `action` is whatever the product uses for its primary button and success; `data` is its chart/info color; `brand` its identity color. If the product has fewer than four accents, leave the rest on the defaults or map two jobs to the same color only if the product truly does that.

If the product has no tokens at all, set `styleCss: null` and write literal values in the map (`action: '#00c389'`), and say so in the video's README.

**If the product is light** (white background), the video **stays dark**: map `ground` to a dark value (or leave the default), and the light captures go in as planes over it. The washes, the glow and the kinetic type are built for a dark ground.

## Color washes per scene

Each scene defines `--c1`, `--c2`, `--c3` (the three radial washes of the background, `.wash.w1/.w2/.w3` in `pv.css`) according to its role:

| Scene type | c1 (bottom left) | c2 (top right) | c3 (bottom right) |
|---|---|---|---|
| Hook, closing | brand | data | action |
| Section about data (dashboard, reports, lists) | data | action or data | brand |
| Action-heavy section (create, approve, solve) | action | brand | data |
| Brand moment (redesign, the product name) | action | brand | action |
| Reading scene (a document, comments, a review) | brand | action | brand |
| Big announcement (drop) | data | special (if its concept) or brand | brand |

Rule: the dominant wash is the color of the section's job (data = data, action = action, brand = brand), and between neighboring scenes at least one wash changes so the cut is felt. In the example: hook `brand / data / action`, dashboard `data / action / brand`, tickets `data / brand / action`, finale `brand / action / data`.

## Type

| Font | Weight | Use |
|---|---|---|
| **Space Grotesk** (`--pv-font-display`) | 700 (titles), 600 (sub-lines) | Kinetic type in uppercase, `letter-spacing: -0.04em`, `line-height: 0.9` (`.kt` in `pv.css`). Sizes: 196 / 148 / 104 / 72 / 52 px. |
| **JetBrains Mono** (`--pv-font-mono`) | 500 | Technical labels: eyebrows (22 px, tracking 0.2em, uppercase), indices, the decoded URL, the New chip (24 px). |
| The product's font | — | Appears in the captures. Not used for the video's own text. |

Both ship in `lib/fonts/` (SIL Open Font License, fine for video; the license files sit next to them) and are declared with local `@font-face` in `theme.css` and in `index.html`: the render never depends on the network. `PV.scene` waits for `document.fonts.load` of the faces it measures with (it reads them from `--pv-font-display` and `--pv-font-mono`) before building the timeline.

The video speaks with the brand's voice; the product appears in the captures. That's why the video's type is the brand/website display font, not the product UI font. To use your own display font: put the `.woff2` (with a license that allows video) in `lib/fonts/`, declare it in `theme.css` and in `index.html`, and set `--pv-font-display`. Scenes never write `font-family` themselves: they inherit from `.scene` (the lint flags a family without an `@font-face` in the same file).

Text written by script inherits the container's font (`.scene { font-family: var(--pv-font-display) }`), so there is no serif fallback even when the text is built in JS.

## Logo

- `assets/brand/logo.png` above the product name in the hook (150 px wide for a square mark) and the closing (170 px). A wide wordmark goes at 360–420 px.
- Never recolored, never given a glow: the glow goes on the title, not on the logo.
- The product name is written in kinetic type with a brand `.glow` (`--glow: var(--pv-brand)`) and a hairline frame with technical crosses in the corners.

## Quick check

- [ ] `brand.css` generated, with the product's `:root` and the `--pv-*` map.
- [ ] No brand hex in `pv.css` or in the scenes (only `var(--pv-*)` and `color-mix`).
- [ ] Each accent keeps its one job; `special` only for its concept; action only for action/success/new; one accent per shot.
- [ ] Logo as in the product, not recolored.
- [ ] Kinetic type in the display font 700; labels in the mono 500.
- [ ] Ground dark, even if the product is light.
