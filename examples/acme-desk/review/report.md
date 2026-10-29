# Review · video/launch/renders/acme-desk-en.mp4

| Measure | Value | Target | |
|---|---|---|---|
| Duration | 36.00 s | = data-duration of the root | |
| Video | 1920×1080 @ 30/1 | 1920×1080 @ 30/1 | ok |
| Hard cuts | 8 | one per scene, plus the final montage | |
| Soft changes | 16 | | |
| Still stretches (3 longest, a hint) | 3.25 s at 31.5 s · 1.50 s at 22.3 s · 1.00 s at 15.5 s | ≤ 2 beats (1.20 s) except the ending | ok |
| Integrated loudness | -18.8 LUFS | -14 with voice; with music only, the track's own | |
| True peak | -4.0 dBTP | ≤ -1.0 | ok |
| LRA | 0.5 LU | 1.5 to 8 | |

## Cuts against the grid (100 BPM, downbeat 0 s)

Off by ≤ 2 frames: 8 of 8. All on the beat.

| Cut (s) | Beat | Bar | Offset (s) | Frames | |
|---|---|---|---|---|---|
| 24.000 | 40 | yes | +0.000 | +0.0 |  |
| 24.600 | 41 | no | +0.000 | +0.0 |  |
| 25.200 | 42 | no | +0.000 | +0.0 |  |
| 25.800 | 43 | no | +0.000 | +0.0 |  |
| 26.400 | 44 | yes | +0.000 | +0.0 |  |
| 27.000 | 45 | no | +0.000 | +0.0 |  |
| 27.600 | 46 | no | +0.000 | +0.0 |  |
| 28.200 | 47 | no | +0.000 | +0.0 |  |

## How to read it

- `filmstrip.jpg`: top to bottom is time (2 frames per second). Runs of identical frames are stillness; check whether they match the ending or a scene that ran out of ideas.
- `contact.jpg`: 12 frames spread over the video. Do you get the video without watching it? Does each frame hold one idea?
- A cut off the beat is usually a badly rounded `data-start` or an exit without the `- 0.24`. A long still stretch outside the ending asks for one more pill word, a fragment toward the camera or a camera move. The stillness detector compares frames at 320 px: it misses hearts, thin rings and slow drifts. Look at the stretch in the filmstrip before "fixing" it; if it moves to the eye, it's fine.
- The numbers point at problems; they don't approve anything. The visual review is in skills/pv-review/SKILL.md.
