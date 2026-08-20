/**
 * 自动检测图标素材板上每个图标的包围盒。
 *
 * 素材板背景为均匀浅色，图标的阴影与彩色部分与背景有色差，
 * 用「行投影找图标行 -> 行内列投影找单个图标」两步定位，
 * 再按 band 高度过滤掉文字标签行。
 *
 * 用法：node tools/detect-icon-boxes.cjs <测试图下的文件名> [最小图标高度] [left top width height]
 * 给出区域时只在该区域内检测，输出坐标已换算回原图。
 */
const path = require('path');
const { createRequire } = require('module');

const toolRequire = createRequire(
  path.join(__dirname, '..', 'image-to-slice-tool', 'package.json')
);
const sharp = toolRequire('sharp');

const [fileName, minBandHeightArg, ...regionArgs] = process.argv.slice(2);
const MIN_BAND_HEIGHT = Number(minBandHeightArg || 70);
const COLOR_TOLERANCE = 8;
const REGION =
  regionArgs.length === 4
    ? {
        left: Number(regionArgs[0]),
        top: Number(regionArgs[1]),
        width: Number(regionArgs[2]),
        height: Number(regionArgs[3]),
      }
    : null;

/** 找出连续的非零区段 */
function findRuns(counts, minCount, minLength) {
  const runs = [];
  let start = -1;
  for (let i = 0; i < counts.length; i += 1) {
    const active = counts[i] >= minCount;
    if (active && start < 0) {
      start = i;
    } else if (!active && start >= 0) {
      if (i - start >= minLength) runs.push([start, i - 1]);
      start = -1;
    }
  }
  if (start >= 0 && counts.length - start >= minLength) {
    runs.push([start, counts.length - 1]);
  }
  return runs;
}

async function run() {
  const src = path.join(__dirname, '..', '测试图', fileName);
  const pipeline = sharp(src);
  if (REGION) {
    pipeline.extract(REGION);
  }
  const { data, info } = await pipeline
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const offsetX = REGION ? REGION.left : 0;
  const offsetY = REGION ? REGION.top : 0;

  const pixelAt = (x, y) => {
    const o = (y * width + x) * channels;
    return [data[o], data[o + 1], data[o + 2], data[o + 3]];
  };

  // 背景色取四角平均
  const corners = [
    pixelAt(2, 2),
    pixelAt(width - 3, 2),
    pixelAt(2, height - 3),
    pixelAt(width - 3, height - 3),
  ];
  const bg = [0, 1, 2].map((i) =>
    Math.round(corners.reduce((sum, c) => sum + c[i], 0) / corners.length)
  );

  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = pixelAt(x, y);
      if (a < 8) continue;
      const diff =
        Math.abs(r - bg[0]) + Math.abs(g - bg[1]) + Math.abs(b - bg[2]);
      if (diff > COLOR_TOLERANCE) mask[y * width + x] = 1;
    }
  }

  const rowCounts = new Int32Array(height);
  for (let y = 0; y < height; y += 1) {
    let count = 0;
    for (let x = 0; x < width; x += 1) count += mask[y * width + x];
    rowCounts[y] = count;
  }

  const bands = findRuns(rowCounts, Math.max(3, width * 0.004), 8).filter(
    ([top, bottom]) => bottom - top + 1 >= MIN_BAND_HEIGHT
  );

  console.log(`图片 ${fileName}  ${width}x${height}  背景 rgb(${bg.join(',')})`);
  console.log(`检测到 ${bands.length} 个图标行\n`);

  const boxes = [];
  bands.forEach(([top, bottom], bandIndex) => {
    const bandHeight = bottom - top + 1;
    const colCounts = new Int32Array(width);
    for (let x = 0; x < width; x += 1) {
      let count = 0;
      for (let y = top; y <= bottom; y += 1) count += mask[y * width + x];
      colCounts[x] = count;
    }
    const cols = findRuns(colCounts, 2, Math.round(bandHeight * 0.15));

    cols.forEach(([left, right], colIndex) => {
      // 在该列范围内重新收紧上下边界
      let realTop = bottom;
      let realBottom = top;
      for (let y = top; y <= bottom; y += 1) {
        for (let x = left; x <= right; x += 1) {
          if (mask[y * width + x]) {
            if (y < realTop) realTop = y;
            if (y > realBottom) realBottom = y;
            break;
          }
        }
      }
      const box = {
        row: bandIndex + 1,
        col: colIndex + 1,
        left: left + offsetX,
        top: realTop + offsetY,
        width: right - left + 1,
        height: realBottom - realTop + 1,
      };
      boxes.push(box);
      console.log(
        `第${box.row}行 第${String(box.col).padStart(2)}个  ` +
          `left=${String(box.left).padStart(4)} top=${String(box.top).padStart(4)} ` +
          `w=${String(box.width).padStart(4)} h=${String(box.height).padStart(4)}  ` +
          `中心=(${Math.round(box.left + box.width / 2)},${Math.round(box.top + box.height / 2)})`
      );
    });
  });

  console.log('\nJSON:');
  console.log(JSON.stringify(boxes));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
