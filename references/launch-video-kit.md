# Reference · launch-video-kit

[github.com/timscheuerai/launch-video-kit](https://github.com/timscheuerai/launch-video-kit) (Tim Scheuer, MIT). A template for turning a website into an Apple-style "launch film" with HyperFrames: a **hook** (the story before the cut) over a shared **body** (a name that hits on the drop, hero words cut over the voice, the product up close, the logo almost in silence), with 10 skills as manuals for each stage. It was the starting reference for this method.

## What was taken

| From launch-video-kit | In this repo |
|---|---|
| **Skills as manuals** per stage, with an entry point that says when to open each one, and "where they disagree, the entry point wins". | `skills/pv-*`, with `pv-video` as the entry. |
| **Show frames before building**: a contact sheet costs minutes, a render with the wrong look costs a day. | Rule in `CLAUDE.md`; `snapshot` and `tools/contact-sheet.sh` in the flow. |
| **Music on a bar grid** and the drop on the cut; the logo almost in silence; don't use a track just because it exists. | `pv-music` and `music.json`. Here the grid of an existing track is measured instead of generating music. |
| **Measured review** (`review.py`: cuts, still stretches, loudness, cut-to-beat) + visual checklist + gap list + verdict. | `tools/review.mjs` (Node port, no numpy) and `pv-review`. |
| **Lessons** in an approved/rejected table, with dated verdicts. | `skills/pv-review/references/lessons.md`. |
| **Continuity on every cut**: nothing settles before the cut, what comes in is already moving; velocity match (exit `.in`, entrance `.out`). | The `zoomOut/zoomIn`, `whipOut/whipIn` pairs in `pv.js` and the rule in `pv-motion`. |
| **Ease tokens** and bans (`back.out`, elastic, bounce; springs on camera). | `pv-motion` § principles. |
| **One accent per shot; accent on grounds and unique elements, never on long text.** | `pv-brand`. |
| **The product up close**: the whole window, small, says nothing; push into the part that matters. | Fragments (`PV.crop`) and blurred background planes. |
| **No text card where the animation already says it; no monotonous stretches.** | `pv-story` § copy; `pv-review` § checklist. |
| **Rights**: licensed music, OFL fonts for video, customer data removed, verifiable claims. | `pv-music` (license), `pv-brand` (fonts), `pv-capture` (fictional data). |
| **HyperFrames gotchas**: start states outside `tl.set` at 0; local fonts; one paused timeline per composition; pin the version. | `pv-render`. |

## What wasn't taken (and why)

- **Voice-over aligned word by word** (forced alignment with torch, whisper, generated narrators). These videos have no voice: the music and on-screen text carry the rhythm. If a video needs one, their scheme (`launch-voice`: one take per line, `force_align.py`, every cue on its word's time) is the way.
- **Paid generation** (generated footage, music, SFX). Here the images are real captures of the app and the music is an existing track. If something has to be generated, their rule stands: state the cost first and wait for a yes.
- **The shared body and a declarative `film.json`** (beats `name`, `hero`, `product`, `blocks`, `switch`, `end` drawn by a single `onUpdate`). These videos have hand-written scenes with `pv.js`: more work per scene, but each section of the product gets its own choreography. For 30–45 s videos with a single idea, their scheme is faster.
- **Mixing outside at -14 LUFS** (`mixdown.py`). With music alone, HyperFrames mixes in the render. Go back to their scheme if there is voice + SFX.
- **Brand kit scraped from a website** (`brand-from-url.mjs`). Here the brand comes from the product's CSS tokens, which are more faithful than a scrape.
- **Their "counter-look"** (light ground, dark cards, highlight behind key words, glass). This language is dark with accents mapped from the product's tokens. Several moves they flag as "stock to avoid" (zoom-through, whip, flash) are used here because they carry a signature of their own (streak with blur, brand washes, hairlines) and a musical reason; their warning holds: a different cut per scene, or the same one everywhere, reads as a template.

## Worth reading when needed

Clone and read straight from the repo (MIT); no need to install it:

| File | For |
|---|---|
| `skills/launch-film/references/lessons.md` | The original approved/rejected table. |
| `skills/launch-motion/SKILL.md` and `references/signatures.md` | Ease tokens, camera, cursor, the 7 signature moves. |
| `skills/launch-story/SKILL.md` | Spines (watch it run, world tour, before/after, receipts), words-per-second pacing, the logo test. |
| `skills/launch-review/SKILL.md` and `scripts/review.py` | The origin of `tools/review.mjs`. |
| `skills/launch-voice/`, `launch-score/`, `launch-sound/`, `launch-mix/` | When a video needs voice, generated music, SFX or a mix. |
| `docs/rights.md` | Rights: people, footage, music, logos, fonts, claims. |
