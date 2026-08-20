import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from '../image-to-slice-tool/node_modules/sharp/lib/index.js';

const root = 'D:/Desktop/嘉得路网球对战平台项目';
const sourceDir = path.join(root, 'ui-slices', 'output', 'ranking');
const outputDir = path.join(root, 'ui-slices', 'output', 'ranking-v2');
const crops = [
  ['rank-1-avatar.png', 'list-avatar-1.png', { left: 10, top: 0, width: 160, height: 142 }],
  ['rank-2-avatar.png', 'list-avatar-2.png', { left: 8, top: 0, width: 144, height: 132 }],
  ['rank-3-avatar.png', 'list-avatar-3.png', { left: 8, top: 0, width: 144, height: 132 }]
];

await fs.mkdir(outputDir, { recursive: true });
for (const [source, output, extract] of crops) {
  await sharp(path.join(sourceDir, source)).extract(extract).png().toFile(path.join(outputDir, output));
}
