/**
 * 把旧轮播 jpg 里烤进去的白浪裁掉，只留照片。
 *
 * 旧合成脚本 compose-banners.cjs 把字和波浪都画进了图。
 * V5 首页 145:199 是直边 + 页面叠字，所以这里只裁照片，字改由 WXML 画。
 *
 * 波浪在 321 高画布里大约从 y=202 起。按这个比例裁顶上那一段，
 * 再铺一层左侧压暗，盖住图上原来的标题，避免和页面叠字重影。
 *
 * 运行：npx --yes -p sharp node tools/strip-banner-wave.cjs
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const APP_DIR = path.join(__dirname, '../miniprogram/assets/images/banners');
const TEST_DIR = path.join(__dirname, '../测试图/轮播图');
const WAVE_START = 202 / 321;
const OUT_W = 1500;
const OUT_H = Math.round((1500 * 320) / 750);

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
      <stop offset="0" stop-color="#0d120d" stop-opacity="0.92"/>
      <stop offset="0.38" stop-color="#0d120d" stop-opacity="0.55"/>
      <stop offset="0.68" stop-color="#0d120d" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#left)"/>
</svg>`);
}

async function run() {
  for (const name of FILES) {
    const src = path.join(APP_DIR, name);
    const meta = await sharp(src).metadata();
    // 底边已经是直边时不要再裁，否则会把照片放大两次。
    const probe = await sharp(src)
      .extract({
        left: 0,
        top: Math.max(0, meta.height - 8),
        width: meta.width,
        height: Math.min(8, meta.height),
      })
      .resize(1, 1, { fit: 'fill' })
      .raw()
      .toBuffer();
    const alreadyFlat = (probe[0] + probe[1] + probe[2]) / 3 < 160;
    if (alreadyFlat) {
      console.log(name, 'already flat, skip');
      continue;
    }
    const cropH = Math.max(1, Math.round(meta.height * WAVE_START));
    const photo = await sharp(src)
      .extract({ left: 0, top: 0, width: meta.width, height: cropH })
      .resize(OUT_W, OUT_H, { fit: 'cover', position: 'north' })
      .toBuffer();
    const flat = await sharp(photo)
      .composite([{ input: dimSvg(OUT_W, OUT_H), top: 0, left: 0 }])
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();
    const tmp = src + '.next';
    fs.writeFileSync(tmp, flat);
    try {
      fs.copyFileSync(tmp, src);
      fs.unlinkSync(tmp);
    } catch (err) {
      console.error(name, 'locked by another process, wrote', path.basename(tmp));
      continue;
    }
    const pngName = name.replace(/\.jpg$/, '.png');
    const testPng = path.join(TEST_DIR, pngName);
    if (fs.existsSync(testPng)) {
      fs.writeFileSync(
        testPng,
        await sharp(flat).png({ compressionLevel: 9 }).toBuffer(),
      );
    }
    console.log(name, (flat.length / 1024).toFixed(0) + 'KB');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
