const fs = require('node:fs/promises');
const path = require('node:path');
const { exportFigManifest } = require('../image-to-slice-tool/src/fig-export/export-fig');

const root = 'D:/Desktop/嘉得路网球对战平台项目';
const assetsRoot = path.join(root, 'ui-slices', 'output', 'test-icons');
const transparentRoot = path.join(assetsRoot, 'primary-transparent');
const alternateRoot = path.join(assetsRoot, 'alternates');
const outputFile = path.join(assetsRoot, '网球赛事汇-图标素材库.fig');

const primary = [
  ['player-ranking', '球员排行'],
  ['event-calendar', '赛事日历'],
  ['point-exchange', '积分兑换'],
  ['past-champions', '历届冠军'],
  ['event-photos', '赛事照片'],
  ['annual-ceremony', '年会典礼'],
  ['super-cup', '超级杯'],
  ['leaderboard', '榜单'],
  ['profile', '我的'],
  ['my-registrations', '我的报名'],
  ['club', '俱乐部'],
  ['annual-best', '年度最佳']
];

const alternates = [
  ['grid-ranking-podium', '备选 / 排名奖台'],
  ['grid-calendar', '备选 / 日历'],
  ['grid-point-gift', '备选 / 积分礼盒'],
  ['grid-champions', '备选 / 冠军奖杯'],
  ['grid-event-photos', '备选 / 赛事相机'],
  ['grid-annual-ceremony', '备选 / 年会礼盒'],
  ['grid-badge', '备选 / 勋章'],
  ['grid-leaderboard', '备选 / 榜单'],
  ['grid-profile', '备选 / 个人']
];

async function dataUrl(file) {
  const bytes = await fs.readFile(file);
  return `data:image/png;base64,${bytes.toString('base64')}`;
}

async function card({key, label, rootDir, x, y}) {
  return {
    type: 'frame',
    name: `Icon Asset / ${label}`,
    x,
    y,
    width: 280,
    height: 248,
    fill: '#FFFFFF',
    radius: 20,
    shadow: {color: '#1A2815', opacity: 0.08, x: 0, y: 8, blur: 20},
    children: [
      {
        type: 'image',
        name: `Icon / ${label}`,
        x: 32,
        y: 18,
        width: 216,
        height: 170,
        dataUrl: await dataUrl(path.join(rootDir, `${key}.png`)),
        scaleMode: 'FIT'
      },
      {
        type: 'text',
        name: `Label / ${label}`,
        x: 24,
        y: 198,
        width: 232,
        height: 30,
        text: label,
        fontSize: 20,
        fontWeight: 600,
        color: '#242B24'
      }
    ]
  };
}

async function build() {
  const nodes = [
    {
      type: 'text',
      name: 'Title / Tennis Icon Assets',
      x: 40,
      y: 36,
      width: 880,
      height: 46,
      text: '网球赛事汇 · 图标素材库',
      fontSize: 30,
      fontWeight: 700,
      color: '#14220C'
    },
    {
      type: 'text',
      name: 'Subtitle / Primary',
      x: 40,
      y: 92,
      width: 880,
      height: 28,
      text: '正式入口图标',
      fontSize: 18,
      fontWeight: 600,
      color: '#5C685A'
    }
  ];

  for (let index = 0; index < primary.length; index += 1) {
    const [key, label] = primary[index];
    nodes.push(await card({
      key,
      label,
      rootDir: transparentRoot,
      x: 40 + (index % 3) * 300,
      y: 138 + Math.floor(index / 3) * 268
    }));
  }

  nodes.push({
    type: 'text',
    name: 'Subtitle / Alternates',
    x: 40,
    y: 1236,
    width: 880,
    height: 28,
    text: '备选图标',
    fontSize: 18,
    fontWeight: 600,
    color: '#5C685A'
  });

  for (let index = 0; index < alternates.length; index += 1) {
    const [key, label] = alternates[index];
    nodes.push(await card({
      key,
      label,
      rootDir: alternateRoot,
      x: 40 + (index % 3) * 300,
      y: 1282 + Math.floor(index / 3) * 268
    }));
  }

  const manifest = {
    screen: {
      name: '网球赛事汇 / 图标素材库',
      width: 940,
      height: 2120,
      fill: '#F5FBEA',
      clipsContent: false
    },
    nodes
  };
  const bytes = await exportFigManifest({kind: 'editable', manifest});
  await fs.writeFile(outputFile, Buffer.from(bytes));
  console.log(JSON.stringify({outputFile, bytes: bytes.length, nodeCount: nodes.length}, null, 2));
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
