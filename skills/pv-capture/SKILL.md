---
name: pv-capture
description: Manual under pv-video. Capture real screens of a web app for a video, with no real data and no screen recording - build the frontend, serve it locally, intercept /api/* with a fictional account (demo-data.mjs), open each route in chrome-headless-shell with puppeteer, save 2x PNGs per language and a manifest of rectangles (screens.json/screens.js) that the scenes use to crop and frame; also rebuild the UI from an earlier commit for a before/after, and map the product's tokens and logo onto the video. Use for "captures", "screenshots of the app", "demo data", "manifest", "no target", "no mock", "earlier version of the UI", "--probe".
---

# Real captures with demo data

> Manual under `pv-video`. If something here contradicts `pv-video`, `pv-video` wins.

The screens in the video are **the real app, built**, with **fictional data** and in **the language of the render**, captured at 2× with a **manifest** that says where every element is. No server, database or integration takes part. The script is `template/capture/capture.mjs`; `template/capture/` is pre-configured for the demo app in `examples/acme-desk/app/` so you can see a working setup before adapting it to your product.

## How it works

1. **Build.** `config.buildCmd(out)` builds the frontend into `video/.cache/client` (never touches `dist/`). For Vite: `['npx', 'vite', 'build', '--outDir', out, '--emptyOutDir', '--logLevel', 'warn']`. The demo app is plain static files, so its "build" is copying `app/`.
2. **Local server** on a free port under a **demo hostname** (`app.demo.test`, resolved to 127.0.0.1 with `--host-resolver-rules`), so the app doesn't think it runs on localhost and doesn't show local-environment banners.
3. **Browser.** `chrome-headless-shell` via puppeteer (`headless: 'shell'`): Chrome's "new" headless sometimes hangs `Page.captureScreenshot` on macOS. Viewport 1920×1080, `deviceScaleFactor: 2`, `--hide-scrollbars`, `--font-render-hinting=none`, the language's locale and `LANG` (dates and numbers as your users see them), a fixed timezone.
4. **Initial state.** `evaluateOnNewDocument` freezes the date (`Date` pinned to `TODAY`, because dashboards compute "last 7 days" with `new Date()`), and writes `config.storage(lang, loggedIn)` into `localStorage` / `sessionStorage` (language, demo session token, UI state such as a collapsed sidebar).
5. **Mocks.** `setRequestInterception(true)`: every request under `config.apiPrefix` is answered with `demo.respond(pathname, searchParams, body)` from `demo-data.mjs`; `config.loginPath` is answered with `config.loginBody()`. Anything without a mock returns 404 and is logged as `! no mock: GET /api/...`.
6. **Per shot.** Go to the route, wait for a selector, run the `before` actions (open an accordion, pick a filter, click), wait for `document.fonts.ready`, inject CSS (`config.css`, plus the shot's `css`), wait `settle` ms, **measure** the `targets`, and capture (`fullPage` for scroll planes).
7. **Manifest.** `screens.json` and `screens.js` (`window.SCREENS = {...}`, because a composition can't fetch during the render) with, per shot: `file`, `fullPage`, `scale`, `viewport`, `targets` (rectangles `{x, y, w, h}` in CSS px of the document), `scrollY`, `docHeight`; plus `lang` and `account` at the top level.
8. **Brand.** `writeBrand()` copies the product's first `:root` block into `assets/brand/brand.css`, appends the `--pv-*` mapping from `config.brand.map`, and writes the logo as `assets/brand/logo.png` (an SVG is rasterized at 1024 px on a transparent background) (`pv-brand`).

One retry per shot: headless Chrome sometimes hangs on a 2× capture.

## `config.mjs`

| Field | What it is |
|---|---|
| `host` | Demo hostname (`app.demo.test`). |
| `viewport` | `{ width: 1920, height: 1080, deviceScaleFactor: 2 }` → 3840×2160 PNGs. Keep it: every crop in the scenes assumes a 1920×1080 viewport. |
| `locales` | Video language → `{ lang: 'en-US', env: 'en_US.UTF-8' }` (browser locale and `LANG`). The keys are the languages captured. |
| `timezone` | Fixed timezone for the browser. |
| `buildCmd(out)` | Command array that builds the frontend into `out`, run at the product root. |
| `apiPrefix` | Prefix of the routes that are mocked (`/api/`). |
| `routeUrl(base, route)` | How to open a route: `${base}/#/${route}` for a hash router, `${base}/${route}` for a history router. `route: null` opens the root (the login). |
| `storage(lang, loggedIn)` | `{ local: {...}, session: {...} }` written before the page loads. |
| `loginPath`, `loginBody()` | The login endpoint and its answer, so the frontend believes it signed in. |
| `css` | Injected into every capture (hide loading overlays, `caret-color: transparent`). |
| `sidebar`, `navEnd` | Selectors of the sidebar and of its last menu item. Measured **automatically on every signed-in shot** as targets `sidebar` and `navEnd`; `PV.navIntro` needs them. |
| `brand` | `{ styleCss, map, logo, fonts? }`: the CSS with the product's `:root` tokens (or `null`), video token → product token (`action: 'var(--accent)'`), the logo (SVG or PNG), and optional Google Fonts to download as local files (`{ family, file, css2, weight }`). |
| `legacyIds` | Shots also captured from an earlier version (`--legacy-ref`). |

## Defining shots (`shots.mjs`)

```js
{
  id: 'tickets', route: 'tickets', wait: '.ticket-table', settle: 300,
  probe: ['ticket', 'badge'],
  before: async (page) => { await page.click('.tabs span:nth-child(2)'); },
  css: '.sidebar{visibility:hidden!important}',   // only on -full scroll planes
  fullPage: false,
  targets: {
    head: '#view-tickets .page-head', navItem: '.nav-item[data-route="tickets"]', table: '.table-card',
    ...Object.fromEntries(range(10).map((i) => [`row${i}`, `.ticket-table tbody tr:nth-child(${i})`])),
    ...Object.fromEntries(range(10).map((i) => [`st${i}`, `.ticket-table tbody tr:nth-child(${i}) .badge`])),
    card2: '.card@1',                  // "selector@n" = the n-th match (zero-based)
  },
}
```

Conventions the scenes expect:

- **`navItem` in every section shot.** `PV.navIntro` crops the real sidebar (where the item is already active) and clicks `navItem`. `sidebar` (crop width) and `navEnd` (crop height) are measured automatically from `config.mjs`.
- **A normal shot and a `-full` one** per view that scrolls (`report` and `report-full`): the normal one for the plane with the sidebar, the `-full` one without it (`css` hides it, because a sticky sidebar gets stretched in fullPage) for the real scroll of the content.
- **Numbered targets per row/card** (`row1..n`, `card1..n`, `kpi1..n`, `st1..n` for status chips) for the fragments that fly toward the camera. Name them the same way in every similar view: the scenes are written against these names.
- **`"selector@n"` does not accept descendants**: `.row@1 .status` gives `null`. To measure a child of the n-th match, use `:nth-child(n)` on the parent (`.ticket-table tbody tr:nth-child(2) .badge`) or an `id`.
- **Hidden views stay in the DOM** in single-page apps: `.page-head` without a prefix can measure another tab's header (size 0 → `null`). Prefix with the view's container (`#view-dashboard .page-head`).
- **Whatever starts collapsed or empty** (an insights card, an accordion) is opened or filled in `before` with `page.evaluate` or a click, replicating the real markup; note in the shot why.
- **States that matter to the story** get their own shot via `before`: a row open, a filter chosen, a dialog open, a document open.
- **You don't need a target for everything.** A scene can crop a literal rectangle built from targets: `PV.crop(el, 'tickets', { x: row.x, y: row.y, w: st.x + st.w + 28 - row.x, h: row.h }, { scale: 1.3 })`. The demo's tickets scene does exactly that: a full-width table row at 1× is unreadable, so each row is cropped up to the status column and shown at 1.3×.

## Demo data (`demo-data.mjs`)

- **A fictional account** with a believable, neutral name (the demo uses "Harbor & Pine"). Invented people and companies, `.example` domains and URLs. Never a real customer, never a real person.
- **Deterministic**: indices and modulo instead of `Math.random`; `TODAY` fixed. Two captures in a row give the same screens.
- **Shapes replicate the real response** of each endpoint (read the frontend's types). If an endpoint changes shape, update it here; the `! no mock` warning tells you which one is missing.
- **Copy in every language** of the video (`pick(lang, en, es)`), coherent with the story you tell.
- Exports: `ACCOUNT`, `TODAY`, `createDemo(lang)` → `{ respond(pathname, searchParams, body) }` returning JSON or `null`.
- **The big numbers the video shows come from here** (in the demo: 1,284 solved, 14 min first reply, 96 % CSAT), and the scenes write them by hand with `PV.count`. If the data changes, change both places.

## Earlier UI (before/after)

`--legacy-ref <commit>` runs `git archive` of the commit into `video/.cache/legacy-<commit>`, links `node_modules`, builds with `config.buildCmd`, and captures only the shots in `legacyIds` with a `legacy-` prefix, with the same mocks. If the old version had a visible bug, fix it in the capture with a `legacyFix(page, account)` on the shot, so the video compares design, not bugs. `--legacy <dir>` uses an already built dist.

## Commands

```bash
node video/capture/capture.mjs                         # every language, build included
node video/capture/capture.mjs --lang en --skip-build --only dashboard,tickets
node video/capture/capture.mjs --legacy-ref f588154    # earlier UI
node video/capture/capture.mjs --probe --only tickets  # lists classes to discover selectors
VIDEO_HEADLESS=new node video/capture/capture.mjs      # "new" headless, if the shell one fails
```

Output: `launch/assets/screens/<lang>/*.png` + `screens.json` + `screens.js`, and `launch/assets/brand/` (`brand.css`, `logo.png`). `render.mjs` copies the active language to `assets/screens/current/`.

## Maintenance

| Console message | What to do |
|---|---|
| `! no mock: GET /api/x` | Add the endpoint to `demo-data.mjs` with its real shape. |
| `no target: card3, grid` | The DOM changed. Run `--probe` with the class prefix and update the selector in `shots.mjs`. A `null` target breaks the scene that uses it (`PV.rect` throws `[pv] missing target`). |
| `! pageerror: ...` | An app error with the demo data: usually a field missing in a mock. |
| Blank or cut-off capture | Raise `settle`, check `wait`, or `VIDEO_HEADLESS=new`. |
| `No :root block found in ...` | `brand.styleCss` points to a file without tokens: fix the path or set it to `null` and map values directly in `brand.map`. |

When a product view changes: re-run the capture of that view, look at the PNG, run `hyperframes check` and a snapshot of the scene that uses it.
