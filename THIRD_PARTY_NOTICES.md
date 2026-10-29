# Third-party notices

This repository is MIT-licensed (see `LICENSE`). It also contains or adapts the following third-party work.

## Fonts (SIL Open Font License 1.1)

| Font | Where | License |
|---|---|---|
| Space Grotesk | `lib/fonts/space-grotesk.woff2` | `lib/fonts/OFL-SpaceGrotesk.txt` · Copyright 2020 The Space Grotesk Project Authors |
| JetBrains Mono | `lib/fonts/jetbrains-mono.woff2` | `lib/fonts/OFL-JetBrainsMono.txt` · Copyright 2020 The JetBrains Mono Project Authors |
| Inter | `examples/acme-desk/app/fonts/inter.woff2` | `examples/acme-desk/app/fonts/OFL-Inter.txt` · Copyright 2020 The Inter Project Authors |

The fonts are latin subsets downloaded from Google Fonts. The OFL allows bundling and embedding them, including in rendered video.

## launch-video-kit (MIT)

`tools/review.mjs` is a Node port of `review.py` from [launch-video-kit](https://github.com/timscheuerai/launch-video-kit), and several ideas in the skills (manuals per stage, measured review, lessons table, velocity-matched cuts) come from it. See `references/launch-video-kit.md`.

```text
MIT License

Copyright (c) 2026 Tim Scheuer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Used, not bundled

- [HyperFrames](https://github.com/heygen-com/hyperframes) (HeyGen, Apache 2.0) renders the video. It runs through `npx` pinned at `0.8.107`; nothing of it is copied here.
- [GSAP](https://gsap.com) 3.14 is loaded from a CDN by each video's `index.html` under its own license.
- [Puppeteer](https://pptr.dev) (Apache 2.0) is installed by the product repo for the captures.
