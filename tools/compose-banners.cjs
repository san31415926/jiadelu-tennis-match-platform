/**
 * 重新合成首页 / 超级杯轮播图。
 *
 * 版式按终稿 Figma node 1:233 / 1:234：主标题 36、副标题 19，字在左、人在右。
 * 原图是 3:2，画布是 750×321，从顶部裁切以免削掉头部。
 * 底部波浪仍按设计稿路径填 #FBFFF4，和页面 CSS 波浪对齐。
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

const FONT_BOLD = fs.readFileSync('C:/Windows/Fonts/Dengb.ttf').toString('base64');

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
const H = Math.round((1500 * 321) / 750);

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** JPEG 在画布最底一排常压出深色像素，合成后用页面底色盖住。 */
async function coverBottomSeam(buf, rows = 12) {
  const { width, height } = await sharp(buf).metadata();
  const bar = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${rows}"><rect width="100%" height="100%" fill="#FBFFF4"/></svg>`,
  );
  return sharp(buf)
    .composite([{ input: bar, top: height - rows, left: 0 }])
    .toBuffer();
}

function overlaySvg(item) {
  const kicker = escapeXml(item.kicker);
  const title = escapeXml(item.title);
  const sub = escapeXml(item.sub);

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 750 321" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>@font-face{font-family:Dengb;src:url(data:font/ttf;base64,${FONT_BOLD});}</style>
    <linearGradient id="leftDim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#050805" stop-opacity="0.22"/>
      <stop offset="0.36" stop-color="#050805" stop-opacity="0.08"/>
      <stop offset="0.58" stop-color="#050805" stop-opacity="0"/>
    </linearGradient>
    <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.8" flood-color="#000000" flood-opacity="0.55"/>
    </filter>
  </defs>
  <rect width="750" height="321" fill="url(#leftDim)"/>
  <path d="M0 260C92 219 166 291 263 273C343 258 373 230 448 258C546 293 628 238 750 202V321H0V260Z" fill="#FBFFF4"/>
  <rect x="0" y="312" width="750" height="10" fill="#FBFFF4"/>
  <text x="48" y="64" font-family="Dengb" font-size="13" fill="#D4F34A" filter="url(#textShadow)">${kicker}</text>
  <rect x="48" y="74" width="28" height="3" rx="1.5" fill="#D4F34A"/>
  <text x="48" y="122" font-family="Dengb" font-size="36" fill="#FFFFFF" filter="url(#textShadow)">${title}</text>
  <text x="48" y="154" font-family="Dengb" font-size="19" fill="#F4F7EA" opacity="0.9" filter="url(#textShadow)">${sub}</text>
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

    const withText = await coverBottomSeam(
      await sharp(photo)
        .composite([{ input: overlaySvg(item), top: 0, left: 0 }])
        .toBuffer(),
    );

    fs.writeFileSync(
      path.join(TEST_DIR, item.out + '.png'),
      await sharp(withText).png({ compressionLevel: 9 }).toBuffer(),
    );

    const jpg = await sharp(withText)
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
