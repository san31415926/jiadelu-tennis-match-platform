import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from '../image-to-slice-tool/node_modules/sharp/lib/index.js';

const root = 'D:/Desktop/嘉得路网球对战平台项目';
const inputDir = path.join(root, '测试图');
const outputDir = path.join(root, 'ui-slices', 'output', 'my-page-v1');

const assets = [
  { key: 'player-card-base', source: '切图-球员卡元件.png', left: 60, top: 85, width: 675, height: 615 },
  { key: 'rating-badge', source: '切图-球员卡元件.png', left: 790, top: 85, width: 245, height: 225 },
  { key: 'level-mark', source: '切图-球员卡元件.png', left: 1055, top: 85, width: 390, height: 205 },
  { key: 'xp-bar', source: '切图-球员卡元件.png', left: 790, top: 335, width: 620, height: 135 },
  { key: 'xp-ball', source: '切图-球员卡元件.png', left: 815, top: 500, width: 125, height: 110 },
  { key: 'floating-balls', source: '切图-球员卡元件.png', left: 75, top: 700, width: 620, height: 290 },
  { key: 'card-glow', source: '切图-球员卡元件.png', left: 770, top: 680, width: 700, height: 320 },
  { key: 'player-avatar', source: 'C:/Users/17112/AppData/Local/Temp/codex-clipboard-c380261f-b992-4607-a6bc-ead4803f8f5a.png', left: 48, top: 44, width: 112, height: 108, keepBackground: true },
  { key: 'menu-profile', source: '切图-我的页菜单图标.png', left: 155, top: 100, width: 280, height: 250 },
  { key: 'menu-records', source: '切图-我的页菜单图标.png', left: 510, top: 70, width: 250, height: 300 },
  { key: 'menu-club', source: '切图-我的页菜单图标.png', left: 825, top: 65, width: 330, height: 300 },
  { key: 'menu-about', source: '切图-我的页菜单图标.png', left: 1165, top: 100, width: 300, height: 275 },
  { key: 'menu-business', source: '切图-我的页菜单图标.png', left: 260, top: 485, width: 380, height: 285 },
  { key: 'menu-share', source: '切图-我的页菜单图标.png', left: 655, top: 490, width: 315, height: 270 },
  { key: 'menu-service', source: '切图-我的页菜单图标.png', left: 985, top: 470, width: 330, height: 315 },
  { key: 'menu-copy', source: '切图-我的页菜单图标.png', left: 615, top: 810, width: 215, height: 175 },
  { key: 'menu-arrow', source: '切图-我的页菜单图标.png', left: 825, top: 805, width: 170, height: 180 },
  { key: 'trend-line', source: '切图-我的页控件底栏.png', left: 145, top: 85, width: 430, height: 220 },
  { key: 'trend-up', source: '切图-我的页控件底栏.png', left: 655, top: 105, width: 315, height: 175 },
  { key: 'win-loss', source: '切图-我的页控件底栏.png', left: 1050, top: 150, width: 350, height: 170 },
  { key: 'nav-event', source: '切图-我的页控件底栏.png', left: 205, top: 620, width: 280, height: 280 },
  { key: 'nav-super-cup', source: '切图-我的页控件底栏.png', left: 660, top: 620, width: 280, height: 280 },
  { key: 'nav-my-selected', source: '切图-我的页控件底栏.png', left: 1015, top: 735, width: 365, height: 185 },
  { key: 'nav-bar-reference', source: '切图-我的页控件底栏.png', left: 150, top: 725, width: 1240, height: 200 }
];

function distance(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function isBackground(pixel, reference) {
  const saturation = Math.max(...pixel) - Math.min(...pixel);
  return distance(pixel, reference) < 40 && saturation < 30 && Math.min(...pixel) > 218;
}

async function removeConnectedBackground(buffer, meta) {
  const { data, info } = await sharp(buffer).extract(meta).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const edge = [];
  for (let x = 0; x < width; x += 1) {
    for (const y of [0, height - 1]) {
      const offset = (y * width + x) * channels;
      edge.push([data[offset], data[offset + 1], data[offset + 2]]);
    }
  }
  for (let y = 1; y < height - 1; y += 1) {
    for (const x of [0, width - 1]) {
      const offset = (y * width + x) * channels;
      edge.push([data[offset], data[offset + 1], data[offset + 2]]);
    }
  }
  const reference = edge.reduce((sum, pixel) => [
    sum[0] + pixel[0] / edge.length,
    sum[1] + pixel[1] / edge.length,
    sum[2] + pixel[2] / edge.length
  ], [0, 0, 0]);
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const enqueue = (x, y, parentIndex = -1) => {
    const index = y * width + x;
    if (visited[index]) return;
    const offset = index * channels;
    const pixel = [data[offset], data[offset + 1], data[offset + 2]];
    if (!isBackground(pixel, reference)) return;
    if (parentIndex >= 0) {
      const parentOffset = parentIndex * channels;
      const parentPixel = [data[parentOffset], data[parentOffset + 1], data[parentOffset + 2]];
      if (distance(pixel, parentPixel) > 12) return;
    }
    visited[index] = 1;
    queue[tail++] = index;
  };
  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }
  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) enqueue(x - 1, y, index);
    if (x < width - 1) enqueue(x + 1, y, index);
    if (y > 0) enqueue(x, y - 1, index);
    if (y < height - 1) enqueue(x, y + 1, index);
  }
  for (let index = 0; index < visited.length; index += 1) {
    if (visited[index]) data[index * channels + 3] = 0;
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
const results = [];
for (const asset of assets) {
  const source = path.isAbsolute(asset.source) ? asset.source : path.join(inputDir, asset.source);
  const buffer = asset.keepBackground
    ? await sharp(source).extract(asset).png().toBuffer()
    : await removeConnectedBackground(source, asset);
  const output = path.join(outputDir, `${asset.key}.png`);
  await fs.writeFile(output, buffer);
  const meta = await sharp(output).metadata();
  results.push({ ...asset, output, width: meta.width, height: meta.height });
}
await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify({ assets: results }, null, 2));
console.log(JSON.stringify({ outputDir, count: results.length, assets: results }, null, 2));
