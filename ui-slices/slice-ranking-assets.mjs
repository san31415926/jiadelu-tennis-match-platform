import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from '../image-to-slice-tool/node_modules/sharp/lib/index.js';

const root = 'D:/Desktop/嘉得路网球对战平台项目';
const source = path.join(root, '测试图', '定稿-榜单.png');
const outputDir = path.join(root, 'ui-slices', 'output', 'ranking');

const crops = [
  { key: 'ranking-podium', left: 60, top: 250, width: 904, height: 375 },
  { key: 'rank-1-avatar', left: 425, top: 300, width: 180, height: 180 },
  { key: 'rank-2-avatar', left: 150, top: 390, width: 160, height: 160 },
  { key: 'rank-3-avatar', left: 715, top: 395, width: 160, height: 160 },
  { key: 'rank-4-avatar', left: 168, top: 850, width: 130, height: 130 },
  { key: 'rank-5-avatar', left: 168, top: 975, width: 130, height: 130 },
  { key: 'rank-6-avatar', left: 168, top: 1100, width: 130, height: 130 }
];

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
for (const crop of crops) {
  await sharp(source)
    .extract({ left: crop.left, top: crop.top, width: crop.width, height: crop.height })
    .png()
    .toFile(path.join(outputDir, `${crop.key}.png`));
}
await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify({ source, crops }, null, 2));
console.log(JSON.stringify({ outputDir, source, count: crops.length }, null, 2));
