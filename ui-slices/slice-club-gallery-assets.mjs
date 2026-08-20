import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from '../image-to-slice-tool/node_modules/sharp/lib/index.js';

const root = 'D:/Desktop/嘉得路网球对战平台项目';
const sources = {
  club: path.join(root, '测试图', '切图-俱乐部元件.png'),
  gallery: 'C:/Users/17112/AppData/Local/Temp/codex-clipboard-b819f084-dd27-476b-84c8-39e3b9014ef9.png'
};
const outputDir = path.join(root, 'ui-slices', 'output', 'club-gallery');

const assets = [
  { key: 'club-flag', source: 'club', left: 52, top: 70, width: 440, height: 368 },
  { key: 'gallery-camera', source: 'gallery', left: 72, top: 82, width: 566, height: 370 },
  { key: 'gallery-polaroid', source: 'gallery', left: 700, top: 164, width: 164, height: 205 }
];

function distance(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function isBackground(pixel, reference) {
  const saturation = Math.max(...pixel) - Math.min(...pixel);
  return distance(pixel, reference) < 38 && saturation < 38 && Math.min(...pixel) > 220;
}

async function cropTransparent(asset) {
  const { data, info } = await sharp(sources[asset.source])
    .extract({ left: asset.left, top: asset.top, width: asset.width, height: asset.height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const samples = [];
  for (let x = 0; x < width; x += 1) {
    for (const y of [0, height - 1]) {
      const offset = (y * width + x) * channels;
      samples.push([data[offset], data[offset + 1], data[offset + 2]]);
    }
  }
  for (let y = 1; y < height - 1; y += 1) {
    for (const x of [0, width - 1]) {
      const offset = (y * width + x) * channels;
      samples.push([data[offset], data[offset + 1], data[offset + 2]]);
    }
  }
  const reference = samples.reduce((sum, pixel) => [
    sum[0] + pixel[0] / samples.length,
    sum[1] + pixel[1] / samples.length,
    sum[2] + pixel[2] / samples.length
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
      if (distance(pixel, parentPixel) > 6) return;
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
for (const asset of assets) results.push(await cropTransparent(asset));
await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify({ sources, results }, null, 2));
console.log(JSON.stringify({ outputDir, results }, null, 2));
