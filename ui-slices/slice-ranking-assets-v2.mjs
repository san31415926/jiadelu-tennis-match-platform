import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from '../image-to-slice-tool/node_modules/sharp/lib/index.js';

const root = 'D:/Desktop/嘉得路网球对战平台项目';
const inputDir = path.join(root, '测试图');
const outputDir = path.join(root, 'ui-slices', 'output', 'ranking-v2');

const assets = [
  { key: 'laurel-crown', source: '切图-装饰件.png', left: 35, top: 125, width: 515, height: 445 },
  { key: 'tennis-ball', source: '切图-装饰件.png', left: 570, top: 285, width: 270, height: 285 },
  { key: 'ranking-trophy', source: '切图-装饰件.png', left: 870, top: 270, width: 330, height: 310 },
  { key: 'gold-confetti', source: '切图-装饰件.png', left: 1240, top: 175, width: 295, height: 410 },
  { key: 'badge-a-plus', source: '切图-装饰件.png', left: 120, top: 690, width: 225, height: 145 },
  { key: 'badge-a', source: '切图-装饰件.png', left: 420, top: 690, width: 230, height: 145 },
  { key: 'badge-b-plus', source: '切图-装饰件.png', left: 700, top: 690, width: 240, height: 145 },
  { key: 'join-event', source: '切图-装饰件.png', left: 1075, top: 690, width: 350, height: 145 },
  { key: 'podium-second', source: '切图-领奖台.png', left: 165, top: 65, width: 370, height: 285 },
  { key: 'podium-first', source: '切图-领奖台.png', left: 570, top: 10, width: 390, height: 335 },
  { key: 'podium-third', source: '切图-领奖台.png', left: 1015, top: 85, width: 370, height: 280 },
  { key: 'avatar-frame-first', source: '切图-领奖台.png', left: 380, top: 690, width: 390, height: 220 },
  { key: 'avatar-frame', source: '切图-领奖台.png', left: 825, top: 700, width: 250, height: 210 },
  { key: 'city-national-toggle', source: '切图-控件底栏.png', left: 45, top: 70, width: 580, height: 145 },
  { key: 'metric-tabs', source: '切图-控件底栏.png', left: 680, top: 65, width: 430, height: 145 },
  { key: 'my-ranking-card', source: '切图-控件底栏.png', left: 90, top: 275, width: 1370, height: 185 },
  { key: 'nav-calendar', source: '切图-控件底栏.png', left: 90, top: 540, width: 220, height: 170 },
  { key: 'nav-super-cup', source: '切图-控件底栏.png', left: 405, top: 550, width: 250, height: 210 },
  { key: 'nav-selected-event', source: '切图-控件底栏.png', left: 755, top: 550, width: 250, height: 210 },
  { key: 'nav-profile', source: '切图-控件底栏.png', left: 1110, top: 550, width: 260, height: 210 }
];

function distance(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function isBackground(pixel, reference) {
  const saturation = Math.max(...pixel) - Math.min(...pixel);
  return distance(pixel, reference) < 36 && saturation < 26 && Math.min(...pixel) > 224;
}

async function cropWithTransparentBackground(asset) {
  const source = path.join(inputDir, asset.source);
  const { data, info } = await sharp(source)
    .extract({ left: asset.left, top: asset.top, width: asset.width, height: asset.height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
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
      if (distance(pixel, parentPixel) > 8) return;
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
  const output = path.join(outputDir, `${asset.key}.png`);
  await sharp(data, { raw: { width, height, channels } }).png().toFile(output);
  return { ...asset, output, removedPixels: tail };
}

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
const results = [];
for (const asset of assets) results.push(await cropWithTransparentBackground(asset));
await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify({ assets: results }, null, 2));
console.log(JSON.stringify({ outputDir, count: results.length, assets: results }, null, 2));
