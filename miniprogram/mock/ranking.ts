/**
 * ============================================================================
 * 球员排行数据 —— 榜单的球员名单与排序规则
 * ============================================================================
 *
 * 【设计稿有两版，这里只需要一份数据】
 * Figma 里 6:2 和 15:2 两个画板看起来是两个页面，其实只是「城市榜/全国榜」
 * 的选中态相反，属于同一页面的两个状态。所以代码里做成一个页面 + 一个切换。
 *
 * 【为什么不写死三份榜单】
 * 积分榜、身价榜、战力榜的排名顺序是不一样的（身价最高的人积分不一定最高）。
 * 「积分」接上云之后优先用 52 周巡回赛 rankPoints（会员打 L-15/L-25 才累计），
 * 没有巡回赛积分时才用 players.points。这不是 ATP/ITF 官方分。
 * 如果写死三份数组，改一个球员的数据要改三处，很容易漏。
 * 所以这里只存每个球员的原始三个数值，由 rankPlayers() 按当前选中的指标
 * 实时排序。这也和真实的后端逻辑一致。
 *
 * 【常见改动】
 * 加球员          → 往 RAW_PLAYERS 里加一条，头像会自动循环复用
 * 改当前用户城市  → 改 CURRENT_CITY，会影响「城市榜」筛出哪些人
 * 改指标名称      → 改 RANKING_METRICS，同时要改 valueOf() 里的判断分支
 * 改收起时显示几行 → 改 COLLAPSED_ROW_COUNT
 * 改身价的显示格式 → 改 formatMetric()
 */

/** 一个球员的完整档案。三个数值字段各对应一个榜单指标 */
export interface RankedPlayer {
  id: string;
  nickname: string;
  club: string;
  /** 评级标签，如 A+ / B / C。显示在昵称右边的小胶囊里 */
  badge: string;
  avatar: string;
  /** 所在城市，「城市榜」按它过滤 */
  city: string;
  /** 积分，对应「积分」榜 */
  points: number;
  /** 身价（元），对应「身价」榜，显示时会加 ¥ 和千分位 */
  marketValue: number;
  /** 战力值，对应「战力」榜 */
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
  '/assets/images/avatars/anime-01.jpg',
  '/assets/images/avatars/anime-02.jpg',
  '/assets/images/avatars/anime-03.jpg',
  '/assets/images/avatars/anime-04.jpg',
  '/assets/images/avatars/anime-05.jpg',
  '/assets/images/avatars/anime-06.jpg',
];

/** 头像在 assets/images/avatars/，按序循环复用 */
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

/**
 * 根据当前选中的指标，取出球员对应的那个数值。
 * 新增指标（比如「胜率」）时要在这里加一个判断分支。
 */
function valueOf(player: RankedPlayer, metric: string): number {
  if (metric === '身价') return player.marketValue;
  if (metric === '战力') return player.power;
  return player.points;
}

/**
 * 把数值格式化成显示文本。
 *
 * 身价加货币符号和千分位（12800 → ¥12,800），其余指标直接显示数字。
 *
 * 【想改格式】
 * 想让身价显示成「1.28 万」→ 把这里改成除以 10000 再拼「万」
 * 想给积分也加千分位     → 把最后一行改成 value.toLocaleString('en-US')
 *
 * 【注意列宽】
 * 格式变长可能撑破布局。列表右侧的数值列宽度在
 * pages/ranking/index.wxss 的 .list__score 里，默认 150rpx。
 */
export function formatMetric(value: number, metric: string): string {
  if (metric === '身价') {
    return `¥${value.toLocaleString('en-US')}`;
  }
  return String(value);
}

/**
 * 榜单的核心函数：先按范围筛人，再按指标从高到低排序。
 *
 * @param scope  '城市榜' 或 '全国榜'
 * @param metric '积分' / '身价' / '战力'
 *
 * 【为什么用 [...pool] 复制一份】
 * sort() 会直接修改原数组。如果不复制，PLAYERS 的顺序会被永久打乱，
 * 切换指标几次之后数据就乱了。这是很容易踩的坑。
 *
 * 【排序方向】
 * b - a 是从大到小（降序）。想改成从小到大就写 a - b。
 */
export function rankGivenPlayers(
  players: RankedPlayer[],
  scope: string,
  metric: string,
  city = CURRENT_CITY,
): RankedPlayer[] {
  const cityName = String(city || CURRENT_CITY).trim() || CURRENT_CITY;
  const pool =
    scope === '城市榜'
      ? players.filter((player) => player.city === cityName)
      : players;
  return [...pool].sort((a, b) => valueOf(b, metric) - valueOf(a, metric));
}

export function rankPlayers(scope: string, metric: string): RankedPlayer[] {
  return rankGivenPlayers(PLAYERS, scope, metric);
}

/**
 * 取前三名给领奖台用。
 *
 * 【返回顺序是「亚军、冠军、季军」而不是 1、2、3】
 * 因为领奖台的视觉顺序是从左到右：2 号台在左、1 号台在中间最高、3 号台在右。
 * 页面里用 podium[0] / podium[1] / podium[2] 分别对应左中右三个位置。
 *
 * 【人数不足三人时】
 * 缺的位置显示「虚位以待」和 --，不会报错。城市榜筛出的人少时可能出现。
 */
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

/**
 * 第 4 名之后的球员转成列表行。
 * slice(3) 是跳过前三名（他们在领奖台上），index + 4 让名次从 4 开始。
 */
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

/**
 * 底部「我的排名」。按当前登录用户在这份已排序名单里的位置现算，
 * 不要写死第 128。没登录或没上榜就提示去参赛。
 */
export function myRankingOf(
  ranked: RankedPlayer[],
  metric: string,
  me?: { nickname?: string; id?: string } | null,
) {
  const nickname = String((me && me.nickname) || '').trim();
  const id = String((me && me.id) || '').trim();
  if (!nickname && !id) {
    return { summary: '登录后查看我的排名', actionText: '去参赛' };
  }
  const index = ranked.findIndex(
    (player) => (nickname && player.nickname === nickname) || (id && player.id === id),
  );
  if (index < 0) {
    return { summary: '我的排名  暂未上榜  •  去参赛积累积分', actionText: '去参赛' };
  }
  const player = ranked[index];
  return {
    summary: `我的排名  第${index + 1}  •  ${metric} ${formatMetric(valueOf(player, metric), metric)}`,
    actionText: '去查看',
  };
}

export const MY_RANKING = myRankingOf([], '积分');

/**
 * 收起状态下列表显示几行。
 *
 * 设计稿（Figma node 15:47）画了 4、5、6 三名，所以是 3。
 * 调大会让默认展示更多人，页面变长；调成 0 则收起时完全不显示列表。
 */
export const COLLAPSED_ROW_COUNT = 3;
