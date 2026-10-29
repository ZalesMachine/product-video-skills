#!/usr/bin/env node
// Captures the product's screens for the video, without real data.
//
//   node video/capture/capture.mjs [--lang en|es|all] [--skip-build] [--only id,id] [--probe]
//                                  [--legacy-ref <commit>] [--legacy <dir>]
//
// 1. Builds the frontend into video/.cache/client (config.buildCmd; never touches dist/).
// 2. Serves it on a local port under a demo hostname and opens chrome-headless-shell (puppeteer).
// 3. Intercepts every /api/* and answers with demo-data.mjs: the real server and integrations
//    take no part.
// 4. Saves 2x PNGs per language to video/launch/assets/screens/<lang>/ plus a manifest
//    (screens.json + screens.js) with the rectangle of every element the video crops or frames.
// 5. Writes the product's tokens and logo to video/launch/assets/brand/.
//
// What to capture: shots.mjs. How to build/serve/brand: config.mjs. Data: demo-data.mjs.
// Manual: skills/pv-capture/SKILL.md (product-video-skills).

import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import { existsSync, mkdirSync, symlinkSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { CONFIG } from './config.mjs';
import { SHOTS } from './shots.mjs';
import { createDemo, ACCOUNT, TODAY } from './demo-data.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
let CLIENT_DIR = join(ROOT, 'video/.cache/client');
const SCREENS_DIR = join(ROOT, 'video/launch/assets/screens');
const BRAND_DIR = join(ROOT, 'video/launch/assets/brand');
const VIEW = CONFIG.viewport;
const HOST = CONFIG.host;

const args = process.argv.slice(2);
const arg = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const LANGS = (() => { const l = arg('--lang', 'all'); return l === 'all' ? Object.keys(CONFIG.locales) : [l]; })();
const ONLY = arg('--only', '')?.split(',').filter(Boolean) ?? [];
const PROBE = args.includes('--probe');
// --legacy-ref <commit>: rebuilds the product at that commit (git archive + build in
// video/.cache/legacy-<commit>, without touching the repo) and captures its screens for a
// before/after. The PNGs are saved as legacy-<id>.png. --legacy <dir> uses an already built dist.
const LEGACY_REF = arg('--legacy-ref', '');
let LEGACY = arg('--legacy', '');
const PREFIX = LEGACY || LEGACY_REF ? 'legacy-' : '';
// chrome-headless-shell: Chrome for Testing's "new" headless sometimes hangs on
// Page.captureScreenshot on macOS, even on an empty page. VIDEO_HEADLESS=new uses it anyway.
const HEADLESS = process.env.VIDEO_HEADLESS === 'new' ? true : 'shell';

// ─── Build + static server ─────────────────────────────────────────────────
function run(cmd, cwd, what) {
  const r = spawnSync(cmd[0], cmd.slice(1), { cwd, stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`${what} failed`);
}

function buildLegacy(ref) {
  const dir = join(ROOT, `video/.cache/legacy-${ref}`);
  const dist = join(dir, 'dist-client');
  if (existsSync(join(dist, 'index.html'))) return dist;
  console.log(`› rebuilding the product at ${ref} → video/.cache/legacy-${ref}`);
  mkdirSync(dir, { recursive: true });
  run(['sh', '-c', `git archive ${ref} | tar -x -C "${dir}"`], ROOT, `git archive ${ref}`);
  if (!existsSync(join(dir, 'node_modules')) && existsSync(join(ROOT, 'node_modules'))) symlinkSync(join(ROOT, 'node_modules'), join(dir, 'node_modules'));
  run(CONFIG.buildCmd(dist), dir, 'build of the earlier version');
  return dist;
}

function buildClient() {
  console.log('› build → video/.cache/client');
  run(CONFIG.buildCmd(CLIENT_DIR), ROOT, 'build');
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff' };
async function serveStatic() {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    let file = normalize(join(CLIENT_DIR, decodeURIComponent(url.pathname)));
    if (!file.startsWith(CLIENT_DIR)) { res.writeHead(403).end(); return; }
    try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); } catch { file = join(CLIENT_DIR, 'index.html'); }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' }).end(body);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { server, port: server.address().port };
}

// ─── Brand: the product's tokens mapped onto --pv-*, plus the logo ─────────
async function writeBrand() {
  const b = CONFIG.brand ?? {};
  await mkdir(BRAND_DIR, { recursive: true });
  let root = '';
  if (b.styleCss) {
    const css = await readFile(join(ROOT, b.styleCss), 'utf8');
    const m = css.match(/:root\s*\{[\s\S]*?\n\}/);
    if (!m) throw new Error(`No :root block found in ${b.styleCss}`);
    root = m[0];
  }
  const map = Object.entries(b.map ?? {}).map(([k, v]) => `  --pv-${k}: ${v};`).join('\n');
  // Optional extra fonts (Google Fonts css2 specs), downloaded once as local files.
  const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
  const faces = [];
  for (const f of b.fonts ?? []) {
    const dest = join(BRAND_DIR, 'fonts', f.file);
    await mkdir(join(BRAND_DIR, 'fonts'), { recursive: true });
    try { await stat(dest); } catch {
      const sheet = await (await fetch(`https://fonts.googleapis.com/css2?family=${f.css2}&display=block`, { headers: { 'User-Agent': UA } })).text();
      const latin = sheet.split('/* latin */')[1] ?? sheet;
      const url = latin.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
      if (!url) throw new Error(`Could not resolve the font ${f.family}`);
      await writeFile(dest, Buffer.from(await (await fetch(url)).arrayBuffer()));
      console.log(`  ✓ font ${f.family}`);
    }
    faces.push(`@font-face { font-family: '${f.family}'; src: url('fonts/${f.file}') format('woff2'); font-weight: ${f.weight}; font-style: normal; font-display: block; }`);
  }
  await writeFile(join(BRAND_DIR, 'brand.css'),
    `/* Generated by video/capture/capture.mjs from ${b.styleCss ?? 'config.brand.map'}. Do not edit by hand. */\n` +
    `${faces.join('\n')}\n\n${root}\n\n/* The video's tokens, mapped from the product's (config.brand.map). */\n:root {\n${map}\n}\n`);
  if (b.logo) await writeLogo(join(ROOT, b.logo), join(BRAND_DIR, 'logo.png'));
  console.log('› brand → video/launch/assets/brand/ (brand.css, logo.png)');
}

/** Copies a PNG logo, or rasterizes an SVG one at 1024 px on a transparent background. */
async function writeLogo(src, dest) {
  if (extname(src).toLowerCase() === '.png') { await writeFile(dest, await readFile(src)); return; }
  const svg = (await readFile(src)).toString('base64');
  const browser = await puppeteer.launch({ headless: HEADLESS });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1200 });
    await page.setContent(`<html><body style="margin:0;background:transparent"><img id="l" src="data:image/svg+xml;base64,${svg}" style="display:block;width:1024px;height:auto"></body></html>`);
    await page.waitForFunction(() => document.getElementById('l').complete);
    await (await page.$('#l')).screenshot({ path: dest, omitBackground: true });
  } finally { await browser.close(); }
}

