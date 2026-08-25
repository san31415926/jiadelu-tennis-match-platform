/**
 * 相册头图相机：蓝底 #0088FF 抠透明。
 * 运行：node tools/cut-gallery-camera.cjs
 */
const fsp = require('fs/promises');
const path = require('path');
const { createRequire } = require('module');

const toolRequire = createRequire(
  path.join(__dirname, '..', 'image-to-slice-tool', 'package.json')
);
const sharp = toolRequire('sharp');

const SRC = path.join(
  process.env.USERPROFILE,
  '.cursor',
  'projects',
  'd-Desktop',
  'assets',
  'gallery-header-camera-raw.png'
);
const OUT_HI = path.join(
  process.env.USERPROFILE,
  '.cursor',
  'projects',
  'd-Desktop',
  'assets',
  'gallery-header-camera.png'
);
const OUT_MP = path.join(
  __dirname,
  '..',
  'miniprogram',
  'assets',
  'images',
  'gallery',
  'header-camera.png'
);

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
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  const keyed = keyBlue(Buffer.from(data));
  const cut = sharp(keyed, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).trim({ threshold: 12 });

  await cut
    .clone()
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(OUT_HI);

  await fsp.mkdir(path.dirname(OUT_MP), { recursive: true });
  await sharp(OUT_HI)
    .resize(520, null, {
      fit: 'inside',
      withoutEnlargement: true,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(OUT_MP);

  const hi = await sharp(OUT_HI).metadata();
  const mp = await sharp(OUT_MP).metadata();
  const hiStat = await fsp.stat(OUT_HI);
  const mpStat = await fsp.stat(OUT_MP);
  console.log(
    JSON.stringify(
      {
        hi: `${hi.width}x${hi.height} ${(hiStat.size / 1024).toFixed(1)}KB`,
        mp: `${mp.width}x${mp.height} ${(mpStat.size / 1024).toFixed(1)}KB`,
      },
      null,
      2
    )
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
