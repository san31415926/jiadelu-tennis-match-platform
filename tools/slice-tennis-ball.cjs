/**
 * 把新网球生图抠成透明 PNG，覆盖小程序里的旧切图。
 * 运行：node tools/slice-tennis-ball.cjs
 */
const fsp = require('fs/promises');
const path = require('path');
const { createRequire } = require('module');

const toolRequire = createRequire(
  path.join(__dirname, '..', 'image-to-slice-tool', 'package.json')
);
const sharp = toolRequire('sharp');

const RAW = path.join(
  process.env.USERPROFILE,
  '.cursor',
  'projects',
  'd-Desktop',
  'assets',
  'tennis-ball-raw.png'
);
const OUTS = [
  path.join(__dirname, '..', 'miniprogram', 'assets', 'images', 'hero-tennis-ball.png'),
  path.join(__dirname, '..', 'ui-slices', 'output', 'profile-edit', 'tennis-ball.png'),
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

async function run() {
  const { data, info } = await sharp(RAW).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const keyed = keyBlue(Buffer.from(data));
  const png = await sharp(keyed, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 12 })
    .resize({ width: 400, withoutEnlargement: true })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();

  for (const out of OUTS) {
    await fsp.mkdir(path.dirname(out), { recursive: true });
    await fsp.writeFile(out, png);
  }
  const meta = await sharp(png).metadata();
  console.log(`${meta.width}x${meta.height}  ${(png.length / 1024).toFixed(1)} KB`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
