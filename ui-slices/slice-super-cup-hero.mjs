import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from '../image-to-slice-tool/node_modules/sharp/lib/index.js';

const root = 'D:/Desktop/嘉得路网球对战平台项目';
const source = path.join(root, '测试图', '定稿-超级杯.png');
const outputDir = path.join(root, 'ui-slices', 'output', 'super-cup-hero');
const output = path.join(outputDir, 'super-cup-hero-court.png');

await fs.mkdir(outputDir, { recursive: true });
await sharp(source)
  .extract({ left: 500, top: 90, width: 524, height: 298 })
  .png()
  .toFile(output);

await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify({
  source,
  output,
  crop: { left: 500, top: 90, width: 524, height: 298 },
  purpose: 'Editable image layer for the right side of the Super Cup carousel.'
}, null, 2));

console.log(JSON.stringify({ output, source }, null, 2));
