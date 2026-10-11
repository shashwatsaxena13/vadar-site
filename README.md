# VaDar research website

Website for **VaDar: Implicit Goal Conditioning via Value Disaggregation**.

Live site: https://shashwatsaxena13.github.io/vadar-site/

## Editing

- `dist/index.html`: text, figures, videos, section order, and citation.
- `dist/style.css`: layout and typography.
- `dist/replay.js`: shared-critic animation.
- `dist/weighting.js`: next-future weighting animation.
- `dist/media.js`: video controls and expandable panels.
- `dist/assets/`: paper, figures, and rollout videos.

Edit files directly on GitHub or clone this repository. Changes pushed to `main` automatically publish through GitHub Pages. No build step is required.

For local preview:

```sh
python3 -m http.server 8765 --directory dist
```

Open http://localhost:8765.

The success videos encode 4× timing in their files and play at normal browser speed. Main-results videos use trained policies; best-of-N videos use frozen-policy critic steering. The main-results video panel is collapsed by default.

KaTeX is vendored with its license in `dist/vendor/katex/LICENSE`.
