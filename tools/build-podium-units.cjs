/**
 * 把「一座领奖台 + 一个金圈」合成三张透明 PNG，给榜单页用。
 *
 * 【为什么要合成】
 * 设计里每个名次都是「台座 + 台上的金圈」成套出现。台和圈分开切时，
 * 在小程序里很难对齐，看起来会像两件东西飘在一起。合成一张以后，
 * 圈永远坐在台顶上，头像再叠在圈的白色圆心上。
 *
 * 【源文件】
 * 全部来自 Figma 节点导出（node 15:24 / 15:25 / 15:26 / 15:39 / 15:45），
 * 不是手画，也不是从整页截图上裁。金圈用 raw 图层，避免把设计稿里
 * 烘焙进去的示例头像带上。
 *
 * 【坐标】
 * 全部按 Figma 榜单领奖台区域（node 15:18）的标注，单位是设计稿 px，
 * 输出按 2 倍放大。改位置去对 Figma，不要在这里估。
 *
 * 运行：在仓库根目录执行  node tools/build-podium-units.cjs
 */
const fsp = require('fs/promises');
const path = require('path');
const { createRequire } = require('module');

const toolRequire = createRequire(
  path.join(__dirname, '..', 'image-to-slice-tool', 'package.json')
);
const sharp = toolRequire('sharp');

const RAW = path.join(__dirname, '.figma', 'raw');
const OUT_DIR = path.join(__dirname, '..', 'miniprogram', 'assets', 'images', 'ranking');
const PREVIEW_DIR = path.join(__dirname, '..', 'ui-slices', 'output', 'ranking-units');
const SCALE = 2;

function px(n) {
  return Math.round(n * SCALE);
}

async function loadLayer(file, width, height) {
  return sharp(path.join(RAW, file))
    .resize(px(width), px(height), {
      fit: 'fill',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function compose(fileName, canvasW, canvasH, layers) {
  const inputs = [];
  for (const layer of layers) {
    inputs.push({
      input: await loadLayer(layer.file, layer.width, layer.height),
      left: px(layer.left),
      top: px(layer.top),
    });
  }

  const image = sharp({
    create: {
      width: px(canvasW),
      height: px(canvasH),
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(inputs)
    .png({ compressionLevel: 9, effort: 10 });

  const buffer = await image.toBuffer();
  for (const dir of [OUT_DIR, PREVIEW_DIR]) {
    await fsp.mkdir(dir, { recursive: true });
    await fsp.writeFile(path.join(dir, fileName), buffer);
  }
  return buffer.length;
}

async function run() {
  /**
   * 冠军：台座 (263,160) 240×190 + 桂冠金圈 (291,73) 226×145
   * 画布原点取两者左上最小点 (263,73)，尺寸 254×277
   */
  const firstBytes = await compose(
    'podium-unit-1.png',
    254,
    277,
    [
      {
        file: 'rk-podium-first-export.png',
        left: 0,
        top: 87,
        width: 240,
        height: 190,
      },
      {
        file: 'rk-laurel-export.png',
        left: 28,
        top: 0,
        width: 226,
        height: 145,
      },
    ]
  );

  /**
   * 亚军：台座 (85,210) 230×160 + 金圈 (95,105) 181×165
   * 画布原点 (85,105)，尺寸 230×265
   */
  const secondBytes = await compose(
    'podium-unit-2.png',
    230,
    265,
    [
      {
        file: 'rk-podium-second-export.png',
        left: 0,
        top: 105,
        width: 230,
        height: 160,
      },
      {
        file: 'rk-gold-frame-raw1.png',
        left: 10,
        top: 0,
        width: 181,
        height: 165,
      },
    ]
  );

  /**
   * 季军：台座 (495,210) 230×160 + 金圈 (503,121) 181×165
   * 画布原点 (495,121)，尺寸 230×249
   */
  const thirdBytes = await compose(
    'podium-unit-3.png',
    230,
    249,
    [
      {
        file: 'rk-podium-third-export.png',
        left: 0,
        top: 89,
        width: 230,
        height: 160,
      },
      {
        file: 'rk-gold-frame-raw1.png',
        left: 8,
        top: 0,
        width: 181,
        height: 165,
      },
    ]
  );

  console.log(`podium-unit-1.png  ${(firstBytes / 1024).toFixed(1)} KB`);
  console.log(`podium-unit-2.png  ${(secondBytes / 1024).toFixed(1)} KB`);
  console.log(`podium-unit-3.png  ${(thirdBytes / 1024).toFixed(1)} KB`);
  console.log(`已写入 ${OUT_DIR}`);
  console.log(`预览副本 ${PREVIEW_DIR}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
