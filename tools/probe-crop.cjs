/**
 * 裁剪辅助：把指定区域裁出来放大写到 tools/.probe/，用于人工核对切图坐标。
 * 用法：node tools/probe-crop.cjs <图片文件名> <left> <top> <width> <height> [输出名]
 */
const path = require('path');
const fs = require('fs');
const { createRequire } = require('module');

const toolRequire = createRequire(
  path.join(__dirname, '..', 'image-to-slice-tool', 'package.json')
);
const sharp = toolRequire('sharp');

const [file, left, top, width, height, name] = process.argv.slice(2);
const outDir = path.join(__dirname, '.probe');
fs.mkdirSync(outDir, { recursive: true });

const src = path.join(__dirname, '..', '测试图', file);
const out = path.join(outDir, `${name || path.parse(file).name}-crop.png`);

sharp(src)
  .extract({
    left: Number(left),
    top: Number(top),
    width: Number(width),
    height: Number(height),
  })
  .resize({ width: Number(width) * 2, kernel: 'nearest' })
  .png()
  .toFile(out)
  .then(() => console.log(out))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
