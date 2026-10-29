#!/usr/bin/env python3
"""Measures the beat grid of a track for music.json.

  python3 tools/beat-grid.py <audio.mp3> [--bpm 112] [--downbeat 0.42] [--phrase 16] [--json]

Prints: BPM, beat length, first downbeat, phrase starts (every --phrase beats), RMS energy
per phrase (to locate the breakdown and the drop), candidate fills (beats with an onset much
stronger than their neighbours) and a "grid" block ready to paste into music.json.

Needs librosa and soundfile:
  python3 -m pip install librosa soundfile
  # or without installing anything globally:
  uv run --with librosa --with soundfile python tools/beat-grid.py track.mp3

Without Python: tools/beat-grid.mjs (Node + ffmpeg) gives the same grid. See skills/pv-music.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("audio")
    ap.add_argument("--bpm", type=float, help="fix the tempo (if detection doubles or halves it)")
    ap.add_argument("--downbeat", type=float, help="fix the first downbeat, in seconds")
    ap.add_argument("--phrase", type=int, default=16, help="beats per phrase (default 16)")
    ap.add_argument("--json", action="store_true", help="JSON output only")
    a = ap.parse_args()

    try:
        import librosa
        import numpy as np
    except ImportError:
        sys.exit("librosa is missing: python3 -m pip install librosa soundfile  (or uv run --with librosa --with soundfile ...)")

    path = os.path.expanduser(a.audio)
    y, sr = librosa.load(path, sr=None, mono=True)
    duration = len(y) / sr

    # Tempo and beats. start_bpm guides the tracker when --bpm is given.
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    if a.bpm:
        tempo, beat_frames = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr, start_bpm=a.bpm, tightness=400)
        tempo = float(a.bpm)
    else:
        tempo, beat_frames = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
        tempo = float(np.atleast_1d(tempo)[0])
    beat_times = librosa.frames_to_time(beat_frames, sr=sr)
    if len(beat_times) < 8:
        sys.exit("Too few beats detected: try --bpm")

    # Refine the BPM with the median inter-beat interval (more precise than the tracker's value).
    ibis = np.diff(beat_times)
    beat = float(np.median(ibis))
    bpm = 60.0 / beat

    # First downbeat: the first beat whose onset strength is above the median, aligned to the
    # ideal grid. --downbeat fixes it by hand.
    strengths = onset_env[beat_frames]
    if a.downbeat is not None:
        downbeat0 = float(a.downbeat)
    else:
        thr = float(np.median(strengths))
        idx = int(np.argmax(strengths > thr))
        downbeat0 = float(beat_times[idx])

    # Ideal grid from the downbeat.
    n_beats = int((duration - downbeat0) / beat) + 1
    grid = downbeat0 + np.arange(n_beats) * beat
    phrases = [round(float(t), 3) for t in grid[:: a.phrase]]

    # RMS energy per phrase (normalised to the max) to see the curve: intro, full, breakdown, drop.
    rms = librosa.feature.rms(y=y)[0]
    rms_t = librosa.frames_to_time(np.arange(len(rms)), sr=sr)
    energy = []
    for i, t0 in enumerate(phrases):
        t1 = phrases[i + 1] if i + 1 < len(phrases) else duration
        sel = (rms_t >= t0) & (rms_t < t1)
        energy.append(float(rms[sel].mean()) if sel.any() else 0.0)
    emax = max(energy) or 1.0
    energy = [round(e / emax, 2) for e in energy]

    # Fills: beats whose onset is above 1.8× the median of their 8 neighbours.
    fills = []
    for i in range(4, len(beat_times) - 4):
        neigh = np.concatenate([strengths[i - 4 : i], strengths[i + 1 : i + 5]])
        if strengths[i] > 1.8 * np.median(neigh):
            fills.append(int(round((beat_times[i] - downbeat0) / beat)))

    # Deviation of the detected beats from the ideal grid (measurement error).
    errs = []
    for t in beat_times:
        k = round((t - downbeat0) / beat)
        errs.append(abs(t - (downbeat0 + k * beat)))
    err_ms = float(np.median(errs) * 1000)

    sha = hashlib.sha256(open(path, "rb").read()).hexdigest()
    out = {
        "file": os.path.basename(path),
        "duration_s": round(duration, 3),
        "sha256": sha,
        "bpm": round(bpm, 3),
        "grid": {
            "beat": round(beat, 6),
            "first_downbeat": round(downbeat0, 3),
            "note": f"Measured with librosa (median error {err_ms:.1f} ms). Bar = 4 beats. Candidate fills at beats {fills[:8]}. Fill in: breakdown (beats and seconds), drop 2, where it fades out.",
            "phrases_s": phrases,
        },
        "energy_by_phrase": energy,
        "fills_candidates": fills,
    }
    if a.json:
        print(json.dumps(out, indent=2, ensure_ascii=False))
        return

    print(f"Track: {out['file']} · {duration:.2f} s · sha256 {sha[:12]}…")
    print(f"BPM: {bpm:.3f}  (1 beat = {beat:.6f} s, 1 bar = {4 * beat:.3f} s)  · median error {err_ms:.1f} ms")
    print(f"First downbeat: {downbeat0:.3f} s  {'(fixed)' if a.downbeat is not None else '(estimated: check by ear or in the preview)'}")
    print(f"\n{a.phrase}-beat phrases (start in s · relative energy):")
    for i, (t, e) in enumerate(zip(phrases, energy)):
        bar = "█" * int(e * 30)
        print(f"  beat {i * a.phrase:>4}  {t:>8.3f} s  {bar:<30} {e:.2f}")
    print("\nReading it: a sustained energy dip = breakdown; the next jump = drop. Candidate fills:", fills[:12] or "none clear")
    print("\nFor music.json:")
    print(json.dumps({"bpm": out["bpm"], "sha256": sha, "grid": out["grid"]}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
