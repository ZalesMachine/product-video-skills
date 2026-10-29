---
name: pv-review
description: Manual under pv-video. Review a render of a product video the way a demanding creative director would - measure it with tools/review.mjs (cuts against the beat grid, still stretches, loudness, filmstrip and contact sheet), apply the visual checklist (continuity at every cut, legibility, brand, real screens, one accent per shot), write the gaps list, present it to the team and close with a verdict in lessons.md. Use for "review the video", "what's wrong", "it feels slow", "it's not on the beat", "contact sheet", "before publishing", "what did we learn".
---

# Review and verdict

> Manual under `pv-video`. If something here contradicts `pv-video`, `pv-video` wins.

A video that passes every measurement can still read as a template. The review **starts with the eye** and uses the numbers to point at problems, not to approve. The team has the last word; when something "doesn't work", ask what it read wrong instead of guessing, and change one variable per round.

## 1. Measure

```bash
node tools/review.mjs video/launch/renders/<video>-en.mp4 video/launch/review/v1 --music video/music.json
```

It writes into the output folder:

| File | What it is |
|---|---|
| `filmstrip.jpg` | One frame every 0.5 s in a grid: the reading rhythm. Runs of identical frames = stillness. |
| `contact.jpg` | 12 frames spread over the video at 480 px: the overall look. |
| `report.md` | Duration, hard and soft cuts with their times, the three longest still stretches (a hint: the detector misses small motion), loudness (integrated LUFS, true peak, LRA), and with `--music` how far each cut lands from the nearest beat. |

Targets: cuts within 2 frames (0.067 s) of a beat; no still stretch longer than 2 beats except the last 4 s; audio with true peak ≤ -1 dBTP and even loudness (with music only, the track's own level; with voice, aim for -14 LUFS).

To look at a cut closely: `snapshot --at <cut-0.1>,<cut+0.2>` (`pv-render`) and read the pair. For a scene: `tools/contact-sheet.sh <render> <start> <end> <step>`.

## 2. Look (checklist)

| Area | Passes when |
|---|---|
| **First second** | Something moves from frame 1 and the pill has already changed word before second 2. |
| **Continuity** | At every cut the outgoing scene is still moving and the incoming one arrives in flight. No "resting" frame before a cut. |
| **Rhythm** | Every hit of text or number lands on a beat; every cut on a bar; on the breakdown the camera moves slowly and on the drop the flash hits. |
| **Real screens** | All UI comes from captures; fragments read (≥ 1×, and scaled up when the UI text is small); the whole app small only as a blurred background. The data belongs to the fictional demo account and nothing comes from a real customer. |
| **Legibility** | Every word reads on a phone for at least 0.6 s; nothing under 28 px except UI detail that doesn't need reading. Pills with 1 to 3 words. |
| **Brand** | Only tokens; action = action/success/"new", data = numbers and evidence, brand = the product name and authority, special = its one reserved concept; one accent per shot; logo not recolored; display font for kinetic type, mono for labels. |
| **Air** | One idea per frame; nothing touches the edge by accident; the scrim only where a capture sits behind the text. |
| **Claims** | Every number and every "new" or "coming soon" is true today. The URL is right. |
| **Languages** | The other language's long lines fit (closing lines ≤ 1700 px); dates and numbers in the regional format; nothing left in the main language in the other render. |
| **Ending** | Clean lockup, legible URL, fade to black with the music fading out, no cut-off audio. |

## 3. Differentiation

1. **Logo test:** with another brand, would the video still work? If yes, it's missing the real sidebar, the real fragments, the real section names.
2. **Catalog moves:** list every move that is also among HyperFrames' defaults (zoom-through, whip, flash) and confirm it has a reason here (the drop, a change of topic) and its own signature (streak with blur, washes, hairlines).
3. **Signatures:** at least three of these carry key moments: a pill that cycles, an action-colored before/after sweep, real fragments toward the camera, the real sidebar with a click, numbers that count and hit, an action stamp/check, the per-beat final montage.

## 4. Gaps list and v2

Write `review/v1/gaps.md`: each problem as "at mm:ss, what's wrong, why it matters, the fix", ordered by impact. Fix, re-render in `draft`, measure again into `review/v2`, and present both versions with the list so the team sees what changed. One variable per round when it's a matter of taste.

## 5. Presenting to the team

- A `standard` or `high` render of the main language + contact sheet + storyboard. Never scenes as loose clips: music and continuity are only judged on the whole video.
- Concrete questions ("does the comment read on beat 6?", "does the drop hit?") instead of "what do you think?".
- Write down the answers verbatim.

## 6. Verdict

At the end, one row in `references/lessons.md` with date, video, what was approved and what was rejected, in the team's words. And if the video taught a new rule (something that cost a round), one line in the rules section. That's what makes the next video start from here instead of from zero.
