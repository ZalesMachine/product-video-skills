#!/usr/bin/env node
// Sets up a video project inside a product repo, or refreshes its shared library.
//
//   node tools/new-video.mjs <product-dir>              # copies template/ to <product-dir>/video + lib/
//   node tools/new-video.mjs <product-dir> --lib-only   # only refreshes video/launch/assets/lib/
//
// The library (pv.css, pv.js, theme.css, fonts) is copied, not linked: the product repo commits its
// own copy, so a render never depends on where this repo lives. Run --lib-only after updating it here.

import { cp, mkdir, readdir, rename, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith('--'));
if (!target) { console.error('usage: node tools/new-video.mjs <product-dir> [--lib-only]'); process.exit(1); }
const product = resolve(target);
const video = join(product, 'video');
const libOnly = args.includes('--lib-only');
const exists = async (p) => { try { await stat(p); return true; } catch { return false; } };

if (!libOnly) {
  if (await exists(video)) { console.error(`${video} already exists. Use --lib-only to refresh the library.`); process.exit(1); }
  await cp(join(HERE, 'template'), video, { recursive: true });
  await rename(join(video, 'gitignore'), join(video, '.gitignore'));
  console.log(`› template → ${video}`);
} else if (!(await exists(video))) {
  console.error(`${video} does not exist. Run without --lib-only first.`); process.exit(1);
}

const lib = join(video, 'launch/assets/lib');
await mkdir(join(lib, 'fonts'), { recursive: true });
for (const f of ['pv.css', 'pv.js', 'theme.css']) await cp(join(HERE, 'lib', f), join(lib, f));
for (const f of await readdir(join(HERE, 'lib/fonts'))) await cp(join(HERE, 'lib/fonts', f), join(lib, 'fonts', f));
console.log(`› lib → ${lib}`);

if (!libOnly) {
  console.log(`
Next steps (skills/pv-video/SKILL.md has the whole flow):

  cd ${product}
  npm i -D puppeteer

Add to the product's package.json:

  "video:capture": "node video/capture/capture.mjs",
  "video:preview": "node video/render.mjs --lang en --prepare-only && cd video/launch && HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@0.8.107 preview",
  "video:render": "node video/render.mjs",
  "video": "npm run video:capture && npm run video:render"

Then fill in video/capture/config.mjs, shots.mjs and demo-data.mjs for your app (the defaults
capture examples/acme-desk), measure your track into video/music.json, and write the storyboard.`);
}
