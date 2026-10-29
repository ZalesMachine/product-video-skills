# Scene recipes

One recipe per scene **type**: what is in the DOM, what happens on each beat and which helper does it, so you can copy the structure into a new video. Four of them have runnable code in `examples/acme-desk/video/launch/compositions/`:

| Recipe | Runnable file |
|---|---|
| 1 · Hook | `hook.html` (also in `template/`) |
| 6 · Big numbers + fragments toward the camera | `dashboard.html` (the template's `section.html`, renamed) |
| 5 · List in cascade + 2D camera click | `tickets.html` |
| 12 · Finale | `finale.html` (also in `template/`) |

The others are written from scenes of a two-minute launch video made with this method; build them with the same helpers. `b(n)` = `PV.b(n)` from the start of the scene; in the hook, `t(n) = PV.DOWNBEAT0 + b(n)` because the track starts at 0 and its first downbeat may not. Beat counts are typical at 90–120 BPM; at faster tempos give each idea more beats.

## 1. Hook (16 beats, starts with the track)

**DOM:** background; plane of the screen the next scene picks up (hidden until the riser); two central hairlines; block A (word + pill with 3–4 stacked tokens); fragments (`.frag` with `data-shot`/`data-key`) + 2 rings; optional block B (a light contrast scene with its own background, black grid and a stack of text); block C ("Introducing" / "the new"); block D (logo, title with glow and a frame of hairlines and crosses, eyebrow with the URL).

| Beats | What happens |
|---|---|
| 0 | Background fades in (0.8 s); washes `scale 0.7 → 1` with a half-beat stagger; hairlines draw. |
| 0–4 | "YOUR" with `slam` 1.9×; the pill `scaleX 0 → 1`; on every beat the outgoing word rises (`yPercent -120`), the pill changes width and color (`power3.inOut` 0.34 s), the incoming one rises from below (`expo.out`). Colors brand, data, action, brand (special stays reserved for its one concept). `pulse` on wash 1. |
| 2–4 | Real fragments fly from the center to their orbit (`spots` with their own scale and rotation) with blur, one every quarter beat; rings fade in and turn ±20°; block A shrinks to 0.86. |
| 4 | `zoomOut` of A + fragments + hairlines. |
| 4–8 | Optional contrast scene: a light ground, `arrive` of a text stack ("ALL IN ONE" by words, the first `.dim`), a 3D pill (`rotationX 70 → 10`, `rotationZ -8 → -3`) on beat 6. Without it: "INTRODUCING" by characters (`yPercent 90`, blur 10, stagger 0.03) and "THE NEW" with `streakIn` on beat 6. `zoomOut` on 8. |
| 8–12 | `arrive` of the lockup; title by characters (`y 40`, blur 12), size fitted to ≤ 1700 px with `textWidth`; logo; frame hairlines draw with a quarter-beat stagger; crosses `scale 0 → 1`; URL decoded over 1.5 beats; a slow push-in keeps it alive. |
| 12–16 | Riser: the lockup grows to 1.07 (`power1.in`); the next scene's screen rises behind (`scale 0.28 → 0.6`, `rotationX 38 → 14`, `y +420 → +60`, opacity 0.85). Strong `zoomOut` (1.5×) ending on 16. |

Keys: the riser prepares scene 2 (object continuity); real fragments from second one say "this is the real product".

## 2. Before/after (16 beats)

**DOM:** two pairs (`.x-pair`) of overlapping planes (old + new with `clip-path: inset(0 100% 0 0)` + an action-colored `.x-edge` line); an `.x-split` with two planes for the close; header with the "New" chip and title; subtitle below; `.flash`. The old UI comes from `capture.mjs --legacy-ref <commit>` (`pv-capture`).

| Beats | What happens |
|---|---|
| 0 | Flash 0.5 → 0; pair 1 arrives at its pose (`y 600 → 330`, `scale 0.6 → 0.86`, `rotationX 14 → 10`, `expo.out` 0.85 s): it continues the hook's riser. Title with `streakIn` from the left; "New" chip on beat 1. |
| 4 | Sweep: `.x-edge` crosses the width while `clip-path` reveals the new one (`power3.inOut` 0.95 s, an `onUpdate` writing `clipPath` and `left`). The pair settles (`rotationX 4`, `scale 0.9`). |
| 8 | `zoomOut` of pair 1 (1.2×); pair 2 enters with `scale 0.62 → 0.86` and blur. Sweep on 10. |
| 12 | `zoomOut` of pair 2; header leaves upward with blur; the two closing planes come in from the sides (`rotationY ±34 → ±16`, `x` from off-frame); subtitle by words on 13. |
| 16 | `zoomOut` of the world (1.3×). |

Keys: no "before/after" labels; the action line **is** the transformation. A short version (8 beats, three screens, one sweep each) works when the redesign is one idea among many.

## 3. Section with cards (12 beats)

**DOM:** sidebar (`.pv-nav` …); plane of the view with `.sheen`; 4 `.frag` of real cards (`card1..4`) + a dashed `.x-group` frame + an action ring; text on the left (title + pill); cursor.

| Beats | What happens |
|---|---|
| 0 | `zoomIn` of the world; `navIntro` → `C0` ≈ 1.4 beats. Plane at 1500 px turning slowly the whole scene (`rotationY -24 → -12`, `power1.inOut`, 12 beats); the sheen sweeps it on beat 1. |
| C0 | Title with `streakIn` from the left. Action pill cycles on 2, 5 and 9. |
| 2–4 | Real cards arrive scattered (`scatter` with ±7° rotation, `rotationY -24`, blur), one every half beat. |
| 5 | They snap into a 2×2 grid (`power4.inOut` 0.7 s, stagger 0.05); the dashed frame appears 0.45 s later; the plane drops to opacity 0.45 and blur 2. |
| 10 | Cursor `click` on the first card (travel 0.75 s); action ring appears; card and ring grow to 1.06. |
| 12 | `whipOut` to the left. |

## 4. Section with scroll (12 beats)

**DOM:** sidebar; plane with the normal capture, an inner `.x-plate-clip` with the `-full` capture (scroll), `.sheen` and `.x-valid` (inner action border); a `.frag` for the key detail; `.x-check`; text on the right ("New" chip, title, fixed subtitle, pill).

| Beats | What happens |
|---|---|
| 0 | `whipIn` (continues the previous whip); `navIntro`. Plane at 1400 px on the left, tilted (`rotationY 26 → 16`), the scroll clip to the right of the sidebar (width = `sidebar.w` × scale). |
| C0 | Chip, title `streakIn`, subtitle `y 18 → 0`. The pill cycles on 2.2 / 4 / 7 / 9.5 in the section color, the last one in action. |
| 4, 7 | Real scroll of the plate to a manifest anchor (`target.y - 120`) and to `docHeight - 1080` (`power3.inOut` 0.9 s, anticipated 0.45 s). |
| 7.5 | The key fragment flies toward the camera (1.4×, `rotationY 18 → 0`); leaves on 9.5. |
| 9.5 | `.x-valid` lights up and the check falls (`scale 2.2 → 1`, `rotation -25 → 0`, blur). |
| 12 | `zoomOut`. |

## 5. List in cascade (12–16 beats) · `tickets.html`

**DOM:** sidebar; a `.x-cam` world (`transform-origin: 0 0`) holding the header row and 5–6 rows (`row1..n`), status chips (`st1..n`), the chip of the result state (cropped from another row that already has it), an action ring and the cursor; outside the world: title and pill.

| Beats | What happens |
|---|---|
| 0 | `zoomIn`; `navIntro`; title; pill on 2 / 5 / 8, the last one in action (`colors: [data, data, action]`). |
| 1.3–1.5 | Header row fades in; real rows fall in cascade from depth (`y +90`, `scale 0.88`, `rotationX -35`, blur 10 → 0) one every 0.4 beats, centered, 80 px apart. Each row is a **literal-rect crop up to the status column at 1.3×**: a full-width row at 1× has 15 px text and doesn't read. |
| 5 | Status chips jump 2× above their row (position computed from `st.x - row.x` in the manifest, never from the layout), 0.4 beats apart; they leave on 7.5. |
| 7.6 | The other rows leave (`y +40`, blur, `power3.in`); a 2D camera (`PV.camAt(1.15, focus)`, 1 s `power3.inOut`) frames the kept row from its subject to its status chip. |
| 9 | Cursor `click` on the chip; the real result chip slams onto it (`scale 1.6 → 1`, blur 10) and the action ring pops (the action moment). The camera keeps pushing in slowly (`ease: 'none'`) until the cut. |
| 12 | `whipOut` to the left. |

Variant with a detail panel: on beat 5 the kept row moves to the top and its real detail unfolds below (`scaleY 0 → 1` from the top); on 9 big numbers from that detail (`count` + `slam` 1.4×, the third in action); on 12 a second panel (`rotationX -70 → 0`); exit with a vertical cut.

## 6. Big numbers (12 beats) · `dashboard.html`

**DOM:** sidebar; background plane; three numbers with mono labels; the real KPI strip; two or three real cards (chart, breakdown); header; pill.

| Beats | What happens |
|---|---|
| 0 | `zoomIn` (or entrance from below after a vertical cut). `navIntro`. Plane at 1700 px, faint (0.32) and blurred (3 px), tilted (`rotationX 24 → 16`, `ease: 'none'`). |
| 1.6 / 2.6 / 3.6 | Three numbers hit (`count` 1.1 s + `slam` 1.5×) with labels; the third in action. On 4.5 the real strip appears below (`rotationX -70 → 0`) as their source. |
| 6 | Pill changes; numbers and strip leave; the plane drops to 0.16; the real chart flies toward the camera (`scale 0.7 → 1`, `rotationX 22 → 0`, blur). |
| 9 | The chart recedes (left, `rotationY 14`, opacity 0.4, blur 4); the breakdown card arrives from the right (`rotationY -18 → 0`, 1.45×). Variant: insights card with ✦ sparkles (`data-layout-ignore`) and export buttons at 2.2×. |
| 12 | `zoomOut`. |

## 7. Title that hits over a table (12 beats)

**DOM:** sidebar; plane with an `.x-clip` and the `-full` table inside; `.x-shade` (lateral gradient so the text reads); 8 stage chips; pill; counter + unit; three channel/category pills; centered title with glow; `.flash`.

| Beats | What happens |
|---|---|
| 0 | `navIntro`; at C0, flash 0.35 and a 230 px title entering from 2.2× with blur 24 by characters (stagger 0.03). |
| 0–12 | The real tilted table (`rotationX 26 → 22`, `rotationY -22 → -16`, `rotationZ 4`) passes upward the whole scene (linear `y`, `ease: 'none'`). |
| 2.7 | The title shrinks to the corner (`scale 0.42`, centered with `textWidth`). |
| 2.8 | Stage chips at 2× fly out of the table toward the camera, two columns on the right, one every 0.4 beats, ±3° rotation. |
| 3.1 / 5.5 / 8 | Action pill cycles. On 3.6, `count` (1.2 s) + `slam` 1.5× and the unit. |
| 8 | Three pills (data, brand, special) rise half a beat apart; the chips drop to 0.35 and blur 3. |
| 12 | `zoomOut`. |

## 8. Reading scene with a 2D camera (24 beats, on the breakdown)

**DOM:** `.x-world` (1920×1080, `transform-origin 0 0`) with the document plane at 1600 px at (160, 90), `.x-sel` (data-colored selection with a caret), `svg.x-link` (curve), `.frag.x-com` (real comment), `.x-press` (action highlight on a button), cursor; outside the world: `.x-scrim`, a two-line title, three captions (big word + complement), a toast, rays, a stamp.

`box(key)` converts a manifest target to world coordinates: `{ x: 160 + r.x * k, y: 90 + r.y * k, w, h }`.

| Beats | What happens |
|---|---|
| 0 | The world comes in at 0.72 on the right (`scale 0.6 → 0.72`, blur 16 → 0) and the title by characters on the left in two lines (0.15 and 0.75 beats). The title leaves on 3. |
| 3 | Scrim; caption 1 by words; camera `camAt(1.5, target)` in 1.2 s. |
| 4–5.2 | The cursor appears and runs along the text while the selection grows (`scaleX 0 → 1`, `power1.inOut`). |
| 5.6–6 | The SVG curve draws (`strokeDashoffset`); the real comment floats to the right (`scale 0.6 → 1`, `y +40`, blur); the cursor disappears. |
| 9 | Caption 2; camera to the action bar (1.7×); comment, curve and selection leave. |
| 11 | `click` on the submit button with the action `.x-press` (0.2 s + 0.6 s fall); toast on 11.5; it leaves on 15. |
| 15 | Caption 3; the cursor travels. |
| 17–18 | `click` on "Approve"; a stamp (`scale 2.4 → 1`, `rotation -14 → -6`, blur 18) with 12 action rays that extend (`scaleY 0 → 1`, rotation by index) and fade. |
| 19.5 | Camera back to 0.92 centered; the stamp shrinks to the corner; captions and scrim fade on 21. |
| 24 | `zoomOut` of world + stamp (1.4×). |

## 9. Two features (8 beats each, or both in 8)

**DOM:** centered header ("New" chip + title); one or two cards with media (`.frag` of the real feature), a label with a color dot, a subtitle. Better: one scene of 8 beats per feature, with a real click (a "Connect" button opening its real dialog, a selector picking an option).

| Beats | What happens |
|---|---|
| 0 | `zoomIn`; chip (`scale 0.3 → 1`); title by words (`rise`). |
| 1, 4 | Each card: media flips up from the base (`rotationX -80 → 0`, `y 60 → 0`), label with `streakIn`, subtitle `y 16 → 0`. |
| 8 | Fast `zoomOut` (1.35×) toward the drop. |

## 10. Big announcement (4 + 8 beats per item, on drop 2)

For things that **don't exist yet** ("Coming soon"): drawn generic cards, never fake UI presented as real, never third-party brands.

**DOM:** intro (210 px title with glow + eyebrow); fixed header (ghost tag in action + one dash per item); one panel per item with `.x-left` (name in two lines, subtitle) and `.x-vis` (drawn cards); `.flash`.

| Beats | What happens |
|---|---|
| 0 | Flash 0.6; title by characters from 2.2× with blur 24; eyebrow decoded on 1. `zoomOut` on 4. |
| 4 | Header comes in. Each panel `i` starts on `4 + 8i`: enters from below (`y 220`, blur 18) except the first, name with `streakIn` line by line, subtitle, visual from the right (`x 120`, `rotationY -18`), its dash lights up; it leaves upward 0.22 s before the next. |
| per panel | Each visual tells, in 8 beats, what that item will do, with drawn generic cards. Techniques that work: steps that light up one per beat (`scaleX` of an action background + text color) and a result that takes off (bars `scaleY 0 → 1`, counters); a diagram whose edges draw themselves (SVG `stroke-dashoffset` via `attr`); a button that beats once (`yoyo`, `repeat: 1`, finite); three results that swap places (tweening `top` is acceptable here: three absolute elements without layout). |
| last | `whipOut` of the last panel and the header. |

Keys: 8 beats per item so it reads; four items on one screen don't.

## 11. Numeric payoff (8 beats)

| Beats | What happens |
|---|---|
| 0 | `whipIn`; tag (`scale 0.4 → 1`); title by characters with `streakIn`; a lead-in line by words on 1. |
| 2 | `count` to the number (0.9 s) at 300 px in action + `slam` 1.8×; three rings open with the kick (`scale 0.4 → 2.6`, opacity 0.9 → 0) on 2, 4 and 6. A complement line on 3. |
| 8 | `zoomOut`. |

## 12. Finale (20 beats) · `finale.html`

**DOM:** `.f-mont` with 8 planes (`data-shot`) and `.f-dark` on top; two lines of text; `.f-lock` (logo, title with glow + frame, URL as an address bar); `.flash`; `.f-black`.

| Beats | What happens |
|---|---|
| 0–8 | One plane per beat at 1560 px: appears with its pose (`rotationX/Y` from the `poses` table, ×0.6 as it settles), `scale 1.14 → 1`, blur 6 → 0, flash 0.22; the previous one goes off on the next beat. Line 1 by words on 0.05 (half-beat stagger); line 2 on 4 (last word in action). Size fitted with `textWidth` ≤ 1700 px. |
| 8 | `zoomOut` of the montage (1.4×); lockup with `arrive` and a slow push-in; title by characters; logo on 9; frame hairlines (2 beats) and crosses on 10; URL `y 24 → 0`, decoded in lowercase. |
| 18–20 | Black, `power1.in` over 2 beats, with the audio's `data-fade-out="2"`. |

## What repeats in every scene (the system)

1. An entrance that continues the previous cut (0 s).
2. `navIntro` on every section of the product (≈1.4 beats) → `C0`.
3. Title by characters with `streakIn` at `C0`, "New" chip when it applies.
4. A pill cycling 3 or 4 ideas, one every 2 to 4 beats, in the section's color.
5. The real screen as a 3D plane with slow motion through the whole scene.
6. Real fragments toward the camera on the pill's beats.
7. One action moment (check, stamp, number, ring).
8. An exit in motion 0.22–0.26 s before the bar.
