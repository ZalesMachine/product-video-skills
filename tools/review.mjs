#!/usr/bin/env node
// Measures a render the way a demanding editor would, without listening to it.
//
//   node tools/review.mjs <video.mp4> <out-dir> [--music music.json] [--bpm 112 --downbeat 0.42]
//
// Writes to out-dir:
//   filmstrip.jpg   one frame every 0.5 s in a grid (the reading rhythm; runs of equal frames = stillness)
//   contact.jpg     12 frames spread over the video at 480 px (the overall look)
//   report.md       duration, hard and soft cuts, longest still stretches, loudness (LUFS, true peak,
//                   LRA) and, with the grid, how far each cut lands from the nearest beat.
// Only needs ffmpeg/ffprobe. Ported from launch-video-kit's review.py (MIT). See skills/pv-review/SKILL.md.

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const [film, out] = args;
if (!film || !out) { console.error('usage: node tools/review.mjs <video.mp4> <out-dir> [--music music.json] [--bpm N --downbeat S]'); process.exit(1); }
const arg = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
mkdirSync(out, { recursive: true });

const run = (cmd, a) => spawnSync(cmd, a, { encoding: 'utf8', maxBuffer: 1 << 28 });
const ffmpegErr = (a) => run('ffmpeg', ['-hide_banner', ...a]).stderr;

// Beat grid
let grid = null;
if (arg('--music')) {
  const m = JSON.parse(readFileSync(arg('--music'), 'utf8'));
  grid = { bpm: m.bpm, beat: m.grid?.beat ?? 60 / m.bpm, downbeat: m.grid?.first_downbeat ?? 0 };
} else if (arg('--bpm')) {
  const bpm = Number(arg('--bpm'));
  grid = { bpm, beat: 60 / bpm, downbeat: Number(arg('--downbeat') ?? 0) };
}

// Duration and streams
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height,r_frame_rate', '-of', 'json', film]).stdout;
const pj = JSON.parse(probe);
const dur = Number(pj.format.duration);
const vs = pj.streams.find((s) => s.codec_type === 'video');
const hasAudio = pj.streams.some((s) => s.codec_type === 'audio');
const fps = (() => { const [n, d] = String(vs.r_frame_rate).split('/').map(Number); return n && d ? n / d : 30; })();

// Filmstrip (2 fps) and contact sheet (12 frames)
const rows = Math.ceil((dur * 2) / 8);
run('ffmpeg', ['-v', 'error', '-y', '-i', film, '-vf', `fps=2,scale=320:-1,tile=8x${rows}`, '-frames:v', '1', join(out, 'filmstrip.jpg')]);
const step = dur / 12;
run('ffmpeg', ['-v', 'error', '-y', '-i', film, '-vf', `fps=1/${step.toFixed(3)},scale=480:-1,tile=4x3`, '-frames:v', '1', join(out, 'contact.jpg')]);

// Cuts: hard (0.28) and soft (0.08) scene changes
const scenes = (th) => {
  const s = ffmpegErr(['-i', film, '-vf', `select='gt(scene,${th})',showinfo`, '-an', '-f', 'null', '-']);
  return [...s.matchAll(/pts_time:([0-9.]+)/g)].map((m) => Number(m[1]));
};
const hard = scenes(0.28), soft = scenes(0.08);

// Still stretches: frame differences at 4 fps under a threshold
const sig = ffmpegErr(['-i', film, '-vf', 'fps=4,scale=320:-1,signalstats,metadata=print:key=lavfi.signalstats.YDIF', '-an', '-f', 'null', '-']);
const ydif = [...sig.matchAll(/YDIF=([0-9.]+)/g)].map((m) => Number(m[1]));
// The three longest stretches are listed. The threshold is a hint: the detector works at 320 px and
// doesn't see small motion (hearts, thin rings, slow drifts); a "still" stretch can be alive.
const runs = [];
let cur = 0;
ydif.forEach((v, i) => {
  if (v < 0.35) { cur += 1; return; }
  if (cur > 0) runs.push({ len: cur / 4, at: (i - cur) / 4 });
  cur = 0;
});
if (cur > 0) runs.push({ len: cur / 4, at: (ydif.length - cur) / 4 });
runs.sort((a, b) => b.len - a.len);
const top3 = runs.slice(0, 3);
const staticS = top3[0]?.len ?? 0, staticAt = top3[0]?.at ?? 0;

