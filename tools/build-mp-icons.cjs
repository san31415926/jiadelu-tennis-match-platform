/**
 * 把设计稿切图资产整理进小程序 assets 目录。
 *
 * 三类来源：
 *   1. ui-slices 已切好的透明 PNG（首页宫格、超级杯宫格）—— 压缩转存
 *   2. 图标素材板（我的页菜单）—— 按 detect-icon-boxes 检测出的包围盒裁切后去背
 *   3. 页面定稿图（底栏 3D 图标）—— 底栏本身是白底，裁切后保留白底即可
 *
 * 坐标均由 tools/detect-icon-boxes.cjs 自动检测得到，不是目视估值。
 * 小程序主包上限 2MB，图标按显示尺寸的 3 倍输出。
 */
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { createRequire } = require('module');

const toolRequire = createRequire(
  path.join(__dirname, '..', 'image-to-slice-tool', 'package.json')
);
const sharp = toolRequire('sharp');

const ROOT = path.join(__dirname, '..');
const SLICES = path.join(ROOT, 'ui-slices', 'output');
const DESIGNS = path.join(ROOT, '测试图');
const OUT = path.join(ROOT, 'miniprogram', 'assets', 'icons');

/** 首页宫格：已有透明切图，文件名与定稿入口一一对应 */
const HOME_ICONS = [
  'player-ranking',
  'event-calendar',
  'point-exchange',
  'past-champions',
  'event-photos',
  'annual-ceremony',
  'my-registrations',
];

/** 超级杯宫格：已有透明切图 */
const SUPER_CUP_ICONS = [
  'super-cup-event',
  'rookie-cup-event',
  'women-club-event',
  'evergreen-cup-event',
  'club-leaderboard',
  'past-champions-laurel',
  'annual-best-medal',
  'club-badge',
];

/** 我的页菜单：1536x1024 素材板，包围盒来自自动检测 */
const PROFILE_MENU_BOARD = '图标-我的页菜单.png';
const PROFILE_MENU_ICONS = [
  ['profile-info', 165, 216, 264, 205],
  ['records-clipboard', 520, 142, 213, 298],
  ['my-club-flag', 856, 157, 233, 270],
  ['about-info', 1171, 198, 231, 234],
  ['business-handshake', 289, 604, 284, 216],
  ['share-friends', 661, 583, 203, 226],
  ['customer-service', 991, 589, 232, 238],
];

/**
 * 底栏图标只取未选中态（选中态的绿色光晕用 CSS 绘制）。
 * 两张 750 宽定稿图的底栏坐标一致，各取该 tab 未被选中的那一张。
 * 自动检测框含下方文字标签，这里收紧成只框住图标本体的正方形。
 */
const TABBAR_ICONS = [
  ['tab-events', 'me.png', 96, 1030, 62],
  ['tab-super-cup', 'me.png', 342, 1024, 68],
  ['tab-profile', 'supercup.png', 592, 1040, 68],
];

/** 首页/超级杯切图已透明，仅需去掉多余空边 */
async function emitTransparent(srcFile, outFile, size) {
  await sharp(srcFile)
    .trim({ threshold: 1 })
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, palette: true })
    .toFile(outFile);
  return (await fsp.stat(outFile)).size;
}

/**
 * 素材板去背：以四角背景色为基准，只把「与背景几乎完全相同」的像素
 * 从四边泛洪抹成透明。图标本体虽然也是近白色，但外轮廓有阴影阻断，
 * 泛洪进不去，因此内部白色能保留。
 */
