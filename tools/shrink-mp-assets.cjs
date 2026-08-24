/**
 * 把主包图片再压一档，尽量过代码质量「主包 < 1.5MB」。
 * 运行：node tools/shrink-mp-assets.cjs
 */
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { createRequire } = require('module');

const toolRequire = createRequire(
  path.join(__dirname, '..', 'image-to-slice-tool', 'package.json')
);
const sharp = toolRequire('sharp');

const ASSETS = path.join(__dirname, '..', 'miniprogram', 'assets');

/** 显示尺寸 2.2 倍封顶，再大也只是浪费主包 */
const PNG_CAP = {
  'images/hero-tennis-ball.png': 266,
  'images/gold-avatar-ring.png': 422,
  'images/gold-avatar-frame.png': 0, // 删除，页面已改用 gold-avatar 组件
  'images/gallery/header-camera.png': 520,
  'images/club/header-flag.png': 500,
  'images/ranking/podium-unit-1.png': 528,
  'images/ranking/podium-unit-2.png': 484,
  'images/ranking/podium-unit-3.png': 484,
  'icons/profile/vip-wheat-tennis.png': 240,
  'icons/profile/camera-badge.png': 128,
  'icons/profile/share-friends.png': 160,
};

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

async function shrinkPng(file, maxWidth) {
  const orig = (await fsp.stat(file)).size;
  const meta = await sharp(file).metadata();
  const base = () => {
    let pipeline = sharp(file).rotate();
    if (maxWidth && meta.width > maxWidth) {
      pipeline = pipeline.resize(maxWidth, null, { withoutEnlargement: true });
    }
    return pipeline;
  };
  const paletted = await base()
    .png({ compressionLevel: 9, effort: 10, palette: true, quality: 80, colours: 128 })
    .toBuffer();
  const raw = await base().png({ compressionLevel: 9, effort: 10 }).toBuffer();
  const out = paletted.length < raw.length * 0.92 ? paletted : raw;
  if (out.length < orig) {
    await fsp.writeFile(file, out);
  }
  return { orig, next: Math.min(out.length, orig) };
}

async function shrinkJpeg(file) {
  const orig = (await fsp.stat(file)).size;
  const meta = await sharp(file).metadata();
  let pipeline = sharp(file).rotate();
  if (meta.width > 900) {
    pipeline = pipeline.resize(900, null, { withoutEnlargement: true });
  }
  const out = await pipeline.jpeg({ quality: 70, mozjpeg: true }).toBuffer();
  if (out.length < orig) {
    await fsp.writeFile(file, out);
  }
  return { orig, next: Math.min(out.length, orig) };
}

async function run() {
  const frame = path.join(ASSETS, 'images/gold-avatar-frame.png');
  if (fs.existsSync(frame)) {
    const size = (await fsp.stat(frame)).size;
    await fsp.unlink(frame);
    console.log('deleted images/gold-avatar-frame.png', (size / 1024).toFixed(1), 'KB');
  }

  const files = walk(ASSETS).filter((p) => /\.(png|jpe?g)$/i.test(p));
  let origSum = 0;
  let nextSum = 0;
  for (const file of files) {
    const rel = path.relative(ASSETS, file).replace(/\\/g, '/');
    const ext = path.extname(file).toLowerCase();
    const result =
      ext === '.png'
        ? await shrinkPng(file, PNG_CAP[rel])
        : await shrinkJpeg(file);
    origSum += result.orig;
    nextSum += result.next;
    const saved = result.orig - result.next;
    if (saved > 1024) {
      console.log(
        `${rel.padEnd(42)} ${(result.orig / 1024).toFixed(1).padStart(6)} → ${(result.next / 1024).toFixed(1).padStart(6)} KB`
      );
    }
  }
  console.log(
    `\nassets ${(origSum / 1024).toFixed(1)} → ${(nextSum / 1024).toFixed(1)} KB  (saved ${((origSum - nextSum) / 1024).toFixed(1)} KB)`
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
