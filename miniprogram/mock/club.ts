/**
 * ============================================================================
 * 俱乐部页数据
 * ============================================================================
 *
 * 【筛选是怎么工作的】
 * 四个筛选项（全部/同城/招新中/战力榜前50）不是写死四份列表，而是给每个
 * 俱乐部打上 city、recruiting、powerRank 三个标签，由 filterClubs() 按条件筛。
 * 这样加一个俱乐部只要填对标签，四个筛选都会自动正确。
 *
 * 【常见改动】
 * 加俱乐部       → 往 CLUB_LIST 加一条，记得填 city/recruiting/powerRank
 * 改「同城」的城市 → 改 CURRENT_CITY
 * 改「战力榜前50」的门槛 → 改 filterClubs() 里的 powerRank > 50
 * 加一个筛选条件 → 在 CLUB_FILTERS 加名字，并在 filterClubs() 里加判断分支
 */

/** 一个俱乐部 */
export interface ClubItem {
  id: string;
  /** 俱乐部名称，25rpx 加粗。有城市徽章时可用宽度会变窄，过长会截断 */
  name: string;
  /** 方形 logo，显示 128×128 带 18rpx 圆角 */
  logo: string;
  /** 一行灰色小字，内容由下面的 metaOf() 拼出来 */
  meta: string;
  /** 所在城市，「同城」筛选按它和 CURRENT_CITY 比对 */
  city: string;
  /** 是否正在招新，对应「招新中」筛选 */
  recruiting: boolean;
  /** 战力榜名次，对应「战力榜前50」筛选（数值 ≤ 50 才会被筛出来） */
  powerRank: number;
  /**
   * 城市排名徽章，如「城市第 3」。
   * 可选字段：不填就不显示徽章，名称能占满整行宽度。
   * 设计里只有进城市前三的俱乐部才有（Figma node 23:374）。
   */
  rankBadge?: string;
  /**
   * 是否已加入。
   * true  → 右侧按钮显示「已加入」，金色描边白底
   * false → 显示「申请加入」，绿色实底
   */
  joined?: boolean;
}

export const CLUB_FILTERS = ['全部', '同城', '招新中', '战力榜前50'];

/** 「同城」按当前用户所在城市过滤 */
export const CURRENT_CITY = '广州';

/**
 * 拼出列表行的那句灰色小字。
 * 想改格式（比如去掉成立日期）就改这里，六个俱乐部会一起变。
 */
function metaOf(members: number, power: number, founded: string): string {
  return `成员 ${members} 人 · 战力 ${power} · 成立 ${founded}`;
}

export const CLUB_LIST: ClubItem[] = [
  {
    id: 'club-1',
    name: '菜菜才不菜',
    logo: '/assets/images/club/logo-1.jpg',
    meta: metaOf(24, 1860, '2026-08-06'),
    city: '广州',
    recruiting: true,
    powerRank: 3,
    rankBadge: '城市第 3',
  },
  {
    id: 'club-2',
    name: 'GagaTennis Club',
    logo: '/assets/images/club/logo-2.jpg',
    meta: metaOf(31, 1790, '2025-11-20'),
    city: '佛山',
    recruiting: true,
    powerRank: 12,
  },
  {
    id: 'club-3',
    name: '椒个鹏友',
    logo: '/assets/images/club/logo-3.jpg',
    meta: metaOf(18, 1640, '2026-03-14'),
    city: '广州',
    recruiting: false,
    powerRank: 28,
  },
  {
    id: 'club-4',
    name: 'Volt Court 颜技社',
    logo: '/assets/images/club/logo-4.jpg',
    meta: metaOf(26, 1580, '2025-06-01'),
    city: '深圳',
    recruiting: true,
    powerRank: 41,
  },
  {
    id: 'club-5',
    name: 'inininAlive Club',
    logo: '/assets/images/club/logo-5.jpg',
    meta: metaOf(22, 1520, '2026-01-08'),
    city: '广州',
    recruiting: false,
    powerRank: 55,
    joined: true,
  },
  {
    id: 'club-6',
    name: 'RisingAce 网球社',
    logo: '/assets/images/club/logo-6.jpg',
    meta: metaOf(29, 1470, '2025-09-16'),
    city: '东莞',
    recruiting: true,
    powerRank: 63,
  },
];

export const CLUB_SUMMARY = `找到你的球队 · 共 86 家俱乐部`;

/**
 * 按筛选项和搜索关键词过滤俱乐部，两个条件是叠加的
 * （比如选了「同城」再搜索，只会在同城结果里搜）。
 *
 * 【搜索匹配范围】
 * 目前匹配名称和 ID。想支持搜城市，在下面那个 if 里加上
 * && !club.city.includes(trimmed) 的判断。
 *
 * 【接云开发后】
 * 这个函数会被云函数的数据库查询替换，逻辑一样但在服务端执行，
 * 因为真实数据可能有几百个俱乐部，不适合全部下发到手机上再筛。
 */
export function filterClubs(filter: string, keyword: string): ClubItem[] {
  const trimmed = keyword.trim();
  return CLUB_LIST.filter((club) => {
    if (filter === '同城' && club.city !== CURRENT_CITY) return false;
    if (filter === '招新中' && !club.recruiting) return false;
    if (filter === '战力榜前50' && club.powerRank > 50) return false;
    if (trimmed && !club.name.includes(trimmed) && !club.id.includes(trimmed)) {
      return false;
    }
    return true;
  });
}
