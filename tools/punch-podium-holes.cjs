/**
 * 在领奖台切图的金圈圆心抠出透明圆孔，头像从孔里露出来，
 * 金圈边压在头像上，不会再出现白边错位。
 *
 * 圆心数据来自 tools/measure-podium-circles.cjs 的 flood-fill 结果。
 * 圆孔比测到的白圆略小一圈，避免把金边也抠掉。
 *
 * 运行：node tools/punch-podium-holes.cjs
 */
const fsp = require('fs/promises');
const path = require('path');
const { createRequire } = require('module');

const toolRequire = createRequire(
  path.join(__dirname, '..', 'image-to-slice-tool', 'package.json')
);
const sharp = toolRequire('sharp');

const DIR = path.join(__dirname, '..', 'miniprogram', 'assets', 'images', 'ranking');
const PREVIEW = path.join(__dirname, '..', 'ui-slices', 'output', 'ranking-units');

const HOLES = [
  { file: 'podium-unit-1.png', cx: 263, cy: 157, d: 259 },
  { file: 'podium-unit-2.png', cx: 262, cy: 182, d: 300 },
  { file: 'podium-unit-3.png', cx: 261, cy: 175, d: 293 },
];

async function punch(item) {
  const src = path.join(DIR, item.file);
  const meta = await sharp(src).metadata();
  const r = (item.d / 2) * 0.96;
  const svg = Buffer.from(
    `<svg width="${meta.width}" height="${meta.height}" xmlns="http://www.w3.org/2000/svg">` +
      `<circle cx="${item.cx}" cy="${item.cy}" r="${r}" fill="white"/>` +
      `</svg>`
  );
  const out = await sharp(src)
    .composite([{ input: svg, blend: 'dest-out' }])
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();
  await fsp.writeFile(src, out);
  await fsp.mkdir(PREVIEW, { recursive: true });
  await fsp.writeFile(path.join(PREVIEW, item.file), out);
  return { file: item.file, bytes: out.length };
}

(async () => {
  for (const item of HOLES) {
    const row = await punch(item);
    console.log(`${row.file}  ${(row.bytes / 1024).toFixed(1)} KB`);
  }
})();