// Loudness
let loud = null;
if (hasAudio) {
  const e = ffmpegErr(['-i', film, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const summ = e.slice(e.lastIndexOf('Summary:'));
  const g = (re) => { const m = summ.match(re); return m ? Number(m[1]) : null; };
  loud = { integrated: g(/I:\s+(-?[0-9.]+) LUFS/), lra: g(/LRA:\s+([0-9.]+) LU/), peak: g(/Peak:\s+(-?[0-9.]+) dBFS/) };
}

// Cuts against the grid
let cutRows = [];
if (grid) {
  cutRows = hard.map((t) => {
    const k = Math.round((t - grid.downbeat) / grid.beat);
    const nearest = grid.downbeat + k * grid.beat;
    const off = t - nearest;
    return { t, beat: k, bar: k % 4 === 0, off, frames: off * fps };
  });
}

const pass = (ok) => (ok ? 'ok' : 'check');
const fmt = (n, d = 2) => (n === null || n === undefined || Number.isNaN(n) ? '—' : Number(n).toFixed(d));
const lines = [];
lines.push(`# Review · ${film}`, '');
lines.push(`| Measure | Value | Target | |`, `|---|---|---|---|`);
lines.push(`| Duration | ${fmt(dur)} s | = data-duration of the root | |`);
lines.push(`| Video | ${vs.width}×${vs.height} @ ${vs.r_frame_rate} | 1920×1080 @ 30/1 | ${pass(vs.width === 1920 && vs.height === 1080)} |`);
lines.push(`| Hard cuts | ${hard.length} | one per scene, plus the final montage | |`);
lines.push(`| Soft changes | ${soft.length} | | |`);
lines.push(`| Still stretches (3 longest, a hint) | ${top3.map((r) => `${fmt(r.len, 2)} s at ${fmt(r.at, 1)} s`).join(' · ') || '—'} | ≤ 2 beats${grid ? ` (${fmt(2 * grid.beat)} s)` : ''} except the ending | ${pass(!grid || staticS <= 2 * grid.beat || staticAt > dur - 5)} |`);
if (loud) {
  lines.push(`| Integrated loudness | ${fmt(loud.integrated, 1)} LUFS | -14 with voice; with music only, the track's own | |`);
  lines.push(`| True peak | ${fmt(loud.peak, 1)} dBTP | ≤ -1.0 | ${pass(loud.peak !== null && loud.peak <= -1.0)} |`);
  lines.push(`| LRA | ${fmt(loud.lra, 1)} LU | 1.5 to 8 | |`);
} else {
  lines.push(`| Audio | no track | | check |`);
}
lines.push('');
if (grid) {
  const bad = cutRows.filter((r) => Math.abs(r.frames) > 2);
  lines.push(`## Cuts against the grid (${grid.bpm} BPM, downbeat ${grid.downbeat} s)`, '');
  lines.push(`Off by ≤ 2 frames: ${cutRows.length - bad.length} of ${cutRows.length}. ${bad.length ? 'Check the flagged ones.' : 'All on the beat.'}`, '');
  lines.push(`| Cut (s) | Beat | Bar | Offset (s) | Frames | |`, `|---|---|---|---|---|---|`);
  for (const r of cutRows) lines.push(`| ${fmt(r.t, 3)} | ${r.beat} | ${r.bar ? 'yes' : 'no'} | ${r.off >= 0 ? '+' : ''}${fmt(r.off, 3)} | ${r.frames >= 0 ? '+' : ''}${fmt(r.frames, 1)} | ${Math.abs(r.frames) > 2 ? 'check' : ''} |`);
  lines.push('');
} else {
  lines.push(`## Hard cuts (s)`, '', hard.map((t) => fmt(t, 3)).join(', ') || 'none', '', '_Pass `--music music.json` to measure the cuts against the beat grid._', '');
}
lines.push(`## How to read it`, '');
lines.push(`- \`filmstrip.jpg\`: top to bottom is time (2 frames per second). Runs of identical frames are stillness; check whether they match the ending or a scene that ran out of ideas.`);
lines.push(`- \`contact.jpg\`: 12 frames spread over the video. Do you get the video without watching it? Does each frame hold one idea?`);
lines.push(`- A cut off the beat is usually a badly rounded \`data-start\` or an exit without the \`- 0.24\`. A long still stretch outside the ending asks for one more pill word, a fragment toward the camera or a camera move. The stillness detector compares frames at 320 px: it misses hearts, thin rings and slow drifts. Look at the stretch in the filmstrip before "fixing" it; if it moves to the eye, it's fine.`);
lines.push(`- The numbers point at problems; they don't approve anything. The visual review is in skills/pv-review/SKILL.md.`);
writeFileSync(join(out, 'report.md'), lines.join('\n') + '\n');
console.log(lines.slice(0, 12).join('\n'));
console.log(`\n→ ${join(out, 'report.md')}, filmstrip.jpg, contact.jpg`);
