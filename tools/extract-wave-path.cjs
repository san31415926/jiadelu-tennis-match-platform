/**
 * 从定稿图中提取头部渐变区底部的波浪曲线，生成小程序可用的 SVG path。
 *
 * 逐列从上往下扫描，找到「绿色渐变」变为「页面浅底」的那一行，
 * 得到边界点集后按等距采样输出 viewBox 为 0 0 750 <h> 的 path。
 *
 * 用法：node tools/extract-wave-path.cjs <测试图下的文件名> [起始扫描行]
 */
const path = require('path');
const { createRequire } = require('module');

const toolRequire = createRequire(
  path.join(__dirname, '..', 'image-to-slice-tool', 'package.json')
);
const sharp = toolRequire('sharp');

const [fileName, scanFromArg] = process.argv.slice(2);
const SAMPLE_COUNT = 24;

/** 页面浅底接近白色；渐变绿的 G 通道显著高于 B */
function isPageBackground(r, g, b) {
  return Math.min(r, g, b) > 232;
}

async function run() {
  const src = path.join(__dirname, '..', '测试图', fileName);
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const scanFrom = Number(scanFromArg || Math.round(height * 0.1));

  const boundary = new Array(width).fill(null);
  for (let x = 0; x < width; x += 1) {
    for (let y = scanFrom; y < height; y += 1) {
      const o = (y * width + x) * channels;
      if (isPageBackground(data[o], data[o + 1], data[o + 2])) {
        boundary[x] = y;
        break;
      }
    }
  }

  const valid = boundary.filter((v) => v !== null);
  if (valid.length < width * 0.5) {
    console.error('未能识别出足够的边界点，请调整起始扫描行');
    process.exit(1);
  }

  const minY = Math.min(...valid);
  const maxY = Math.max(...valid);

  // 归一化到 750 宽、波浪自身高度的 viewBox
  const viewWidth = 750;
  const viewHeight = Math.max(1, Math.round(((maxY - minY) * viewWidth) / width));

  const points = [];
  for (let i = 0; i < SAMPLE_COUNT; i += 1) {
    const x = Math.round((i * (width - 1)) / (SAMPLE_COUNT - 1));
    const y = boundary[x] ?? minY;
    points.push([
      Math.round((x * viewWidth) / width),
      Math.round(((y - minY) * viewWidth) / width),
    ]);
  }

  // 用 Catmull-Rom 转三次贝塞尔，得到平滑曲线
  const segments = [`M${points[0][0]},${points[0][1]}`];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1x = Math.round(p1[0] + (p2[0] - p0[0]) / 6);
    const c1y = Math.round(p1[1] + (p2[1] - p0[1]) / 6);
    const c2x = Math.round(p2[0] - (p3[0] - p1[0]) / 6);
    const c2y = Math.round(p2[1] - (p3[1] - p1[1]) / 6);
    segments.push(`C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`);
  }
  segments.push(`L${viewWidth},${viewHeight}`, 'L0,' + viewHeight, 'Z');

  const d = segments.join(' ');

  console.log(`源图 ${fileName} ${width}x${height}`);
  console.log(`渐变区底部边界 y: ${minY} ~ ${maxY}（原图像素）`);
  console.log(`换算到 750 宽后，头部高度 ${Math.round((minY * viewWidth) / width)}rpx，波浪高度 ${viewHeight}rpx`);
  console.log(`\nviewBox="0 0 ${viewWidth} ${viewHeight}"`);
  console.log(`\npath d:\n${d}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
