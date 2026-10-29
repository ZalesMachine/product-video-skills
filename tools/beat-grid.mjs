#!/usr/bin/env node
// Measures the beat grid of a track without Python: only Node and ffmpeg.
//
//   node tools/beat-grid.mjs <audio.mp3> [--bpm 95] [--downbeat 0.651] [--phrase 16] [--json]
//
// Decodes the audio to mono 8 kHz PCM with ffmpeg, keeps the kick (low-pass ~150 Hz),
// builds an onset envelope and:
//   1. detects the tempo between 70 and 150 BPM (the grid with the most kick per beat; or --bpm)
//      and refines it with the grid that lines up the most kicks,
//   2. finds the phase (first downbeat) with the most kick on the "1" of the bar,
//   3. computes RMS energy per phrase (to locate the breakdown and the drop) and candidate fills.
// Prints a block ready to paste into music.json. Validated against librosa on a 95 BPM
// tech-house track: same BPM, downbeat within one frame, same breakdown and drop. See skills/pv-music.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename } from 'node:path';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--') && !/^[0-9.]+$/.test(a));
if (!file) { console.error('usage: node tools/beat-grid.mjs <audio> [--bpm N] [--downbeat S] [--phrase 16] [--json]'); process.exit(1); }
const arg = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const BPM_HINT = arg('--bpm') ? Number(arg('--bpm')) : null;
const DOWNBEAT = arg('--downbeat') ? Number(arg('--downbeat')) : null;
const PHRASE = Number(arg('--phrase') ?? 16);
const JSON_OUT = args.includes('--json');
const path = file.replace(/^~(?=\/)/, homedir());

