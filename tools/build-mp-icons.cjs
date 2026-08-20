/**
 * 从图标素材板切出「我的」页菜单图标。
 *
 * 这是临时方案：素材板上图标的白色部分与背景是同一个色值（rgb(248,247,245)），
 * 算法上无法完全分离，只能靠图标外轮廓的阴影阻断泛洪来保住内部白色。
 * 待读取 Figma node 10:211（我的页）后，改用 tools/build-figma-assets.cjs
 * 落地 Figma 导出的透明版并删除本脚本的产物。
 *
 * 其余图标（首页宫格、底栏、球场照片）已全部来自 Figma 导出，
 * 由 tools/build-figma-assets.cjs 负责，本脚本不再触碰那些目录。
 *
 * 包围盒坐标由 tools/detect-icon-boxes.cjs 自动检测得到，不是目视估值。
 */
const fsp = require('fs/promises');
const path = require('path');
const { createRequire } = require('module');

const toolRequire = createRequire(
  path.join(__dirname, '..', 'image-to-slice-tool', 'package.json')
);
const sharp = toolRequire('sharp');

const ROOT = path.join(__dirname, '..');
const DESIGNS = path.join(ROOT, '测试图');
const OUT = path.join(ROOT, 'miniprogram', 'assets', 'icons', 'profile');

const BOARD = '图标-我的页菜单.png';
const ICONS = [
  ['profile-info', 165, 216, 264, 205],
  ['records-clipboard', 520, 142, 213, 298],
  ['my-club-flag', 856, 157, 233, 270],
  ['about-info', 1171, 198, 231, 234],
  ['business-handshake', 289, 604, 284, 216],
  ['share-friends', 661, 583, 203, 226],
  ['customer-service', 991, 589, 232, 238],
];

/**
 * 以四角背景色为基准，只把「与背景几乎完全相同」的像素从四边泛洪抹成透明。
 * 容差必须小：图标本体也是近白色，靠外轮廓阴影（色差超出容差）挡住泛洪。
 */
async function removeBoardBackground(buffer, tolerance = 6) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const at = (x, y) => (y * width + x) * channels;
  const corners = [at(0, 0), at(width - 1, 0), at(0, height - 1), at(width - 1, height - 1)];
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

  const out = await sharp(data, { raw: { width, height, channels } }).png().toBuffer();
  return { buffer: out, clearedRatio: cleared / (width * height) };
}

async function run() {
  await fsp.mkdir(OUT, { recursive: true });
  const board = path.join(DESIGNS, BOARD);
  let total = 0;

  for (const [name, left, top, width, height] of ICONS) {
    // 四边各留少量背景作为泛洪起点；留太多会把下方文字标签带进来
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
    const out = path.join(OUT, `${name}.png`);
    await sharp(buffer)
      .trim({ threshold: 1 })
      .resize(140, 140, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9, effort: 10 })
      .toFile(out);

    const { size } = await fsp.stat(out);
    total += size;
    console.log(
      `${name.padEnd(24)} ${(size / 1024).toFixed(1).padStart(7)} KB  去背 ${(
        clearedRatio * 100
      ).toFixed(0)}%`
    );
  }

  console.log(`\n共 ${ICONS.length} 个图标，合计 ${(total / 1024).toFixed(1)} KB`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
