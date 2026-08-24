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

  // 超级杯宫格（node 1:340），设计中统一显示为 110x105
  ['sc-super-cup-event.png', 'icons/super-cup/super-cup-event.png', 240, null],
  ['sc-rookie-cup-event.png', 'icons/super-cup/rookie-cup-event.png', 240, null],
  ['sc-women-club-event.png', 'icons/super-cup/women-club-event.png', 240, null],
  ['sc-evergreen-cup-event.png', 'icons/super-cup/evergreen-cup-event.png', 240, null],
  ['sc-club-leaderboard.png', 'icons/super-cup/club-leaderboard.png', 240, null],
  ['sc-past-champions.png', 'icons/super-cup/past-champions.png', 240, null],
  ['sc-annual-best.png', 'icons/super-cup/annual-best.png', 240, null],
  ['sc-club-badge.png', 'icons/super-cup/club-badge.png', 240, null],

  // 我的页菜单（node 10:234），设计中统一显示为 88x88
  ['my-menu-profile.png', 'icons/profile/profile-info.png', 200, null],
  ['my-menu-business.png', 'icons/profile/business-handshake.png', 200, null],
  ['my-menu-about.png', 'icons/profile/about-us.png', 200, null],
  ['my-menu-club.png', 'icons/profile/my-club-flag.png', 200, null],
  ['my-menu-records.png', 'icons/profile/records-trophy.png', 200, null],
  ['my-menu-service.png', 'icons/profile/customer-service.png', 200, null],

  // 我的页头部装饰：金框头像 255x187、网球 133x116
  ['my-gold-avatar-frame.png', 'images/gold-avatar-frame.png', 510, null],
  ['my-tennis-ball.png', 'images/hero-tennis-ball.png', 266, null],
  // 我的资料金圈 + 相机（透明圆孔，可套真实头像）
  ['gold-avatar-ring.png', 'images/gold-avatar-ring.png', 422, 422],
  ['camera-badge.png', 'icons/profile/camera-badge.png', 128, 128],

  // 榜单页装饰与领奖台（node 15:18）
  ['rk-confetti.png', 'images/ranking/confetti.png', 330, null],
  ['rk-podium-first.png', 'images/ranking/podium-first.png', 528, null],
  ['rk-podium-second.png', 'images/ranking/podium-second.png', 506, null],
  ['rk-podium-third.png', 'images/ranking/podium-third.png', 506, null],
  ['rk-gold-frame.png', 'images/ranking/gold-frame.png', 400, null],
  ['rk-laurel-first.png', 'images/ranking/laurel-first.png', 500, null],
  ['rk-my-trophy.png', 'images/ranking/my-trophy.png', 160, null],

  // 俱乐部页（node 23:345 / 23:368）
  ['cb-flag.png', 'images/club/header-flag.png', 640, null],

  // 相册页（node 23:274）
  ['gl-camera.png', 'images/gallery/header-camera.png', 660, null],
];

/**
 * 照片类资产走 JPEG，圆角与裁切由 WXSS 负责。
 * 榜单头像是示例数据，接入云开发后应改为云存储网络图。
 */
const PHOTO_TASKS = [
  ['court-photo.png', 'images/court-photo.jpg', 572, null],
  ['rk-avatar-demo.png', 'images/ranking/avatar-demo.jpg', 240, null],
  ['rk-avatar-4.png', 'images/ranking/avatar-4.jpg', 160, null],
  ['rk-avatar-5.png', 'images/ranking/avatar-5.jpg', 160, null],
  ['rk-avatar-6.png', 'images/ranking/avatar-6.jpg', 160, null],

  // 俱乐部 logo 是示例数据，圆角由 WXSS 负责
  ['cb-logo-1.png', 'images/club/logo-1.jpg', 256, null],
  ['cb-logo-2.png', 'images/club/logo-2.jpg', 256, null],
  ['cb-logo-3.png', 'images/club/logo-3.jpg', 256, null],
  ['cb-logo-4.png', 'images/club/logo-4.jpg', 256, null],
  ['cb-logo-5.png', 'images/club/logo-5.jpg', 256, null],
  ['cb-logo-6.png', 'images/club/logo-6.jpg', 256, null],

  // 相册照片与对阵图，显示尺寸 293x184 与 190x126
  ['gl-bracket-1.png', 'images/gallery/bracket-1.jpg', 586, null],
  ['gl-bracket-2.png', 'images/gallery/bracket-2.jpg', 586, null],
  ['gl-p1.png', 'images/gallery/photo-1.jpg', 380, null],
  ['gl-p2.png', 'images/gallery/photo-2.jpg', 380, null],
  ['gl-p3.png', 'images/gallery/photo-3.jpg', 380, null],
  ['gl-p4.png', 'images/gallery/photo-4.jpg', 380, null],
  ['gl-p5.png', 'images/gallery/photo-5.jpg', 380, null],
  ['gl-p6.png', 'images/gallery/photo-6.jpg', 380, null],
];

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
