/**
 * 重新合成首页 / 超级杯轮播图。
 *
 * V5 首页 145:199 是直边头图，字由页面 WXML 叠上去，不要再画进 jpg，也不要白浪。
 * 原图是 3:2，画布按 750×320 从顶部裁切以免削掉头部。
 */
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');
const sharp = createRequire(
  path.join(__dirname, '../image-to-slice-tool/package.json'),
)('sharp');

const RAW_DIR = path.join(
  process.env.USERPROFILE,
  '.cursor/projects/d-Desktop/assets',
);
const TEST_DIR = path.join(__dirname, '../测试图/轮播图');
const APP_DIR = path.join(__dirname, '../miniprogram/assets/images/banners');
const TMP_DIR = path.join(APP_DIR, '_tmp');

const BANNERS = [
  {
    raw: 'banner-v3-01-union.png',
    out: 'banner-01-club-union',
    kicker: '俱乐部联赛',
    title: '广佛俱乐部联名赛',
    sub: '球员精彩瞬间 · 点击查看',
  },
  {
    raw: 'banner-v3-02-rookie.png',
    out: 'banner-02-rookie-cup',
    kicker: '新秀选拔',
    title: '俱乐部新秀杯',
    sub: '第二届 · 12 支球队集结',
  },
  {
    raw: 'banner-v3-03-gala.png',
    out: 'banner-03-ceremony',
    kicker: '年度盛典',
    title: '年度颁奖典礼',
    sub: '11 月 15 日 · 广州四季酒店',
  },
  {
    raw: 'banner-v3-04-champion.png',
    out: 'banner-04-super-cup',
    kicker: '冠军之夜',
    title: '超级杯冠军之夜',
    sub: '俱乐部荣耀时刻',
  },
  {
    raw: 'banner-v3-05-night.png',
    out: 'banner-05-night-court',
    kicker: '球场开放',
    title: '夜间球场开放',
    sub: '灯光球场 · 预约开打',
  },
  {
    raw: 'banner-v3-06-mixed.png',
    out: 'banner-06-mixed-doubles',
    kicker: '混双对决',
    title: '混双精彩对决',
    sub: '默契搭档 · 点击查看',
  },
];

const W = 1500;
const H = Math.round((1500 * 320) / 750);

function overlaySvg() {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 750 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="leftDim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0d120d" stop-opacity="0.42"/>
      <stop offset="0.36" stop-color="#0d120d" stop-opacity="0.12"/>
      <stop offset="0.62" stop-color="#0d120d" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="750" height="320" fill="url(#leftDim)"/>
</svg>`);
}

async function run() {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  fs.mkdirSync(APP_DIR, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });

  for (const item of BANNERS) {
    const src = path.join(RAW_DIR, item.raw);
    if (!fs.existsSync(src)) {
      throw new Error('missing ' + src);
    }

    const photo = await sharp(src)
      .resize(W, H, { fit: 'cover', position: 'north' })
      .toBuffer();

    const withDim = await sharp(photo)
      .composite([{ input: overlaySvg(), top: 0, left: 0 }])
      .toBuffer();

    fs.writeFileSync(
      path.join(TEST_DIR, item.out + '.png'),
      await sharp(withDim).png({ compressionLevel: 9 }).toBuffer(),
    );

    const jpg = await sharp(withDim)
      .jpeg({ quality: 72, mozjpeg: true })
      .toBuffer();
    fs.writeFileSync(path.join(TMP_DIR, item.out + '.jpg'), jpg);
    console.log(item.out, (jpg.length / 1024).toFixed(0) + 'KB');
  }

  for (const item of BANNERS) {
    const from = path.join(TMP_DIR, item.out + '.jpg');
    const to = path.join(APP_DIR, item.out + '.jpg');
    try {
      fs.unlinkSync(to);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
    fs.renameSync(from, to);
  }
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
