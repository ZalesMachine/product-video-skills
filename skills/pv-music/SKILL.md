---
name: pv-music
description: Manual under pv-video. Choosing the music for a product video and measuring its grid (BPM, first downbeat, 16-beat phrases, fills, breakdown, drop) with tools/beat-grid.mjs (Node + ffmpeg) or tools/beat-grid.py (librosa), writing music.json, verifying the sha256, the generated placeholder beat for blocking out, trimming bars, and mapping the track's structure to the scenes. Use for "which music", "measure the beats", "the grid", "music.json", "change the track", "placeholder beat", "the drop", "the breakdown", "cut a phrase".
---

# Music and the beat grid

> Manual under `pv-video`. If anything here contradicts `pv-video`, `pv-video` wins.

The edit is not done "by eye over the music": **the track's structure rules**. The grid is measured once, saved in `music.json`, and from then on everything is expressed in beats: `PV.b(n)` in the scenes, and each scene's `data-start` = `first_downbeat + beat × 60/BPM`.

## Choosing the track

- **Instrumental, no vocals**, with a clear pulse (a strong kick on the 1) and 16-beat phrases. Clean electronic, tech house, or "corporate tech with bass" read well; a 95 BPM tech-house track carried a 2-minute, 12-scene launch without effort. What reads as a template: solo piano, orchestral, soft corporate.
- **With a breakdown** (a stretch without bass) **and a second drop**: the breakdown is the slow scene (reading a document, reviewing, approving: 24 beats), and drop 2 is the big hit (the announcement). A flat track without structure forces you to fake the energy with the picture, and it shows.
- **As long as the story needs**, or one that fades on its own near the end. Cutting a track in the middle is audible; stretching it with loops too. Twelve scenes with readable copy needed 192 beats (2:02) at 95 BPM.
- **License.** "No copyright music" tracks usually ask for credit in the video description: write it in `music.json` (`license`) and in the README. Generated music (Suno, Udio, etc.) only with a plan that allows commercial use. Never the track of a reference video.
- The music is **not redistributed** in the repo. `music.json` keeps `source` (local path) or `url`, `file` (destination in `assets/audio/`) and `sha256`; `render.mjs` copies it and verifies it. On another machine, copy the mp3 to that path (or to `video/.cache/music-source.mp3`).

## The placeholder beat (before the track exists)

To set up a project and block out timing before the track is chosen, `music.json` can declare:

```json
"placeholder": { "bars": 15 }, "bpm": 100,
"grid": { "beat": 0.6, "first_downbeat": 0, "phrases_s": [0, 9.6, 19.2, 28.8] }
```

`render.mjs` then synthesizes a deterministic beat with ffmpeg at `music.bpm` (kick on every beat, off-beat hats and bass from bar 2, a crash every 16 beats, downbeat at 0) instead of fetching a track. The same `bpm`/`bars` always give the same file. The template and `examples/acme-desk` ship with it so they render without downloading anything.

It has no structure (no breakdown, no drop), so it can't decide the edit. **Never ship it**: choose and measure a real track before the storyboard is approved, delete `placeholder`, and fill in `title`, `artist`, `page`, `source`, `sha256`, `license`, `bpm` and `grid`.

## Measuring the grid

Option A, without Python (recommended): only Node and ffmpeg.

```bash
node tools/beat-grid.mjs "~/Downloads/track.mp3" --phrase 16
```

It decodes the audio with ffmpeg, keeps the kick (low-pass ~150 Hz), detects the tempo between 70 and 150 BPM (the grid with the most kick per beat), refines it with the grid that lines up the most kicks, picks the phase (first downbeat) and anchors the bar and the phrase on the biggest energy change of the track, and prints BPM, beat, downbeat, phrase starts with their energy (to locate the breakdown and the drop), candidate fills and the block for `music.json`. Validated against librosa on a 95 BPM track: same BPM, downbeat within one frame, same breakdown and drop. If the track is outside 70–150 or the result sounds double or half, `--bpm <value>`; `--downbeat <s>` fixes the phase by hand.

Option B, with librosa (median error under ~6 ms):

```bash
python3 -m pip install librosa soundfile      # once (or: uv run --with librosa --with soundfile ...)
python3 tools/beat-grid.py "~/Downloads/track.mp3" --phrase 16
```

Same output as option A. Same `--bpm` and `--downbeat` flags.

