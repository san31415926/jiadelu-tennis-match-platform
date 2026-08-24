/**
 * 把「我的资料」生图抠成透明 PNG。
 * 生图用纯蓝底 #0088FF，按蓝通道明显高于红绿做色度抠图。
 *
 * 运行：node tools/slice-profile-assets.cjs
 */
const fsp = require('fs/promises');
const path = require('path');
const { createRequire } = require('module');

const toolRequire = createRequire(
  path.join(__dirname, '..', 'image-to-slice-tool', 'package.json')
);
const sharp = toolRequire('sharp');

const RAW_DIR = path.join(
  process.env.USERPROFILE,
  '.cursor',
  'projects',
  'd-Desktop',
  'assets'
);
const OUT_DIR = path.join(__dirname, '..', 'ui-slices', 'output', 'profile-edit');

const SRC = [
  { inFile: path.join(RAW_DIR, 'profile-gold-ring-raw.png'), outName: 'gold-avatar-ring.png', width: 512 },
  { inFile: path.join(RAW_DIR, 'profile-camera-badge-raw.png'), outName: 'camera-badge.png', width: 256 },
  { inFile: path.join(RAW_DIR, 'profile-copy-icon-raw.png'), outName: 'copy-icon.png', width: 256 },
];

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

async function sliceOne(item) {
  const { data, info } = await sharp(item.inFile)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const keyed = keyBlue(Buffer.from(data));
  const trimmed = await sharp(keyed, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 12 })
    .resize({ width: item.width, withoutEnlargement: true })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();

  await fsp.mkdir(OUT_DIR, { recursive: true });
  await fsp.writeFile(path.join(OUT_DIR, item.outName), trimmed);
  const meta = await sharp(trimmed).metadata();
  return {
    outName: item.outName,
    width: meta.width,
    height: meta.height,
    bytes: trimmed.length,
  };
}

async function run() {
  const report = [];
  for (const item of SRC) {
    report.push(await sliceOne(item));
  }
  for (const row of report) {
    console.log(
      `${row.outName.padEnd(24)} ${String(row.width).padStart(4)}x${String(row.height).padStart(4)}  ${(
        row.bytes / 1024
      ).toFixed(1)} KB`
    );
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
