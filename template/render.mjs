#!/usr/bin/env node
// Renders the video from the product repo.
//
//   node video/render.mjs [--lang en|es|all] [--prepare-only] [--quality draft|standard|high] [--name <video>]
//
// Per language: writes launch/assets/lang.js and launch/assets/music.js (the grid from music.json),
// copies that language's captures to launch/assets/screens/current/, validates with
// `hyperframes check` and renders to launch/renders/<name>-<lang>.mp4. Before that it prepares the
// music (music.json: a local source or URL verified by sha256, or a generated placeholder beat, plus
// the optional `cuts.launch` trim). Languages come from `locales` in launch/assets/i18n.js.
// Captures are made separately with `npm run video:capture`.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = fileURLToPath(new URL('./', import.meta.url));
const LAUNCH = join(ROOT, 'launch');
const HF = 'hyperframes@0.8.107';
const args = process.argv.slice(2);
const arg = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const QUALITY = arg('--quality', 'high');
const NAME = arg('--name', 'video');
const PREPARE_ONLY = args.includes('--prepare-only');

async function readMusic() {
  return JSON.parse(await readFile(join(ROOT, 'music.json'), 'utf8'));
}

async function languages() {
  const ctx = { window: {} };
  vm.runInNewContext(await readFile(join(LAUNCH, 'assets/i18n.js'), 'utf8'), ctx);
  const all = Object.keys(ctx.window.PV_I18N?.locales ?? { en: 'en-US' });
  const l = arg('--lang', 'all');
  return l === 'all' ? all : [l];
}

// A placeholder beat (kick, off-beat hats, bass, a crash every 16 beats) at the BPM of music.json,
// so a project can be built and timed before the real track is chosen. Deterministic: the same
// bpm/bars always give the same file. Never ship it: replace it with a measured track (pv-music).
function makePlaceholder(music, dest) {
  const P = 60 / music.bpm, bars = music.placeholder.bars ?? 16, end = bars * 4 * P, dur = end + 4 * P;
  const x = `mod(t,${P})`, y = `mod(t+${P / 2},${P})`, n = `floor(t/${P})`, bar = `floor(t/${4 * P})`;
  const root = `if(eq(mod(${bar},4),0),55,if(eq(mod(${bar},4),1),43.65,if(eq(mod(${bar},4),2),65.41,49)))`;
  const kick = `sin(2*PI*(44*${x}+5*(1-exp(-24*${x}))))*exp(-8*${x})*0.9`;
  const hat = `(random(0)*2-1)*exp(-${y}*80)*0.16*gte(${n},4)`;
  const bass = `sin(2*PI*${root}*t)*(1-exp(-${y}*28))*exp(-${y}*3.5)*0.32*gte(${n},4)`;
  const pad = `(sin(2*PI*2*${root}*t)+sin(2*PI*3*${root}*t)*0.6+sin(2*PI*4*${root}*t)*0.4)*0.035`;
  const crash = `(random(1)*2-1)*exp(-mod(t,${16 * P})*2.2)*0.22`;
  const expr = `(lt(t,${end})*(${kick}+${hat}+${bass}+${pad})+${crash})*0.8`;
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `aevalsrc=exprs='${expr}':s=44100:d=${dur.toFixed(3)}`,
    '-af', `afade=t=out:st=${(dur - 3 * P).toFixed(3)}:d=${(3 * P).toFixed(3)}`, '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '192k', dest], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ffmpeg could not generate the placeholder beat');
  console.log(`› music: placeholder beat at ${music.bpm} BPM, ${bars} bars (replace it with a real track: skills/pv-music)`);
}

