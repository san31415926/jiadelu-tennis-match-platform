/**
 * 把 Figma 导出的原始资产压缩落地到 miniprogram/assets。
 *
 * 输出尺寸按设计稿标注的显示尺寸（画板 750 宽 => 1px = 1rpx）取 2.2 倍，
 * 足够覆盖 3 倍屏，又不会让主包超过 2MB。
 * 运行前先执行 tools/fetch-figma-assets.ps1 下载原始资产。
 */
const fsp = require('fs/promises');
const path = require('path');
const { createRequire } = require('module');

const toolRequire = createRequire(
  path.join(__dirname, '..', 'image-to-slice-tool', 'package.json')
);
const sharp = toolRequire('sharp');

const RAW = path.join(__dirname, '.figma', 'raw');
const ASSETS = path.join(__dirname, '..', 'miniprogram', 'assets');

/** [源文件, 输出相对路径, 输出宽, 输出高(null=按比例)] */
const TASKS = [
  ['home-player-ranking.png', 'icons/home/player-ranking.png', 240, null],
  ['home-event-calendar.png', 'icons/home/event-calendar.png', 240, null],
  ['home-point-exchange.png', 'icons/home/point-exchange.png', 240, null],
  ['home-past-champions.png', 'icons/home/past-champions.png', 240, null],
  ['home-event-photos.png', 'icons/home/event-photos.png', 240, null],
  ['home-annual-ceremony.png', 'icons/home/annual-ceremony.png', 240, null],
  ['home-my-registrations.png', 'icons/home/my-registrations.png', 240, null],
  ['tab-super-cup.png', 'icons/tabbar/tab-super-cup.png', 176, null],
  ['tab-profile.png', 'icons/tabbar/tab-profile.png', 176, null],
];

/** 球场照片走 JPEG，圆角由 WXSS 负责；源图本身不大，不做放大 */
const PHOTO_TASKS = [['court-photo.png', 'images/court-photo.jpg', 572, null]];

async function run() {
  const report = [];

  for (const [source, target, width, height] of TASKS) {
    const out = path.join(ASSETS, target);
    await fsp.mkdir(path.dirname(out), { recursive: true });
    const meta = await sharp(path.join(RAW, source)).metadata();
    await sharp(path.join(RAW, source))
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9, effort: 10 })
      .toFile(out);
    const { size } = await fsp.stat(out);
    report.push([target, `${meta.width}x${meta.height}`, meta.hasAlpha ? '透明' : '不透明', size]);
  }

  for (const [source, target, width, height] of PHOTO_TASKS) {
    const out = path.join(ASSETS, target);
    await fsp.mkdir(path.dirname(out), { recursive: true });
    const meta = await sharp(path.join(RAW, source)).metadata();
    await sharp(path.join(RAW, source))
      .resize(width, height, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(out);
    const { size } = await fsp.stat(out);
    report.push([target, `${meta.width}x${meta.height}`, 'JPEG', size]);
  }

  let total = 0;
  for (const [target, srcSize, note, size] of report) {
    total += size;
    console.log(
      `${target.padEnd(38)} 源 ${srcSize.padEnd(12)} ${note.padEnd(8)} ${(size / 1024)
        .toFixed(1)
        .padStart(7)} KB`
    );
  }
  console.log(`\n共 ${report.length} 个文件，合计 ${(total / 1024).toFixed(1)} KB`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
