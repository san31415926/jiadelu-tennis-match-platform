/**
 * 把赛事详情八宫格生图抠透明，并拼一张两行四列预览图，方便过目。
 * 生图蓝底 #0088FF。运行：node tools/compose-event-detail-icons.cjs
 */
const fsp = require('fs/promises');
const path = require('path');
const { createRequire } = require('module');

const toolRequire = createRequire(
  path.join(__dirname, '..', 'image-to-slice-tool', 'package.json')
);
const sharp = toolRequire('sharp');

const ASSETS = path.join(
  process.env.USERPROFILE,
  '.cursor',
  'projects',
  'd-Desktop',
  'assets'
);
const OUT_DIR = path.join(__dirname, '..', '测试图', '赛事详情宫格');

const ICONS = [
  { file: 'event-icon-01-home.png', name: '01-首页.png', label: '首页' },
  { file: 'event-icon-02-info.png', name: '02-信息.png', label: '信息' },
  { file: 'event-icon-03-signup.png', name: '03-报名.png', label: '报名' },
  { file: 'event-icon-04-team.png', name: '04-组队.png', label: '组队' },
  { file: 'event-icon-05-photos.png', name: '05-图片.png', label: '图片' },
  { file: 'event-icon-06-bracket.png', name: '06-签表.png', label: '签表' },
  { file: 'event-icon-07-schedule.png', name: '07-赛程.png', label: '赛程' },
  { file: 'event-icon-08-results.png', name: '08-成绩.png', label: '成绩' },
];

function keyBlue(data) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const maxRG = Math.max(r, g);
    const blueExcess = b - maxRG;

    if (b > 90 && blueExcess > 28 && b > r * 1.15 && b > g * 1.15) {
      const t = Math.min(1, Math.max(0, (blueExcess - 18) / 70));
      data[i + 3] = Math.round(data[i + 3] * (1 - t));
      if (t > 0.35) {
        const keep = 1 - (t - 0.35);
        data[i] = Math.round(r * keep + 255 * (1 - keep) * 0.15);
        data[i + 1] = Math.round(g * keep);
        data[i + 2] = Math.min(b, Math.round(maxRG + 12));
      }
    }
  }
  return data;
}

async function punch(srcPath) {
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  const keyed = keyBlue(Buffer.from(data));
  return sharp(keyed, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 12 })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();
}

function svgLabel(text, selected) {
  const fill = selected ? '#1c1f21' : '#3a3f36';
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="160" height="48" viewBox="0 0 160 48" xmlns="http://www.w3.org/2000/svg">
  <text x="80" y="34" text-anchor="middle" font-size="28" font-weight="600"
    font-family="Microsoft YaHei, PingFang SC, sans-serif" fill="${fill}">${text}</text>
</svg>`);
}

async function run() {
  await fsp.mkdir(OUT_DIR, { recursive: true });

  const punched = [];
  for (const icon of ICONS) {
    const src = path.join(ASSETS, icon.file);
    const buf = await punch(src);
    punched.push(buf);
    await fsp.writeFile(path.join(OUT_DIR, icon.name), buf);
    console.log(icon.name, (buf.length / 1024).toFixed(1), 'KB punched');
  }

  const cols = 4;
  const tileW = 200;
  const tileH = 220;
  const gap = 16;
  const pad = 28;
  const iconSize = 118;
  const rows = 2;
  const width = pad * 2 + cols * tileW + (cols - 1) * gap;
  const height = pad * 2 + rows * tileH + (rows - 1) * gap;

  const composites = [];
  for (let i = 0; i < ICONS.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (tileW + gap);
    const y = pad + row * (tileH + gap);
    const selected = i === 0;
    const tileSvg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${tileW}" height="${tileH}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${tileW}" height="${tileH}" rx="28"
    fill="${selected ? '#b2e514' : '#f7f7f4'}"/>
</svg>`);
    composites.push({ input: tileSvg, left: x, top: y });

    const iconBuf = await sharp(punched[i])
      .resize(iconSize, iconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    composites.push({
      input: iconBuf,
      left: x + Math.round((tileW - iconSize) / 2),
      top: y + 28,
    });
    composites.push({
      input: await sharp(svgLabel(ICONS[i].label, selected)).png().toBuffer(),
      left: x + 20,
      top: y + 156,
    });
  }

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 236, g: 237, b: 232, alpha: 1 },
    },
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, '预览-八宫格.png'));

  console.log('wrote', OUT_DIR);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
