import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from '../image-to-slice-tool/node_modules/sharp/lib/index.js';

const root = 'D:/Desktop/嘉得路网球对战平台项目';
const inputDir = path.join(root, 'ui-slices', 'output', 'test-icons', 'primary');
const outputDir = path.join(root, 'ui-slices', 'output', 'test-icons', 'primary-transparent');

function isNeutralLight(r, g, b) {
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  return min > 230 && max - min < 15;
}

async function removeConnectedBackground(fileName) {
  const image = sharp(path.join(inputDir, fileName));
  const {data, info} = await image.ensureAlpha().raw().toBuffer({resolveWithObject: true});
  const {width, height, channels} = info;
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  function enqueue(x, y) {
    const index = y * width + x;
    if (visited[index]) return;
    const offset = index * channels;
    if (!isNeutralLight(data[offset], data[offset + 1], data[offset + 2])) return;
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
  await sharp(data, {raw: {width, height, channels}})
    .png()
    .toFile(path.join(outputDir, fileName));
}

await fs.rm(outputDir, {recursive: true, force: true});
await fs.mkdir(outputDir, {recursive: true});
const files = (await fs.readdir(inputDir)).filter((file) => file.endsWith('.png'));
for (const file of files) await removeConnectedBackground(file);
console.log(JSON.stringify({inputDir, outputDir, count: files.length}, null, 2));
