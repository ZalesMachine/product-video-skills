---
name: pv-story
description: Manual under pv-video. Writing the storyboard of a product video in beats (STORYBOARD.md with one row per scene, start, beats, musical moment and exit cut), deciding the content (what is shown, what is new, what is coming soon, what stays out), structuring hook, sections, breakdown, drop and closing, and writing the on-screen copy per language in i18n.js with the product's real names. Use for "storyboard", "script", "which scenes", "scene order", "video copy", "Spanish/English version", "how long each scene lasts", "what goes in the hook".
---

# Storyboard and copy

> Manual under `pv-video`. If anything here contradicts `pv-video`, `pv-video` wins.

The storyboard is a contract: a table with one row per scene, in beats, that the team approves before a single animation exists. Then `index.html` transcribes it into seconds and every scene respects it. The example's is `examples/acme-desk/video/launch/STORYBOARD.md`.

## 1. Content decisions (before the storyboard)

Questions answered with the team and written in the video's README:

- **What is shown.** In a launch, the whole app, section by section, with the real names of the menu. In an announcement, only what's new.
- **What gets the "New" chip** (features that exist and are new) and **what gets the "Coming soon" tag** (what doesn't exist yet). Coming-soon products are drawn with generic cards, without third-party brands, and each one lasts 8 beats so it can be read.
- **What stays out** and why (a feature nobody uses yet, a view that is about to change, something that only some plans have and would need a caveat).
- **What is shown without a caveat** (and the team agrees it's fine to do so).
- **Before and after.** If there was a redesign, the earlier UI is rebuilt from the previous commit (`pv-capture`, `--legacy-ref`) and shown as one more feature, without "before" and "now" signs.
- **Languages.** The ones your users speak. Each language is a full render, not subtitles.
- **URL** of the product: in the hook and in the closing.
- **Fictional data.** Every name and number on screen comes from the demo account (`demo-data.mjs`); the README says so.

## 2. Structure

On the track's energy curve (`pv-music`):

| Act | Typical beats | What happens | Music |
|---|---|---|---|
| **Hook** | 16 | "Your [tickets → customers → replies → metrics]" with the pill swapping on every beat; real fragments orbit; optionally a light contrast scene ("All in one place."); "Introducing the new" → logo + name + URL; on the riser, what scene 2 will pick up rises from behind. | intro + fill |
| **Sections** | 12 or 16 each | One section of the product per scene: the real sidebar with the previous section active, a click on the new one and the entrance through that item (`PV.navIntro`), a title that arrives with a streak, a pill that cycles 3 or 4 words (one idea per beat or two), the real screen as a 3D plane and its fragments coming out toward the camera, one action moment. | full |
| **Reading scene** | 24 | What needs reading and following a cursor (commenting on a text, requesting changes, approving). A 2D camera over the real document. | breakdown |
| **Bridge** | 8 per feature | New features that aren't big sections: one 8-beat scene each, presented like the rest (a click on the real button, the real dialog). | breakdown / end of breakdown |
| **Big announcement** | 32 to 36 | A full-screen title with a flash on the drop; then 8 beats per product with a left panel (name + sub-line) and a right visual (a drawn card). | drop 2 |
| **Payoff** | 8 | One big number that counts and hits. | full |
| **Closing** | 20 | A montage of one cut per beat under the closing line; logo + name + URL; fade to black with the track's fade-out. | ending |

16-beat sections are the ones with more to show; 12 beats are enough for a title + 3 ideas. The pill changes its word every 2 to 4 beats depending on how much there is to read. A short video uses fewer acts, not shorter ones: the example (36 s) is hook 16 + two sections of 12 + closing 20.

## 3. The storyboard table

A YAML header with format, fps, duration, track and languages; then the table:

```markdown
| # | Scene | File | Beats | Start | Music | Exit cut |
|---|---|---|---|---|---|---|
| 1 | Hook | `hook.html` | 0–16 | 0.00 s | intro + fill | zoom-through |
| 2 | Dashboard | `dashboard.html` | 16–28 | 9.60 s | phrase 2 | zoom-through |
```

Start = `first_downbeat + beat × 60/BPM` (the hook starts at 0 with the track). Below it, a "Visual language" section (this video's rules) and a "Scenes" section with one paragraph per scene: what is seen, what the pill says, which fragment comes toward the camera, how it ends.

Exit cuts are chosen like this: **zoom-through** as the main cut (60–70 % of the cuts), **lateral whip** to change topic, **upward cut** once, **flash** only on the drop and on a strong phrase start, **fade to black** only at the end. The next scene always enters with the complementary half (`PV.zoomIn`, `PV.whipIn`, entrance from below).

## 4. Copy (`i18n.js`)

```js
window.PV_I18N = {
  url: 'acme-desk.example',               // no https://
  locales: { en: 'en-US', es: 'es-AR' },  // render.mjs renders one video per language listed here
  fallback: 'en',
  en: { 'dash.title': 'Dashboard', 'dash.caps': ['Live numbers', 'Day by day', 'Channel by channel'], ... },
  es: { 'dash.title': 'Panel', 'dash.caps': ['Números en vivo', 'Día por día', 'Canal por canal'], ... },
};
```

- One object per language with the same keys; `PV.t(key)` returns the active language's text and falls back to `fallback` if a key is missing. Lists feed the cycling pills.
- **Section names are the product's own** (the labels of its menu, in each language): what is read on screen and what is seen in the capture match. In the example the Spanish dashboard is "Panel" because that's what the app's sidebar says.
- Pills: 1 to 3 words, a concrete verb or noun ("Every ticket", "At a glance", "Solved in a click"). Nothing abstract the picture doesn't show.
- Uppercase is applied by code (`.toUpperCase()`); in `i18n.js` copy is in normal case.
- Short closing lines: "Every ticket, / one desk." The last word of the second line goes in the action color.
- Numbers: regional format with `PV.fmt` (the locale comes from `locales`: `es-AR` → `1.284`; `en-US` → `1,284`). Always `font-variant-numeric: tabular-nums`. Units per language in the copy (`' min'`, `'%'` vs `' %'`).
- Translate the meaning, not the syntax ("Resuelto en un clic" → "Solved in a click"). Check that the longest lines fit: the hook, the section titles and the closing compute their size with `PV.textWidth` so they never exceed 1700 px.

## 5. Before approval

Present the plan as "This video tells <audience> that <message>", the table, and the content decisions. Control questions:

1. Would someone who doesn't know the product understand what each section does just by reading the pills?
2. Is there anything the picture already says and the text repeats? Remove the text.
3. Is every claim and every number real? (The data on screen is the demo account's, and that's stated.)
4. The logo test: if you swap the brand, does the video still work for another product? Then it lacks moments specific to the product (the real sidebar, the real fragments, the real names).
5. Is the music a measured track, not the placeholder beat?

The team approves the storyboard before the first scene is written.
