import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from '../image-to-slice-tool/node_modules/sharp/lib/index.js';

const root = 'D:/Desktop/嘉得路网球对战平台项目';
const inputDir = path.join(root, 'ui-slices', 'input', 'user-cropped-icons');
const outputDir = path.join(root, 'ui-slices', 'output', 'test-icons', 'user-cropped-source');

const assets = [
  { key: 'event-photos', label: '赛事照片', source: 'event-photos-source.png' },
  { key: 'player-ranking', label: '球员排行', source: 'player-ranking-source.png' },
  { key: 'annual-ceremony', label: '年会典礼', source: 'annual-ceremony-source.png' },
  { key: 'past-champions', label: '历届冠军', source: 'past-champions-source.png' }
];

function distance(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function saturation(pixel) {
  return Math.max(pixel[0], pixel[1], pixel[2]) - Math.min(pixel[0], pixel[1], pixel[2]);
}

function isBackground(pixel, reference) {
  return distance(pixel, reference) < 30 && saturation(pixel) < 30 && Math.min(...pixel) > 220;
}

async function removeBackground(asset) {
  const { data, info } = await sharp(path.join(inputDir, asset.source))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const border = [];
  for (let x = 0; x < width; x += 1) {
    for (const y of [0, height - 1]) {
      const index = (y * width + x) * channels;
      border.push([data[index], data[index + 1], data[index + 2]]);
    }
  }
  for (let y = 1; y < height - 1; y += 1) {
    for (const x of [0, width - 1]) {
      const index = (y * width + x) * channels;
      border.push([data[index], data[index + 1], data[index + 2]]);
    }
  }
  const reference = border.reduce((sum, pixel) => [
    sum[0] + pixel[0] / border.length,
    sum[1] + pixel[1] / border.length,
    sum[2] + pixel[2] / border.length
  ], [0, 0, 0]);

  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  function enqueue(x, y, parentIndex = -1) {
    const index = y * width + x;
    if (visited[index]) return;
    const offset = index * channels;
    const pixel = [data[offset], data[offset + 1], data[offset + 2]];
    if (!isBackground(pixel, reference)) return;
    if (parentIndex >= 0) {
      const parentOffset = parentIndex * channels;
      const parentPixel = [data[parentOffset], data[parentOffset + 1], data[parentOffset + 2]];
      if (distance(pixel, parentPixel) > 4) return;
    }
    visited[index] = 1;
    queue[tail++] = index;
  }
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
  await sharp(data, { raw: { width, height, channels } })
    .png()
    .toFile(path.join(outputDir, `${asset.key}.png`));
  return { key: asset.key, label: asset.label, width, height, removedPixels: tail };
}

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
const results = [];
for (const asset of assets) results.push(await removeBackground(asset));
await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify({ inputDir, assets, results }, null, 2));
console.log(JSON.stringify({ outputDir, results }, null, 2));