// ─── Capture ───────────────────────────────────────────────────────────────
async function openPage(browser, base, lang, demo, { loggedIn }) {
  const page = await browser.newPage();
  await page.setViewport(VIEW);
  await page.emulateTimezone(CONFIG.timezone);
  const storage = CONFIG.storage(lang, loggedIn, ACCOUNT);
  await page.evaluateOnNewDocument((storage, today) => {
    // Frozen date: views that compute "last N days" with new Date() stay stable.
    const fixed = new Date(`${today}T15:00:00`).getTime();
    const RealDate = Date;
    // eslint-disable-next-line no-global-assign
    Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [fixed])); } static now() { return fixed; } };
    try {
      for (const [k, v] of Object.entries(storage.local ?? {})) localStorage.setItem(k, v);
      for (const [k, v] of Object.entries(storage.session ?? {})) sessionStorage.setItem(k, v);
    } catch { /* noop */ }
  }, storage, TODAY);
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.origin === base && url.pathname.startsWith(CONFIG.apiPrefix)) {
      if (url.pathname === CONFIG.loginPath) {
        req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(CONFIG.loginBody(ACCOUNT)) });
        return;
      }
      let reqBody = {};
      try { reqBody = JSON.parse(req.postData() || '{}'); } catch { /* no body */ }
      const body = demo.respond(url.pathname, url.searchParams, reqBody);
      if (body === null) {
        console.warn(`  ! no mock: ${req.method()} ${url.pathname}`);
        req.respond({ status: 404, contentType: 'application/json', body: '{"error":"no demo mock"}' });
        return;
      }
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      return;
    }
    req.continue();
  });
  page.on('pageerror', (e) => console.warn(`  ! pageerror: ${e.message}`));
  return page;
}

async function measure(page, targets) {
  return page.evaluate((targets) => {
    const out = {};
    for (const [k, spec] of Object.entries(targets)) {
      // "selector@n" = the n-th match (zero-based); without @ = the first one.
      const at = spec.lastIndexOf('@');
      const sel = at > 0 ? spec.slice(0, at) : spec;
      const el = at > 0 ? document.querySelectorAll(sel)[Number(spec.slice(at + 1))] : document.querySelector(sel);
      if (!el) { out[k] = null; continue; }
      const r = el.getBoundingClientRect();
      out[k] = r.width && r.height ? { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) } : null;
    }
    return { targets: out, scrollY: Math.round(scrollY), docHeight: document.documentElement.scrollHeight };
  }, targets);
}

