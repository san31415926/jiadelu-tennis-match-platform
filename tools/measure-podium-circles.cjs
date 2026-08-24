/**
 * 从画面上半部中心 flood-fill 白色连通域，得到金圈内白圆。
 */
const path = require('path');
const { createRequire } = require('module');
const toolRequire = createRequire(
  path.join(__dirname, '..', 'image-to-slice-tool', 'package.json')
);
const sharp = toolRequire('sharp');

const DIR = path.join(__dirname, '..', 'miniprogram', 'assets', 'images', 'ranking');
const FILES = ['podium-unit-1.png', 'podium-unit-2.png', 'podium-unit-3.png'];

function isFill(r, g, b, a) {
  return a > 180 && r > 210 && g > 210 && b > 210 && Math.max(r, g, b) - Math.min(r, g, b) < 28;
}

async function measure(file) {
  const { data, info } = await sharp(path.join(DIR, file))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const seen = new Uint8Array(width * height);
  const stack = [];
  const seeds = [];
  for (let y = Math.floor(height * 0.08); y < Math.floor(height * 0.32); y += 4) {
    seeds.push([Math.floor(width / 2), y]);
    seeds.push([Math.floor(width / 2) - 20, y]);
    seeds.push([Math.floor(width / 2) + 20, y]);
  }

  let start = null;
  for (const [sx, sy] of seeds) {
    const i = (sy * width + sx) * 4;
    if (isFill(data[i], data[i + 1], data[i + 2], data[i + 3])) {
      start = [sx, sy];
      break;
    }
  }
  if (!start) return { file, width, height, error: 'no seed' };

  stack.push(start);
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let count = 0;
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const idx = y * width + x;
    if (seen[idx]) continue;
    const i = idx * 4;
    if (!isFill(data[i], data[i + 1], data[i + 2], data[i + 3])) continue;
    seen[idx] = 1;
    count += 1;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const dw = maxX - minX;
  const dh = maxY - minY;
  const d = Math.min(dw, dh);
  return {
    file,
    image: `${width}x${height}`,
    seed: start,
    count,
    box: { minX, minY, maxX, maxY, dw, dh },
    circlePx: { cx: Math.round(cx), cy: Math.round(cy), d: Math.round(d) },
    cssPct: {
      left: +((cx - d / 2) / width).toFixed(4),
      top: +((cy - d / 2) / height).toFixed(4),
      sizeW: +(d / width).toFixed(4),
      sizeH: +(d / height).toFixed(4),
    },
  };
}

(async () => {
  const out = [];
  for (const f of FILES) out.push(await measure(f));
  console.log(JSON.stringify(out, null, 2));
})();
