/**
 * 把赛事详情八宫格压到主包显示尺寸（56rpx × 2.2 ≈ 128）。
 * 源图已在 测试图/赛事详情宫格/ 抠过透明。
 * 运行：node tools/build-event-detail-icons.cjs
 */
const fsp = require('fs/promises');
const path = require('path');
const { createRequire } = require('module');

const toolRequire = createRequire(
  path.join(__dirname, '..', 'image-to-slice-tool', 'package.json')
);
const sharp = toolRequire('sharp');

const SRC = path.join(__dirname, '..', '测试图', '赛事详情宫格');
const OUT = path.join(__dirname, '..', 'miniprogram', 'assets', 'icons', 'event-detail');

const FILES = [
  ['01-首页.png', 'home.png'],
  ['02-信息.png', 'info.png'],
  ['03-报名.png', 'signup.png'],
  ['04-组队.png', 'team.png'],
  ['05-图片.png', 'photos.png'],
  ['06-签表.png', 'bracket.png'],
  ['07-赛程.png', 'schedule.png'],
  ['08-成绩.png', 'results.png'],
];

async function run() {
  await fsp.mkdir(OUT, { recursive: true });
  for (const [from, to] of FILES) {
    const buf = await sharp(path.join(SRC, from))
      .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, effort: 10 })
      .toBuffer();
    await fsp.writeFile(path.join(OUT, to), buf);
    console.log(to, (buf.length / 1024).toFixed(1), 'KB');
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
