import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from '../image-to-slice-tool/node_modules/sharp/lib/index.js';

const root = 'D:/Desktop/嘉得路网球对战平台项目';
const sourceDir = path.join(root, '测试图');
const outputDir = path.join(root, 'ui-slices', 'output', 'test-icons');

const sources = {
  home: path.join(sourceDir, '图标-首页六入口.png'),
  extra: path.join(sourceDir, '图标-补充入口.png'),
  grid: path.join(sourceDir, '图标-切图九宫格.png')
};

const primary = [
  ['player-ranking', '球员排行', 'home', {left: 54, top: 54, width: 430, height: 382}],
  ['event-calendar', '赛事日历', 'home', {left: 556, top: 58, width: 418, height: 380}],
  ['point-exchange', '积分兑换', 'home', {left: 1041, top: 60, width: 431, height: 375}],
  ['past-champions', '历届冠军', 'home', {left: 56, top: 526, width: 437, height: 332}],
  ['event-photos', '赛事照片', 'home', {left: 553, top: 530, width: 431, height: 325}],
  ['annual-ceremony', '年会典礼', 'home', {left: 1031, top: 516, width: 450, height: 359}],
  ['super-cup', '超级杯', 'extra', {left: 74, top: 54, width: 438, height: 384}],
  ['leaderboard', '榜单', 'extra', {left: 547, top: 110, width: 441, height: 317}],
  ['profile', '我的', 'extra', {left: 1050, top: 68, width: 415, height: 365}],
  ['my-registrations', '我的报名', 'extra', {left: 70, top: 525, width: 454, height: 310}],
  ['club', '俱乐部', 'extra', {left: 561, top: 503, width: 424, height: 334}],
  ['annual-best', '年度最佳', 'extra', {left: 1055, top: 530, width: 413, height: 318}]
];

const gridNames = [
  ['grid-ranking-podium', '九宫格-排名奖台'],
  ['grid-calendar', '九宫格-日历'],
  ['grid-point-gift', '九宫格-积分礼盒'],
  ['grid-champions', '九宫格-冠军奖杯'],
  ['grid-event-photos', '九宫格-赛事相机'],
  ['grid-annual-ceremony', '九宫格-年会礼盒'],
  ['grid-badge', '九宫格-勋章'],
  ['grid-leaderboard', '九宫格-榜单'],
  ['grid-profile', '九宫格-个人']
];

await fs.rm(outputDir, {recursive: true, force: true});
await fs.mkdir(path.join(outputDir, 'primary'), {recursive: true});
await fs.mkdir(path.join(outputDir, 'alternates'), {recursive: true});

for (const [key, label, sourceName, extract] of primary) {
  await sharp(sources[sourceName])
    .extract(extract)
    .png()
    .toFile(path.join(outputDir, 'primary', `${key}.png`));
}

for (let row = 0; row < 3; row += 1) {
  for (let col = 0; col < 3; col += 1) {
    const index = row * 3 + col;
    const [key] = gridNames[index];
    await sharp(sources.grid)
      .extract({left: col * 341, top: row * 341, width: 341, height: 341})
      .png()
      .toFile(path.join(outputDir, 'alternates', `${key}.png`));
  }
}

const manifest = {
  method: 'Manual coordinate slicing through the cloned 50kg/image-to-slice Sharp pipeline.',
  primary: primary.map(([key, label, sourceName, extract]) => ({key, label, source: path.basename(sources[sourceName]), extract, file: `primary/${key}.png`})),
  alternates: gridNames.map(([key, label], index) => ({key, label, source: path.basename(sources.grid), row: Math.floor(index / 3), column: index % 3, file: `alternates/${key}.png`}))
};
await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({outputDir, primary: primary.length, alternates: gridNames.length}, null, 2));
