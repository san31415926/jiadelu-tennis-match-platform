# UI Slice Assets

These assets were generated from the two supplied reference screenshots using the cloned `image-to-slice-tool` project and its `sharp` image pipeline.

## Output

- `output/home/home-reference.png`: isolated mobile-canvas reference
- `output/home/profile-hero.png`: profile and score area
- `output/home/feature-grid.png`: seven feature entries
- `output/home/event-feed.png`: registration tabs and event card
- `output/bottom-nav/bottom-nav-reference.png`: original five-item reference
- `output/bottom-nav/bottom-nav-without-match.png`: four-item reference with match removed
- `output/assets/`: seven feature icon crops and the court photo crop
- `output/manifest.json`: source paths and generated output list

Regenerate the assets from the project root with:

```powershell
node ui-slices/slice-reference-images.mjs
```

## Test Icon Boards

The icon boards in `测试图` are sliced into a separate, reusable asset set:

- `output/test-icons/primary/`: 12 original coordinate crops
- `output/test-icons/primary-transparent/`: 12 edge-background-removed PNGs for use over gradients
- `output/test-icons/alternates/`: 9 alternative icon crops from the 3 x 3 board
- `output/test-icons/manifest.json`: names, sources, and crop coordinates
- `output/test-icons/网球赛事汇-图标素材库.fig`: import-ready editable Figma asset page

Regenerate these files with:

```powershell
node ui-slices/slice-test-icons.mjs
node ui-slices/make-transparent-test-icons.mjs
node ui-slices/build-test-icons-fig.cjs
```
