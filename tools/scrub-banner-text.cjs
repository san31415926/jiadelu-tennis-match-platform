/**
 * 抹掉轮播 jpg 里烤着的旧标题。
 *
 * 裁浪之后左侧还能看出「广佛俱乐部联名赛」等残影，
 * 和页面 WXML 叠字叠在一起就是重影。这里把左半边高斯模糊再压暗，
 * 字改由首页 / 超级杯的 hero__copy 来画。
 *
 * 运行：NODE_PATH=%TEMP%\jiadelu-sharp\node_modules node tools/scrub-banner-text.cjs
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const APP_DIR = path.join(__dirname, '../miniprogram/assets/images/banners');
const FILES = [
  'banner-01-club-union.jpg',
  'banner-02-rookie-cup.jpg',
  'banner-03-ceremony.jpg',
  'banner-04-super-cup.jpg',
  'banner-05-night-court.jpg',
  'banner-06-mixed-doubles.jpg',
];

function dimSvg(width, height) {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="left" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0d120d" stop-opacity="0.82"/>
      <stop offset="0.55" stop-color="#0d120d" stop-opacity="0.38"/>
      <stop offset="1" stop-color="#0d120d" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#left)"/>
</svg>`);
}

function writeReplace(src, bytes) {
  const tmp = src + '.next';
  fs.writeFileSync(tmp, bytes);
  try {
    fs.copyFileSync(tmp, src);
    fs.unlinkSync(tmp);
    return src;
  } catch (err) {
    const fallback = src.replace(/\.jpg$/, '-photo.jpg');
    fs.renameSync(tmp, fallback);
    return fallback;
  }
}

async function run() {
  for (const name of FILES) {
    const src = path.join(APP_DIR, name);
    if (!fs.existsSync(src)) {
      console.log(name, 'missing, skip');
      continue;
    }
    const meta = await sharp(src).metadata();
    const leftW = Math.round(meta.width * 0.56);
    const blurred = await sharp(src)
      .extract({ left: 0, top: 0, width: leftW, height: meta.height })
      .blur(32)
      .toBuffer();
    const masked = await sharp(blurred)
      .composite([{ input: dimSvg(leftW, meta.height), top: 0, left: 0 }])
      .toBuffer();
    const out = await sharp(src)
      .composite([{ input: masked, top: 0, left: 0 }])
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();
    const dest = writeReplace(src, out);
    console.log(path.basename(dest), (out.length / 1024).toFixed(0) + 'KB');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
