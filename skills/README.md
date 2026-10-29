# Skills

Eight manuals for Claude Code, Codex or a person. `pv-video` is the entry point; the others are the manuals for each stage and are opened when `pv-video` says so.

| Order | Skill | Job |
|---|---|---|
| 0 | [pv-video](pv-video/SKILL.md) | Entry point. The core, the whole flow, the quality bar, where everything lives. |
| 1 | [pv-brand](pv-brand/SKILL.md) | Tokens, accent rules, per-scene color washes, type, logo, mapping another product's brand onto `--pv-*`. |
| 2 | [pv-music](pv-music/SKILL.md) | Choosing the track, measuring the grid (`tools/beat-grid.mjs`), `music.json`, the placeholder beat, from structure to edit. |
| 3 | [pv-story](pv-story/SKILL.md) | Content decisions, act structure, the storyboard table in beats, on-screen copy per language. |
| 4 | [pv-capture](pv-capture/SKILL.md) | Real screens with demo data: build, server, puppeteer, mocks, manifest, earlier UI, brand. |
| 5 | [pv-motion](pv-motion/SKILL.md) | The motion language: anatomy of a scene, `pv.css` vocabulary, `pv.js` API, cuts, scene recipes. |
| 6 | [pv-render](pv-render/SKILL.md) | HyperFrames: structure, `render.mjs`, check, snapshot, preview, render, seek-safety, known errors, version. |
| 7 | [pv-review](pv-review/SKILL.md) | Measure (`tools/review.mjs`), look (checklist), differentiate, gap list, present, verdict in `lessons.md`. |

## Making an agent find them

When this repo is opened on its own, `CLAUDE.md` and `AGENTS.md` point here. To use them from a product repo there are two ways:

```bash
# a) copy the skills into the project
mkdir -p .claude/skills && cp -R <this repo>/skills/pv-* .claude/skills/
# b) or link them
ln -s <this repo>/skills/pv-video .claude/skills/pv-video   # and the rest
```

And one line in the product's `CLAUDE.md`: "For the video (`video/`), read `.claude/skills/pv-video/SKILL.md`."

The skills reference files of this repo (`lib/`, `template/`, `tools/`, `examples/acme-desk/`). If you copy them into a product, keep this repo checked out next to it, or adjust those paths.