/** Lists elements whose classes start with the given prefixes (to discover selectors). */
async function probe(page, prefixes) {
  return page.evaluate((prefixes) => {
    const seen = new Map();
    for (const el of document.querySelectorAll('[class]')) {
      const cls = [...el.classList].filter((c) => prefixes.some((p) => c.startsWith(p)));
      if (!cls.length) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      const key = `${el.tagName.toLowerCase()}.${cls.join('.')}`;
      const prev = seen.get(key);
      if (prev) { prev.n++; continue; }
      seen.set(key, { n: 1, rect: `${Math.round(r.left)},${Math.round(r.top + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)}`, text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50) });
    }
    return [...seen.entries()].map(([k, v]) => `${k} ×${v.n} @${v.rect} “${v.text}”`);
  }, prefixes);
}

async function shoot(browser, base, lang, demo, shot, outDir) {
  const page = await openPage(browser, base, lang, demo, { loggedIn: shot.route !== null });
  await page.goto(CONFIG.routeUrl(base, shot.route), { waitUntil: 'networkidle0' });
  await page.waitForSelector(shot.wait, { visible: true, timeout: 15000 });
  if (shot.before) await shot.before(page);
  if (PREFIX && shot.legacyFix) await shot.legacyFix(page, ACCOUNT);   // fix visible bugs of the earlier version
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: `${CONFIG.css ?? ''} ${shot.css ?? ''}` });
  await new Promise((r) => setTimeout(r, shot.settle ?? 300));
  if (PROBE && shot.probe) {
    console.log(`  ── probe ${lang}/${shot.id}`);
    for (const line of await probe(page, shot.probe)) console.log(`     ${line}`);
  }
  // Always, on signed-in shots: the sidebar and its last item (to crop the navigation).
  const auto = shot.route ? { ...(CONFIG.sidebar ? { sidebar: CONFIG.sidebar } : {}), ...(CONFIG.navEnd ? { navEnd: CONFIG.navEnd } : {}) } : {};
  const geo = await measure(page, { ...auto, ...(shot.targets ?? {}) });
  await page.screenshot({ path: join(outDir, `${PREFIX}${shot.id}.png`), fullPage: !!shot.fullPage });
  await page.close();
  const missing = Object.entries(geo.targets).filter(([, v]) => !v).map(([k]) => k);
  console.log(`  ✓ ${lang}/${PREFIX}${shot.id}${shot.fullPage ? ` (doc ${geo.docHeight}px)` : ''}${missing.length ? `  · no target: ${missing.join(', ')}` : ''}`);
  return { id: `${PREFIX}${shot.id}`, file: `${PREFIX}${shot.id}.png`, fullPage: !!shot.fullPage, scale: VIEW.deviceScaleFactor, viewport: { w: VIEW.width, h: VIEW.height }, ...geo };
}

async function main() {
  if (LEGACY_REF) LEGACY = buildLegacy(LEGACY_REF);
  if (LEGACY) CLIENT_DIR = LEGACY;
  else if (!args.includes('--skip-build')) buildClient();
  await writeBrand();
  const { server, port } = await serveStatic();
  const base = `http://${HOST}:${port}`;
  const launch = (lang) => puppeteer.launch({
    headless: HEADLESS, protocolTimeout: 120_000,
    // Browser locale = video language: dates in <input type=date> and toLocaleString().
    env: { ...process.env, LANG: CONFIG.locales[lang].env },
    args: ['--hide-scrollbars', '--font-render-hinting=none', `--lang=${CONFIG.locales[lang].lang}`, `--host-resolver-rules=MAP ${HOST} 127.0.0.1`],
  });
  let browser = null;
  try {
    for (const lang of LANGS) {
      await browser?.close();
      browser = await launch(lang);
      const outDir = join(SCREENS_DIR, lang);
      await mkdir(outDir, { recursive: true });
      const manifestPath = join(outDir, 'screens.json');
      let manifest = {};
      try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); } catch { /* first run */ }
      const demo = createDemo(lang);
      console.log(`› capturing (${lang}) at ${base}`);
      for (const shot of SHOTS) {
        if (ONLY.length && !ONLY.includes(shot.id)) continue;
        if (PREFIX && !CONFIG.legacyIds.includes(shot.id)) continue;
        // Headless Chrome sometimes hangs on a 2x capture: one retry is enough.
        try {
          manifest[PREFIX + shot.id] = await shoot(browser, base, lang, demo, shot, outDir);
        } catch (e) {
          console.warn(`  ! ${shot.id}: ${e.message.split('\n')[0]} · retrying`);
          manifest[PREFIX + shot.id] = await shoot(browser, base, lang, demo, shot, outDir);
        }
      }
      const full = { ...manifest, lang, account: ACCOUNT };
      await writeFile(manifestPath, JSON.stringify(full, null, 2));
      // The composition reads it as a script (no fetch during render).
      await writeFile(join(outDir, 'screens.js'), `window.SCREENS = ${JSON.stringify(full)};\n`);
      console.log(`› manifest → video/launch/assets/screens/${lang}/screens.json`);
    }
  } finally {
    await browser?.close();
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
