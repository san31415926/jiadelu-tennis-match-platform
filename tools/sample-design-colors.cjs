/**
 * 从定稿设计图中定点采样颜色，输出 hex 供设计 token 使用。
 * sharp 复用 image-to-slice-tool 已安装的依赖，避免在根目录重复安装。
 */
const path = require('path');
const { createRequire } = require('module');

const toolRequire = createRequire(
  path.join(__dirname, '..', 'image-to-slice-tool', 'package.json')
);
const sharp = toolRequire('sharp');

const DESIGN_DIR = path.join(__dirname, '..', '测试图');

const TARGETS = [
  {
    file: 'home1.png',
    label: '赛事首页',
    points: [
      ['header-gradient-left-top', 0.02, 0.01],
      ['header-gradient-mid', 0.5, 0.04],
      ['header-gradient-right-top', 0.98, 0.01],
      ['header-gradient-left-bottom', 0.02, 0.17],
      ['header-gradient-right-bottom', 0.98, 0.17],
      ['page-bg-below-wave', 0.5, 0.26],
      ['grid-zone-bg', 0.5, 0.42],
      ['grid-zone-bg-lower', 0.5, 0.54],
      ['tab-strip-bg', 0.15, 0.591],
      ['tab-active-fill-left', 0.72, 0.591],
      ['tab-active-fill-right', 0.86, 0.591],
      ['event-card-outer', 0.5, 0.875],
      ['event-card-inner-white', 0.72, 0.66],
      ['cta-button-left', 0.76, 0.82],
      ['cta-button-right', 0.9, 0.82],
      ['tabbar-bg', 0.5, 0.99],
      ['tabbar-active-halo', 0.165, 0.925],
    ],
  },
  {
    file: 'me.png',
    label: '我的',
    points: [
      ['header-gradient-left-top', 0.02, 0.01],
      ['header-gradient-right-top', 0.98, 0.01],
      ['header-gradient-left-bottom', 0.02, 0.28],
      ['header-gradient-right-bottom', 0.98, 0.28],
      ['badge-score-fill', 0.57, 0.135],
      ['badge-level-fill', 0.75, 0.135],
      ['xp-bar-track', 0.85, 0.285],
      ['xp-bar-fill', 0.2, 0.285],
      ['menu-list-bg', 0.5, 0.5],
      ['menu-divider', 0.5, 0.418],
      ['page-bg', 0.5, 0.325],
    ],
  },
  {
    file: 'rank15.png',
    label: '球员排行',
    points: [
      ['header-gradient-left', 0.02, 0.02],
      ['header-gradient-right', 0.98, 0.02],
      ['toggle-inactive-fill', 0.34, 0.103],
      ['toggle-active-fill', 0.66, 0.103],
      ['page-bg', 0.5, 0.2],
      ['badge-rating-fill', 0.475, 0.674],
      ['list-row-bg', 0.5, 0.69],
      ['bottom-card-bg', 0.5, 0.958],
      ['show-more-pill', 0.5, 0.902],
    ],
  },
  {
    file: 'club-final.png',
    label: '我的俱乐部',
    points: [
      ['header-gradient-left', 0.02, 0.02],
      ['header-gradient-right', 0.98, 0.02],
      ['search-box-bg', 0.5, 0.354],
      ['filter-active-fill', 0.14, 0.447],
      ['filter-inactive-border', 0.307, 0.432],
      ['join-button-left', 0.75, 0.549],
      ['join-button-right', 0.88, 0.549],
      ['city-rank-chip', 0.63, 0.524],
      ['fab-create-club', 0.5, 0.974],
    ],
  },
];

function toHex([r, g, b]) {
  return (
    '#' +
    [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()
  );
}

async function run() {
  for (const target of TARGETS) {
    const filePath = path.join(DESIGN_DIR, target.file);
    const image = sharp(filePath);
    const { width, height } = await image.metadata();
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    console.log(`\n=== ${target.label} (${target.file}) ${width}x${height} ===`);
    for (const [name, rx, ry] of target.points) {
      const x = Math.min(width - 1, Math.max(0, Math.round(rx * width)));
      const y = Math.min(height - 1, Math.max(0, Math.round(ry * height)));
      const offset = (y * info.width + x) * info.channels;
      const rgb = [data[offset], data[offset + 1], data[offset + 2]];
      const alpha = info.channels === 4 ? data[offset + 3] : 255;
      console.log(
        `${name.padEnd(30)} (${String(x).padStart(4)},${String(y).padStart(4)})  ${toHex(rgb)}  rgb(${rgb.join(',')})  a=${alpha}`
      );
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