// ── Mono PCM 8 kHz, float32 ─────────────────────────────────────────────────
const SR = 8000;
const dec = spawnSync('ffmpeg', ['-v', 'error', '-i', path, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
if (dec.status !== 0) { console.error(dec.stderr.toString()); process.exit(1); }
const y = new Float32Array(dec.stdout.buffer, dec.stdout.byteOffset, dec.stdout.length / 4);
const duration = y.length / SR;

// ── Kick: moving-average low-pass (~150 Hz) → RMS per hop → onsets ──────────
const K = 27, HOP = 40;                              // 27 samples ≈ 3.4 ms; hop = 5 ms
const lp = new Float32Array(y.length);
let acc = 0;
for (let i = 0; i < y.length; i++) { acc += y[i]; if (i >= K) acc -= y[i - K]; lp[i] = acc / K; }
const frames = Math.floor(lp.length / HOP);
const e = new Float32Array(frames);
for (let f = 0; f < frames; f++) { let s = 0; for (let i = f * HOP; i < (f + 1) * HOP; i++) s += lp[i] * lp[i]; e[f] = Math.sqrt(s / HOP); }
const onset = new Float32Array(frames);
for (let f = 1; f < frames; f++) onset[f] = Math.max(0, Math.log1p(e[f] * 80) - Math.log1p(e[f - 1] * 80));
// Full-band RMS per hop (for the energy per phrase)
const rms = new Float32Array(frames);
for (let f = 0; f < frames; f++) { let s = 0; for (let i = f * HOP; i < (f + 1) * HOP; i++) s += y[i] * y[i]; rms[f] = Math.sqrt(s / HOP); }

const frameAt = (t) => Math.min(frames - 1, Math.max(0, Math.round((t * SR) / HOP) - 1));
const peakAround = (f, w = 3) => { let m = 0; for (let i = Math.max(0, f - w); i <= Math.min(frames - 1, f + w); i++) m = Math.max(m, onset[i]); return m; };
/** Sum of kick onsets on a grid (bpm, phase) between t0 and t1. Higher = better aligned. */
const score = (bpm, phase, t0 = 0, t1 = Math.min(duration, 125)) => {
  const beat = 60 / bpm; let s = 0;
  for (let t = phase; t < t1; t += beat) if (t >= t0) s += peakAround(frameAt(t));
  return s;
};

// ── 1. BPM ──────────────────────────────────────────────────────────────────
// For each tempo between 70 and 150, the best phase and the MEAN kick per beat of the grid with a
// narrow window (±5 ms). The real tempo lands a kick on almost every beat; double time drops to half
// because the off-beats have no kick, and unrelated tempos don't line up. Outside 70–150 the result
// is almost always double or half of what you hear: that's what --bpm is for.
const meanScore = (bpm, phase, w, t0 = 0, t1 = Math.min(duration, 125)) => {
  const beat = 60 / bpm; let s = 0, n = 0;
  for (let t = phase; t < t1; t += beat) if (t >= t0) { s += peakAround(frameAt(t), w); n++; }
  return n ? s / n : 0;
};
let bpm;
if (BPM_HINT) bpm = BPM_HINT;
else {
  let best = { s: -1, bpm: 120 };
  for (let b = 70; b <= 150; b += 0.25) {
    const beat = 60 / b; let m = -1;
    for (let ph = 0; ph < beat; ph += 0.006) m = Math.max(m, meanScore(b, ph, 1));
    if (m > best.s) best = { s: m, bpm: b };
  }
  bpm = best.bpm;
}
if (!BPM_HINT) { // Fine: the grid that lines up the most kicks, ±0.5 BPM around it.
  let best = { s: -1, bpm }; const beat0 = 60 / bpm;
  for (let b = bpm - 0.5; b <= bpm + 0.5; b += 0.002) { let m = -1; for (let ph = 0; ph < beat0; ph += 0.004) m = Math.max(m, score(b, ph)); if (m > best.s) best = { s: m, bpm: b }; }
  bpm = Math.round(best.bpm * 1000) / 1000;
}
const beat = 60 / bpm;

// ── 2. Beat phase and bar phase ─────────────────────────────────────────────
// a) Beat phase: the one that lines up the most kick in the full section (10–60 s), refined to 1 ms.
// b) Bar and phrase phase: the biggest energy change in the track (the breakdown or the drop) falls
//    on a phrase start. Take the beat with the largest RMS jump as a multiple of 16; the first
//    downbeat sits in the same class modulo 16 beats. This resolves the half-beat ambiguity (tracks
//    with a kick on every eighth) and which beat is the "1" of the bar.
let phase, anchor = null;
if (DOWNBEAT !== null) phase = DOWNBEAT;
else {
  let best = { s: -1, ph: 0 };
  for (let ph = 0; ph < beat; ph += 0.004) { const v = score(bpm, ph, 10, 60); if (v > best.s) best = { s: v, ph }; }
  for (let ph = best.ph - 0.006; ph <= best.ph + 0.006; ph += 0.001) { const v = score(bpm, ph, 10, 60); if (v > best.s) best = { s: v, ph }; }
  const ph0 = best.ph;
  const n = Math.floor((duration - ph0) / beat);
  const eb = []; // mean RMS per beat
  for (let k = 0; k < n; k++) { let s = 0, c = 0; for (let f = frameAt(ph0 + k * beat); f < frameAt(ph0 + (k + 1) * beat); f++) { s += rms[f]; c++; } eb.push(c ? s / c : 0); }
  // Section change: 4 beats before vs 4 beats after, not counting the edge beat, plus half a point
  // if that beat is a hit (the new section's downbeat sounds loud and then the bass drops out).
  // The first 5 s and the last 12 s are excluded (the intro and the fade are not section changes).
  let kStar = 0, dMax = -1;
  const avg = (a, b) => { let s = 0, c = 0; for (let i = a; i <= b; i++) if (eb[i] !== undefined) { s += eb[i]; c++; } return c ? s / c : 0; };
  for (let k = Math.max(5, Math.ceil(5 / beat)); k < n - Math.max(5, Math.ceil(12 / beat)); k++) {
    const before = avg(k - 4, k - 1), after = avg(k + 1, k + 4);
    const hit = after < before ? Math.max(0, eb[k] - after) : Math.max(0, eb[k] - before);
    const d = Math.abs(after - before) + 0.5 * hit;
    if (d > dMax) { dMax = d; kStar = k; }
  }
  const PH = 16;
  phase = Math.round((ph0 + (kStar % PH) * beat) * 1000) / 1000;
  anchor = { t: Math.round((ph0 + kStar * beat) * 1000) / 1000, beat: kStar - (kStar % PH) };
}

// ── 3. Phrases, energy, fills ───────────────────────────────────────────────
const nBeats = Math.floor((duration - phase) / beat) + 1;
const phrases = []; for (let k = 0; k < nBeats; k += PHRASE) phrases.push(Math.round((phase + k * beat) * 1000) / 1000);
const energy = phrases.map((t0, i) => {
  const t1 = phrases[i + 1] ?? duration; let s = 0, n = 0;
  for (let f = frameAt(t0); f < frameAt(t1); f++) { s += rms[f]; n++; }
  return n ? s / n : 0;
});
const emax = Math.max(...energy) || 1;
const energyRel = energy.map((v) => Math.round((v / emax) * 100) / 100);
const strengths = []; for (let k = 0; k < nBeats; k++) strengths.push(peakAround(frameAt(phase + k * beat)));
const fills = [];
for (let k = 4; k < nBeats - 4; k++) {
  const neigh = [...strengths.slice(k - 4, k), ...strengths.slice(k + 1, k + 5)].sort((a, b) => a - b);
  const med = neigh[Math.floor(neigh.length / 2)];
  if (strengths[k] > 1.8 * med && strengths[k] > 0.02) fills.push(k);
}
const sha = createHash('sha256').update(readFileSync(path)).digest('hex');

const out = {
  file: basename(path), duration_s: Math.round(duration * 1000) / 1000, sha256: sha, bpm,
  grid: {
    beat: Math.round(beat * 1e6) / 1e6, first_downbeat: phase,
    note: `Measured with tools/beat-grid.mjs (low-passed kick, Node + ffmpeg). Bar = 4 beats. Candidate fills at beats ${JSON.stringify(fills.slice(0, 8))}. Fill in: breakdown (beats and seconds), drop 2, where it fades out.`,
    phrases_s: phrases,
  },
  energy_by_phrase: energyRel, fills_candidates: fills,
};
if (JSON_OUT) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }

console.log(`Track: ${out.file} · ${duration.toFixed(2)} s · sha256 ${sha.slice(0, 12)}…`);
console.log(`BPM: ${bpm.toFixed(3)}${BPM_HINT ? ' (fixed)' : ''}  (1 beat = ${beat.toFixed(6)} s, 1 bar = ${(4 * beat).toFixed(3)} s)`);
console.log(`First downbeat: ${phase.toFixed(3)} s ${DOWNBEAT !== null ? '(fixed)' : `(kick phase; bar and phrase anchored on the biggest energy change, at ${anchor.t} s = beat ${anchor.beat}. Check by ear or in the preview)`}`);
console.log(`\n${PHRASE}-beat phrases (start in s · relative energy):`);
phrases.forEach((t, i) => console.log(`  beat ${String(i * PHRASE).padStart(4)}  ${t.toFixed(3).padStart(8)} s  ${'█'.repeat(Math.round(energyRel[i] * 30)).padEnd(30)} ${energyRel[i].toFixed(2)}`));
console.log(`\nReading it: a sustained energy dip = breakdown; the next jump = drop. Candidate fills: ${fills.slice(0, 12).join(', ') || 'none clear'}`);
console.log(`If the BPM came out double or half of what you hear, run again with --bpm <value>.`);
console.log('\nFor music.json:');
console.log(JSON.stringify({ bpm: out.bpm, sha256: sha, grid: out.grid }, null, 2));
