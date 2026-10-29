# Tools

| Tool | What it does | Needs |
|---|---|---|
| `new-video.mjs <product> [--lib-only]` | Sets up `<product>/video` from `template/` and copies the library (`pv.css`, `pv.js`, `theme.css`, fonts) to `video/launch/assets/lib/`. `--lib-only` refreshes only the library. Prints the `package.json` scripts to add. | Node 22. |
| `beat-grid.mjs <audio>` | Measures a track without Python: low-passed kick, tempo from the grid with the most kick per beat (70–150 BPM), downbeat phase, phrases with their energy, fills. Prints the block for `music.json`. `--bpm` and `--downbeat` fix values by hand. Validated against librosa. | Node 22, ffmpeg. |
| `beat-grid.py <audio>` | The same with librosa: BPM, beat, first downbeat, phrases, energy per phrase, fills, and the `music.json` block. | Python 3 + `librosa` + `soundfile` (`python3 -m pip install librosa soundfile`, or `uv run --with librosa --with soundfile python tools/beat-grid.py …`). |
| `review.mjs <video> <out> [--music music.json]` | Filmstrip, contact sheet and `report.md` with cuts, still stretches, loudness and how far each cut lands from the beat. | Node 22, ffmpeg/ffprobe. |
| `contact-sheet.sh <video> [start] [end] [step] [out]` | Contact sheet of a stretch, with the time printed on each frame when ffmpeg has `drawtext`. | ffmpeg, Python 3 (only for rounding). |

They all run from any folder. The outputs of `review.mjs` go to the folder you pass (in a product repo, `video/launch/review/v1`, ignored by the template's `.gitignore`).
