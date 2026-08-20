import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from '../image-to-slice-tool/node_modules/sharp/lib/index.js';

const root = 'D:/Desktop/嘉得路网球对战平台项目';
const source = path.join(root, 'ui-slices', 'input', 'user-home-icons-reference.png');
const outputDir = path.join(root, 'ui-slices', 'output', 'test-icons', 'revised-user-source');

// These crops follow the four complete subjects in the new 4-column/3-column reference.
const crops = [
  { key: 'player-ranking', label: '球员排行', left: 72, top: 20, width: 250, height: 214 },
  { key: 'past-champions', label: '历届冠军', left: 1205, top: 16, width: 245, height: 218 },
  { key: 'event-photos', label: '赛事照片', left: 68, top: 374, width: 255, height: 192 },
  { key: 'annual-ceremony', label: '年会典礼', left: 441, top: 370, width: 285, height: 220 }
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
  // The reference background is a pale green-white field. Keep colored subject pixels
  // and use a connected flood so white product surfaces are not removed globally.
  return distance(pixel, reference) < 26 && saturation(pixel) < 32 && Math.min(...pixel) > 215;
}

function backgroundReference(data, width, height, channels, y) {
  const samples = [];
  for (const x of [0, 1, width - 2, width - 1]) {
    const index = (y * width + x) * channels;
    samples.push([data[index], data[index + 1], data[index + 2]]);
  }
  return samples.reduce((sum, sample) => [
    sum[0] + sample[0] / samples.length,
    sum[1] + sample[1] / samples.length,
    sum[2] + sample[2] / samples.length
  ], [0, 0, 0]);
}

async function removeConnectedBackground(file, crop) {
  const { data, info } = await sharp(source)
    .extract({ left: crop.left, top: crop.top, width: crop.width, height: crop.height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const references = Array.from({ length: height }, (_, y) => backgroundReference(data, width, height, channels, y));

  function enqueue(x, y) {
    const index = y * width + x;
    if (visited[index]) return;
    const offset = index * channels;
    const pixel = [data[offset], data[offset + 1], data[offset + 2]];
    if (!isBackground(pixel, references[y])) return;
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
    if (x > 0) enqueue(x - 1, y);
    if (x < width - 1) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y < height - 1) enqueue(x, y + 1);
  }

  for (let index = 0; index < visited.length; index += 1) {
    if (visited[index]) data[index * channels + 3] = 0;
  }

  await sharp(data, { raw: { width, height, channels } })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 5 })
    .extend({ top: 8, right: 8, bottom: 8, left: 8, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(outputDir, `${file}.png`));

  return { key: file, label: crop.label, width, height, removedPixels: tail };
}

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
const results = [];
for (const crop of crops) results.push(await removeConnectedBackground(crop.key, crop));
await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify({ source, crops, results }, null, 2));
console.log(JSON.stringify({ outputDir, results }, null, 2));