async function removeBoardBackground(buffer, tolerance = 6) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const at = (x, y) => (y * width + x) * channels;
  const corners = [
    at(0, 0),
    at(width - 1, 0),
    at(0, height - 1),
    at(width - 1, height - 1),
  ];
  const bg = [0, 1, 2].map((i) =>
    Math.round(corners.reduce((sum, o) => sum + data[o + i], 0) / corners.length)
  );

  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const enqueue = (x, y) => {
    const index = y * width + x;
    if (visited[index]) return;
    const o = index * channels;
    if (data[o + 3] >= 8) {
      const diff =
        Math.abs(data[o] - bg[0]) +
        Math.abs(data[o + 1] - bg[1]) +
        Math.abs(data[o + 2] - bg[2]);
      if (diff > tolerance) return;
    }
    visited[index] = 1;
    queue[tail++] = index;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }
  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) enqueue(x - 1, y);
    if (x < width - 1) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y < height - 1) enqueue(x, y + 1);
  }

  let cleared = 0;
  for (let index = 0; index < visited.length; index += 1) {
    if (visited[index]) {
      data[index * channels + 3] = 0;
      cleared += 1;
    }
  }

  const buf = await sharp(data, { raw: { width, height, channels } })
    .png()
    .toBuffer();
  return { buffer: buf, clearedRatio: cleared / (width * height) };
}

async function run() {
  const report = [];

  for (const dir of ['home', 'super-cup', 'profile', 'tabbar']) {
    await fsp.rm(path.join(OUT, dir), { recursive: true, force: true });
    await fsp.mkdir(path.join(OUT, dir), { recursive: true });
  }

  for (const name of HOME_ICONS) {
    const src = path.join(SLICES, 'test-icons', 'primary-transparent', `${name}.png`);
    const bytes = await emitTransparent(src, path.join(OUT, 'home', `${name}.png`), 200);
    report.push(['home', name, bytes, '']);
  }

  for (const name of SUPER_CUP_ICONS) {
    const src = path.join(SLICES, 'super-cup-icons', `${name}.png`);
    if (!fs.existsSync(src)) {
      report.push(['super-cup', name, 0, '源文件缺失']);
      continue;
    }
    const bytes = await emitTransparent(
      src,
      path.join(OUT, 'super-cup', `${name}.png`),
      200
    );
    report.push(['super-cup', name, bytes, '']);
  }

  const board = path.join(DESIGNS, PROFILE_MENU_BOARD);
  for (const [name, left, top, width, height] of PROFILE_MENU_ICONS) {
    // 四边各留少量背景，保证泛洪有起点；留太多会带进下方文字标签
    const pad = 4;
    const cropped = await sharp(board)
      .extract({
        left: left - pad,
        top: top - pad,
        width: width + pad * 2,
        height: height + pad * 2,
      })
      .png()
      .toBuffer();
    const { buffer, clearedRatio } = await removeBoardBackground(cropped);
    const out = path.join(OUT, 'profile', `${name}.png`);
    await sharp(buffer)
      .trim({ threshold: 1 })
      .resize(140, 140, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9, palette: true })
      .toFile(out);
    const bytes = (await fsp.stat(out)).size;
    report.push([
      'profile',
      name,
      bytes,
      `去背 ${(clearedRatio * 100).toFixed(0)}%`,
    ]);
  }

  for (const [name, file, left, top, side] of TABBAR_ICONS) {
    // 底栏本身是白底，图标保留白底，裁成正方形避免出现色块边界
    const out = path.join(OUT, 'tabbar', `${name}.png`);
    await sharp(path.join(DESIGNS, file))
      .extract({ left, top, width: side, height: side })
      .resize(120, 120, { fit: 'cover' })
      .png({ compressionLevel: 9 })
      .toFile(out);
    const bytes = (await fsp.stat(out)).size;
    report.push(['tabbar', name, bytes, '保留白底']);
  }

  let total = 0;
  for (const [group, name, bytes, note] of report) {
    total += bytes;
    console.log(
      `${group.padEnd(11)} ${name.padEnd(24)} ${(bytes / 1024)
        .toFixed(1)
        .padStart(7)} KB  ${note}`
    );
  }
  console.log(`\n共 ${report.length} 个图标，合计 ${(total / 1024).toFixed(1)} KB`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
