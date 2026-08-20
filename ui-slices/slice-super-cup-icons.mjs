import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from '../image-to-slice-tool/node_modules/sharp/lib/index.js';

const root = 'D:/Desktop/嘉得路网球对战平台项目';
const source = path.join(root, 'ui-slices', 'input', 'super-cup', 'super-cup-grid-source.png');
const outputDir = path.join(root, 'ui-slices', 'output', 'super-cup-icons');

const icons = [
  { key: 'super-cup-event', label: '超级杯赛事', left: 38, top: 4, width: 344, height: 440 },
  { key: 'rookie-cup-event', label: '新秀杯赛事', left: 410, top: 78, width: 358, height: 368 },
  { key: 'women-club-event', label: '女俱乐部赛', left: 798, top: 78, width: 356, height: 368 },
  { key: 'evergreen-cup-event', label: '常青杯赛事', left: 1160, top: 76, width: 360, height: 374 },
  { key: 'club-leaderboard', label: '俱乐部榜单', left: 38, top: 520, width: 362, height: 348 },
  { key: 'past-champions-laurel', label: '历届冠军', left: 416, top: 530, width: 362, height: 334 },
  { key: 'annual-best-medal', label: '年度最佳', left: 808, top: 522, width: 340, height: 346 },
  { key: 'club-badge', label: '俱乐部', left: 1158, top: 520, width: 360, height: 350 }
];

function distance(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function isBackground(pixel, reference) {
  const saturation = Math.max(...pixel) - Math.min(...pixel);
  return distance(pixel, reference) < 30 && saturation < 30 && Math.min(...pixel) > 220;
}

async function makeTransparent(icon) {
  const { data, info } = await sharp(source)
    .extract({ left: icon.left, top: icon.top, width: icon.width, height: icon.height })
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
  const output = path.join(outputDir, `${icon.key}.png`);
  await sharp(data, { raw: { width, height, channels } }).png().toFile(output);
  return { ...icon, output, removedPixels: tail };
}

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
const results = [];
for (const icon of icons) results.push(await makeTransparent(icon));
await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify({ source, icons, results }, null, 2));
console.log(JSON.stringify({ outputDir, count: results.length, results }, null, 2));
