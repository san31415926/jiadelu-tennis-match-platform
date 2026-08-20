import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from '../image-to-slice-tool/node_modules/sharp/lib/index.js';

const root = 'D:/Desktop/嘉得路网球对战平台项目';
const inputDir = 'C:/Users/17112/AppData/Local/Temp';
const outputDir = path.join(root, 'ui-slices', 'output');
const homeInput = path.join(inputDir, 'codex-clipboard-74c5da1c-bef5-4be3-a167-7e2e076841e8.png');
const navInput = path.join(inputDir, 'codex-clipboard-f4537147-4813-4dbe-a0d4-3f0aab6f7f36.png');

await fs.rm(outputDir, {recursive: true, force: true});
await fs.mkdir(path.join(outputDir, 'home'), {recursive: true});
await fs.mkdir(path.join(outputDir, 'bottom-nav'), {recursive: true});
await fs.mkdir(path.join(outputDir, 'assets'), {recursive: true});

const home = sharp(homeInput);
const nav = sharp(navInput);

async function crop(source, name, extract, folder = 'home') {
  await source.clone().extract(extract).png().toFile(path.join(outputDir, folder, name));
}

// The screenshots include editor margins. These boxes isolate the 700px mobile canvas.
await crop(home, 'home-reference.png', {left: 85, top: 0, width: 700, height: 1128});
await crop(nav, 'bottom-nav-reference.png', {left: 214, top: 104, width: 699, height: 159}, 'bottom-nav');

await crop(home, 'profile-hero.png', {left: 85, top: 0, width: 700, height: 132});
await crop(home, 'feature-grid.png', {left: 85, top: 132, width: 700, height: 390});
await crop(home, 'event-feed.png', {left: 85, top: 522, width: 700, height: 448});

const assets = [
  ['icon-ranking.png', {left: 165, top: 214, width: 58, height: 62}],
  ['icon-calendar.png', {left: 250, top: 214, width: 58, height: 62}],
  ['icon-rewards.png', {left: 410, top: 210, width: 62, height: 66}],
  ['icon-champions.png', {left: 575, top: 210, width: 62, height: 66}],
  ['icon-photos.png', {left: 165, top: 375, width: 58, height: 62}],
  ['icon-annual.png', {left: 250, top: 375, width: 58, height: 62}],
  ['icon-registrations.png', {left: 410, top: 375, width: 62, height: 62}],
  ['court-photo.png', {left: 125, top: 602, width: 242, height: 198}],
];
for (const [name, extract] of assets) await crop(home, name, extract, 'assets');

// Recompose the reference navigation after removing the center match item.
const navSegments = [
  {left: 0, width: 140},
  {left: 140, width: 140},
  {left: 420, width: 140},
  {left: 559, width: 140},
];
const composites = [];
for (let i = 0; i < navSegments.length; i++) {
  const segment = navSegments[i];
  const buffer = await nav.clone().extract({left: 214 + segment.left, top: 104, width: segment.width, height: 159}).png().toBuffer();
  composites.push({input: await sharp(buffer).resize(175, 159).png().toBuffer(), left: i * 175, top: 0});
}
await sharp({create: {width: 700, height: 159, channels: 4, background: '#ffffff'}})
  .composite(composites)
  .png()
  .toFile(path.join(outputDir, 'bottom-nav', 'bottom-nav-without-match.png'));

const manifest = {
  source: {
    home: homeInput,
    bottomNav: navInput,
    method: 'image-to-slice-tool / sharp coordinate slicing'
  },
  canvas: {width: 700, note: 'Reference screenshots include editor chrome; output crops isolate the mobile canvas.'},
  outputs: [
    'home/home-reference.png',
    'home/profile-hero.png',
    'home/feature-grid.png',
    'home/event-feed.png',
    'bottom-nav/bottom-nav-reference.png',
    'bottom-nav/bottom-nav-without-match.png',
    ...assets.map(([name]) => `assets/${name}`)
  ]
};
await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({outputDir, count: manifest.outputs.length, outputs: manifest.outputs}, null, 2));
