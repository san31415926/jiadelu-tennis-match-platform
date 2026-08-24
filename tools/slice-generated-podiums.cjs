/**
 * 把生图出来的领奖台抠成透明 PNG，并裁掉四周空白。
 *
 * 生图时故意用纯蓝底（#0088FF 一类），这里按「蓝通道明显高于红绿」
 * 做色度抠图，再把金圈边缘残留的蓝边压掉一点。
 *
 * 运行：node tools/slice-generated-podiums.cjs
 */
const fsp = require('fs/promises');
const path = require('path');
const { createRequire } = require('module');

const toolRequire = createRequire(
  path.join(__dirname, '..', 'image-to-slice-tool', 'package.json')
);
const sharp = toolRequire('sharp');

const SRC = [
  {
    inFile: path.join(
      process.env.USERPROFILE,
      '.cursor',
      'projects',
      'd-Desktop',
      'assets',
      'podium-gen-1.png'
    ),
    outName: 'podium-unit-1.png',
  },
  {
    inFile: path.join(
      process.env.USERPROFILE,
      '.cursor',
      'projects',
      'd-Desktop',
      'assets',
      'podium-gen-2.png'
    ),
    outName: 'podium-unit-2.png',
  },
  {
    inFile: path.join(
      process.env.USERPROFILE,
      '.cursor',
      'projects',
      'd-Desktop',
      'assets',
      'podium-gen-3.png'
    ),
    outName: 'podium-unit-3.png',
  },
];

const OUT_DIR = path.join(__dirname, '..', 'miniprogram', 'assets', 'images', 'ranking');
const PREVIEW_DIR = path.join(__dirname, '..', 'ui-slices', 'output', 'ranking-units');

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

async function sliceOne(inFile, outName) {
  const { data, info } = await sharp(inFile)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const keyed = keyBlue(Buffer.from(data));

  const trimmed = await sharp(keyed, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 12 })
    .resize({ width: 520, withoutEnlargement: true })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();

  const meta = await sharp(trimmed).metadata();
  for (const dir of [OUT_DIR, PREVIEW_DIR]) {
    await fsp.mkdir(dir, { recursive: true });
    await fsp.writeFile(path.join(dir, outName), trimmed);
  }

  return { outName, width: meta.width, height: meta.height, bytes: trimmed.length };
}

async function run() {
  const report = [];
  for (const item of SRC) {
    report.push(await sliceOne(item.inFile, item.outName));
  }
  for (const row of report) {
    console.log(
      `${row.outName.padEnd(20)} ${String(row.width).padStart(4)}x${String(row.height).padStart(4)}  ${(
        row.bytes / 1024
      ).toFixed(1)} KB`
    );
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
