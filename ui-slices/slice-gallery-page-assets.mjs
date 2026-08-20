import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from '../image-to-slice-tool/node_modules/sharp/lib/index.js';

const root = 'D:/Desktop/嘉得路网球对战平台项目';
const source = path.join(root, '测试图', '定稿-相册.png');
const outputDir = path.join(root, 'ui-slices', 'output', 'gallery-page');

const assets = [
  { key: 'bracket-2024', left: 72, top: 544, width: 424, height: 252 },
  { key: 'bracket-2025', left: 523, top: 544, width: 428, height: 252 },
  { key: 'super-cup-photo-01', left: 72, top: 956, width: 280, height: 188 },
  { key: 'super-cup-photo-02', left: 369, top: 956, width: 285, height: 188 },
  { key: 'super-cup-photo-03', left: 672, top: 956, width: 280, height: 188 },
  { key: 'super-cup-photo-04', left: 72, top: 1304, width: 280, height: 188 },
  { key: 'super-cup-photo-05', left: 369, top: 1304, width: 285, height: 188 },
  { key: 'super-cup-photo-06', left: 672, top: 1304, width: 280, height: 188 }
];

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
const results = [];
for (const asset of assets) {
  const output = path.join(outputDir, `${asset.key}.png`);
  await sharp(source).extract(asset).png().toFile(output);
  results.push({ ...asset, output });
}
await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify({ source, results }, null, 2));
console.log(JSON.stringify({ outputDir, results }, null, 2));