// Music: the original track (verified by sha256) is kept at .cache/music-source.mp3 and the one the
// video uses comes from trimming it as music.json says (`cuts.launch`, optional; no trim = the whole
// track). It is only rebuilt when the track or the trim changes.
async function ensureMusic(music) {
  const cut = (music.cuts ?? {}).launch ?? null;
  const dest = join(LAUNCH, 'assets/audio/music.mp3');
  const orig = join(ROOT, '.cache/music-source.mp3');
  const stamp = join(ROOT, '.cache/music.launch.stamp.json');
  const want = JSON.stringify({ sha256: music.sha256, placeholder: music.placeholder ? { bpm: music.bpm, ...music.placeholder } : null, cut });
  const sha = async (f) => createHash('sha256').update(await readFile(f)).digest('hex');
  try { await stat(dest); if ((await readFile(stamp, 'utf8')) === want) return; } catch { /* build it */ }
  await mkdir(dirname(orig), { recursive: true });
  if (music.placeholder) {
    makePlaceholder(music, orig);
  } else {
    let ok = false;
    try { ok = (await sha(orig)) === music.sha256; } catch { /* fetch it */ }
    if (!ok) {
      console.log(`› music: ${music.title} · ${music.artist}`);
      if (music.source) {
        // Local file (tracks that can't be downloaded by URL).
        const src = music.source.replace(/^~(?=\/)/, homedir());
        try { await stat(src); } catch { throw new Error(`Music missing: copy "${music.title}" to ${src} or to video/.cache/music-source.mp3`); }
        await cp(src, orig);
      } else if (music.url) {
        const res = await fetch(music.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) throw new Error(`Could not download the music (${res.status}). Download it by hand from ${music.page} to video/.cache/music-source.mp3`);
        await writeFile(orig, Buffer.from(await res.arrayBuffer()));
      } else {
        throw new Error('music.json needs "source" (local path), "url" or "placeholder"');
      }
      if ((await sha(orig)) !== music.sha256) throw new Error('The music does not match the sha256 in music.json');
    }
  }
  await mkdir(dirname(dest), { recursive: true });
  if (!cut) {
    await cp(orig, dest);
  } else {
    // Cut between two equivalent downbeats (cut.beats = [from, to)), slightly before the hit and with
    // a short crossfade centered on the splice: the kick of the landing beat stays whole and there is no click.
    const { beat, first_downbeat: d0 } = music.grid;
    const [b0, b1] = cut.beats;
    const lead = cut.lead ?? 0.03, xf = cut.crossfade ?? 0.02;
    const t1 = d0 + b0 * beat - lead, t2 = d0 + b1 * beat - lead;
    const filter = `[0:a]atrim=end=${(t1 + xf / 2).toFixed(4)},asetpts=PTS-STARTPTS[a];` +
      `[0:a]atrim=start=${(t2 - xf / 2).toFixed(4)},asetpts=PTS-STARTPTS[b];` +
      `[a][b]acrossfade=d=${xf}:c1=qsin:c2=qsin[out]`;
    const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', orig, '-filter_complex', filter, '-map', '[out]', '-c:a', 'libmp3lame', '-b:a', '320k', dest], { stdio: 'inherit' });
    if (r.status !== 0) throw new Error('ffmpeg could not trim the music');
    console.log(`› music trimmed: beats ${b0}–${b1 - 1} removed (${(t2 - t1).toFixed(3)} s)`);
  }
  await writeFile(stamp, want);
}

async function prepare(lang, music) {
  const src = join(LAUNCH, 'assets/screens', lang);
  try { await stat(join(src, 'screens.js')); } catch { throw new Error(`Captures missing for ${lang}: run npm run video:capture`); }
  const cur = join(LAUNCH, 'assets/screens/current');
  await rm(cur, { recursive: true, force: true });
  await cp(src, cur, { recursive: true });
  await writeFile(join(LAUNCH, 'assets/lang.js'), `window.PV_LANG = ${JSON.stringify(lang)};\n`);
  // The beat grid the scenes use (PV.BPM, PV.DOWNBEAT0) comes from music.json.
  const grid = { bpm: music.bpm, first_downbeat: music.grid?.first_downbeat ?? 0, beat: music.grid?.beat ?? 60 / music.bpm };
  await writeFile(join(LAUNCH, 'assets/music.js'), `window.PV_MUSIC = ${JSON.stringify(grid)};\n`);
}

function hf(...cmd) {
  const r = spawnSync('npx', ['--yes', HF, ...cmd], { cwd: LAUNCH, stdio: 'inherit', env: { ...process.env, HYPERFRAMES_SKIP_SKILLS: '1' } });
  if (r.status !== 0) throw new Error(`hyperframes ${cmd[0]} failed`);
}

const music = await readMusic();
await ensureMusic(music);
for (const lang of await languages()) {
  await prepare(lang, music);
  console.log(`› language ${lang} ready`);
  if (PREPARE_ONLY) continue;
  hf('check');
  hf('render', '--quality', QUALITY, '--fps', '30', '--output', `renders/${NAME}-${lang}.mp4`);
}
