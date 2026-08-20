/**
 * 球员排行页假数据，与 Figma node 15:3 / 6:3 对应。
 * 两版设计稿的差别只是城市榜与全国榜的选中态相反，属于同一个状态维度。
 *
 * 三个指标（积分/身价/战力）是各自独立的数值，排序结果不同，
 * 因此这里存球员原始数据，由 rankPlayers 按当前维度排序，而不是写死三份榜单。
 */

export interface RankedPlayer {
  id: string;
  nickname: string;
  club: string;
  badge: string;
  avatar: string;
  city: string;
  points: number;
  marketValue: number;
  power: number;
}

export interface PodiumPlayer {
  rank: 1 | 2 | 3;
  nickname: string;
  club: string;
  score: string;
  avatar: string;
}

export interface RankingRow {
  rank: number;
  nickname: string;
  club: string;
  score: string;
  badge: string;
  avatar: string;
}

export const RANKING_SCOPES = ['城市榜', '全国榜'];
export const RANKING_METRICS = ['积分', '身价', '战力'];

/** 城市榜按当前用户所在城市过滤 */
export const CURRENT_CITY = '广州';

const AVATARS = [
  '/assets/images/ranking/avatar-demo.jpg',
  '/assets/images/ranking/avatar-4.jpg',
  '/assets/images/ranking/avatar-5.jpg',
  '/assets/images/ranking/avatar-6.jpg',
];

/** 头像资产只有 4 张示例图，按序循环复用 */
function avatarOf(index: number): string {
  return AVATARS[index % AVATARS.length];
}

const RAW_PLAYERS: Omit<RankedPlayer, 'avatar'>[] = [
  { id: 'p1', nickname: '瑰夏豆豆', club: '瑰夏豆豆队', badge: 'A+', city: '广州', points: 1650, marketValue: 12800, power: 1980 },
  { id: 'p2', nickname: 'nana', club: '东莞队', badge: 'A', city: '东莞', points: 1600, marketValue: 13600, power: 1820 },
  { id: 'p3', nickname: '吕布', club: '广州嘻哈', badge: 'A', city: '广州', points: 1400, marketValue: 9800, power: 1910 },
  { id: 'p4', nickname: '阿飞', club: '深圳ACE网球俱乐部', badge: 'A+', city: '深圳', points: 1200, marketValue: 11200, power: 1760 },
  { id: 'p5', nickname: '小满', club: '佛山飞跃队', badge: 'A+', city: '佛山', points: 1200, marketValue: 8600, power: 1840 },
  { id: 'p6', nickname: '大熊', club: '东莞松山湖TC', badge: 'A+', city: '东莞', points: 1200, marketValue: 10400, power: 1680 },
  { id: 'p7', nickname: '阿May', club: '广州嘻哈', badge: 'A', city: '广州', points: 1150, marketValue: 7900, power: 1720 },
  { id: 'p8', nickname: '老陈', club: '润盈网球队', badge: 'B+', city: '广州', points: 1080, marketValue: 7200, power: 1650 },
  { id: 'p9', nickname: 'Kiwi', club: 'GagaTennis Club', badge: 'B+', city: '佛山', points: 1040, marketValue: 6800, power: 1590 },
  { id: 'p10', nickname: '豆豆龙', club: '菜菜才不菜', badge: 'B+', city: '广州', points: 990, marketValue: 6400, power: 1620 },
  { id: 'p11', nickname: '阿泰', club: 'Volt Court 颜技社', badge: 'B', city: '深圳', points: 960, marketValue: 6100, power: 1540 },
  { id: 'p12', nickname: '小林', club: 'RisingAce 网球社', badge: 'B', city: '东莞', points: 920, marketValue: 5800, power: 1500 },
  { id: 'p13', nickname: '奶茶', club: '椒个鹏友', badge: 'B', city: '广州', points: 880, marketValue: 5500, power: 1470 },
  { id: 'p14', nickname: '阿杰', club: 'inininAlive Club', badge: 'B', city: '佛山', points: 850, marketValue: 5200, power: 1430 },
  { id: 'p15', nickname: '小虎', club: '东莞松山湖TC', badge: 'B', city: '东莞', points: 820, marketValue: 4900, power: 1400 },
  { id: 'p16', nickname: '阿福', club: '深圳ACE网球俱乐部', badge: 'C+', city: '深圳', points: 780, marketValue: 4600, power: 1360 },
  { id: 'p17', nickname: '果果', club: '佛山飞跃队', badge: 'C+', city: '佛山', points: 740, marketValue: 4300, power: 1320 },
  { id: 'p18', nickname: '阿海', club: '润盈网球队', badge: 'C+', city: '广州', points: 700, marketValue: 4000, power: 1280 },
  { id: 'p19', nickname: '小鹿', club: 'GagaTennis Club', badge: 'C', city: '佛山', points: 660, marketValue: 3700, power: 1240 },
  { id: 'p20', nickname: '阿宽', club: '菜菜才不菜', badge: 'C', city: '广州', points: 620, marketValue: 3400, power: 1200 },
];

export const PLAYERS: RankedPlayer[] = RAW_PLAYERS.map((player, index) => ({
  ...player,
  avatar: avatarOf(index),
}));

function valueOf(player: RankedPlayer, metric: string): number {
  if (metric === '身价') return player.marketValue;
  if (metric === '战力') return player.power;
  return player.points;
}

/** 身价带货币符号与千分位，其余指标是纯数值 */
export function formatMetric(value: number, metric: string): string {
  if (metric === '身价') {
    return `¥${value.toLocaleString('en-US')}`;
  }
  return String(value);
}

/** 按范围过滤、按指标降序排列 */
export function rankPlayers(scope: string, metric: string): RankedPlayer[] {
  const pool =
    scope === '城市榜'
      ? PLAYERS.filter((player) => player.city === CURRENT_CITY)
      : PLAYERS;
  return [...pool].sort((a, b) => valueOf(b, metric) - valueOf(a, metric));
}

/** 前三名交给领奖台，展示顺序是「亚军 冠军 季军」 */
export function toPodium(players: RankedPlayer[], metric: string): PodiumPlayer[] {
  const [first, second, third] = players;
  const build = (player: RankedPlayer | undefined, rank: 1 | 2 | 3): PodiumPlayer => ({
    rank,
    nickname: player?.nickname ?? '虚位以待',
    club: player?.club ?? '--',
    score: player ? formatMetric(valueOf(player, metric), metric) : '--',
    avatar: player?.avatar ?? AVATARS[0],
  });
  return [build(second, 2), build(first, 1), build(third, 3)];
}

export function toRows(players: RankedPlayer[], metric: string): RankingRow[] {
  return players.slice(3).map((player, index) => ({
    rank: index + 4,
    nickname: player.nickname,
    club: player.club,
    score: formatMetric(valueOf(player, metric), metric),
    badge: player.badge,
    avatar: player.avatar,
  }));
}

/** 未登录或未参赛时，底部卡片显示未上榜文案 */
export const MY_RANKING = {
  summary: '我的排名  第128  •  积分 0  •  暂未上榜',
  actionText: '去参赛',
};

/** 收起状态下只露出 4~6 名，与设计稿一致 */
export const COLLAPSED_ROW_COUNT = 3;