Option B′, `hyperframes beats`: writes `beats/<audio>.json` with every beat (`time`, `strength`) but tends to read double time (190 for 95), its phase alternates with the off-beat, and it gives no phrases, energy or fills. Use it as a cross-check of option A, not as the measurement. Delete the `beats/` folder afterwards (it's in the template's `gitignore`).

```bash
cd video/launch && HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@0.8.107 beats --json .
```

Option C, by ear, to verify: markers in Studio (`npm run video:preview`) with the waveform visible, or a `draft` render with a test scene that flashes on every `PV.b(n)`.

## What to write down about the track

| Field | What for |
|---|---|
| `bpm` and `grid.beat` (60/BPM) | `PV.BPM`, `PV.B`, `PV.b(n)`. |
| `grid.first_downbeat` | `PV.DOWNBEAT0`. Scene N starts at `first_downbeat + beat × grid.beat`; the hook starts at 0 with the track. Check it by ear in the preview: a phase off by half a beat makes the whole video hit on the off-beat. |
| `grid.phrases_s` | Phrase starts (every 16 beats). Scenes start on phrases or half phrases. |
| Fills | Beats where the drums play a fill: risers and strong zoom-throughs go there. |
| Breakdown (start–end) | The long, slow scene (comment, review, read). |
| Drop 2 | The big hit: a full-screen title with a flash. |
| Fade-out | Where the music drops on its own: the fade to black goes there (`data-fade-out` on the `<audio>`). |

Example of a measured track:

```json
{
  "title": "Track title", "artist": "Artist",
  "page": "https://…", "source": "~/Downloads/track.mp3",
  "file": "launch/assets/audio/music.mp3", "sha256": "<64 hex chars from shasum -a 256>",
  "license": "Royalty-free; credit the track in the video description.",
  "bpm": 112.0,
  "grid": { "beat": 0.535714, "first_downbeat": 0.42,
            "note": "Illustrative values. Fills at 15 and 47. Breakdown without bass 96–127 (51.85–68.99 s). Drop 2 at beat 128. Fades out around 106 s.",
            "phrases_s": [0.42, 8.991, 17.563, 26.134, 34.706, 43.277, 51.849, 60.42, 68.991, 77.563, 86.134, 94.706] },
  "cuts": { "launch": null }
}
```

## From the grid to the edit

1. Draw the track's **energy curve** in phrases (intro, full, breakdown, drop 2, ending).
2. Assign the scenes: the hook on the intro (16 beats), sections on the full parts (12 or 16 beats each), the reading scene on the breakdown, the big announcement on drop 2, the closing on the end of the track.
3. Every scene = whole beats; every start = a bar (a multiple of 4). Each "coming soon" product lasts 8 beats so it can be read.
4. Write the table in `STORYBOARD.md` (`pv-story`) and the `data-start`/`data-duration` in `index.html` with three decimals.

## Trimming bars from the track

If a phrase is too much (for example, so a scene lasts 8 beats instead of 16), remove whole bars between two equivalent downbeats instead of shifting the whole edit. `music.json` declares it in `cuts.launch = { beats: [from, to), lead: 0.03, crossfade: 0.02, note }` and `render.mjs` builds the trimmed mp3 with ffmpeg (cut slightly before the kick, a 20 ms crossfade centered on the splice: the landing beat's kick stays whole and there is no click). Choose bars that are nearly identical (compare them by ear or by spectral correlation; ~0.98 is safe) and keep the end of the phrase. From `to` on, everything lands `to − from` beats earlier: write it in `grid.note` and in the storyboard. The original track stays in `.cache/music-source.mp3` and the video uses `assets/audio/music.mp3`.

## Changing the track of an existing video

1. `music.json`: source, sha256, BPM, grid, note (and remove `placeholder` if it was there).
2. `render.mjs` writes `assets/music.js` with `window.PV_MUSIC = { bpm, first_downbeat, beat }` and `pv.js` reads it: no constant to edit by hand.
3. Recompute the scene starts in `index.html` and the `b(n)` of the scenes that depend on fills or on the drop.
4. `draft` render, `tools/review.mjs --music music.json`: cuts must land within 2 frames of a beat.

## Sound beyond the music

By default the video has no sound effects and no voice: the music alone carries two minutes because the edit follows it. If a video needs SFX (clicks, arrivals, the logo), the reference is `launch-sound` in launch-video-kit (`references/launch-video-kit.md`): one consistent palette, never generic whooshes, and the logo almost silent. HyperFrames mixes `<audio>` with `data-volume`, `data-fade-in/out` and automation; for a serious mix (ducking, -14 LUFS) render silent, mix outside with ffmpeg and mux.
