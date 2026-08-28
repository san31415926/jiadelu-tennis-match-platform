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
 * 加俱乐部       → 往 CLUB_LIST 加一条，记得填 city/recruiting/powerRank/members/power
 *                 主页成员名单另加在文件底部 CLUB_MEMBERS
 * 改「同城」的城市 → 改 CURRENT_CITY
 * 改「战力榜前50」的门槛 → 改 filterClubs() 里的 powerRank > 50
 * 加一个筛选条件 → 在 CLUB_FILTERS 加名字，并在 filterClubs() 里加判断分支
 * 改示例账号加入哪家 → 改 CLUB_LIST 里的 joined（同时对齐 mock/club-ranking.ts 的 MY_CLUB_ID）
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
  /** 成员人数，主页「成员」和列表 meta 都读它 */
  members: number;
  /** 俱乐部总战力，主页绿色大数字和列表 meta 都读它 */
  power: number;
  /** 成立日期，只出现在列表那行小字里 */
  founded: string;
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
   * 是否已加入。只表示「已登录的示例账号」加入了哪一家。
   * 未登录时页面要用 withViewerJoinState() 抹掉，列表和主页都不能出现「已加入」。
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
    members: 24,
    power: 1860,
    founded: '2026-08-06',
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
    members: 31,
    power: 1790,
    founded: '2025-11-20',
    meta: metaOf(31, 1790, '2025-11-20'),
    city: '佛山',
    recruiting: true,
    powerRank: 12,
  },
  {
    id: 'club-3',
    name: '椒个鹏友',
    logo: '/assets/images/club/logo-3.jpg',
    members: 18,
    power: 1640,
    founded: '2026-03-14',
    meta: metaOf(18, 1640, '2026-03-14'),
    city: '广州',
    recruiting: false,
    powerRank: 28,
  },
  {
    id: 'club-4',
    name: 'Volt Court 颜技社',
    logo: '/assets/images/club/logo-4.jpg',
    members: 26,
    power: 1580,
    founded: '2025-06-01',
    meta: metaOf(26, 1580, '2025-06-01'),
    city: '深圳',
    recruiting: true,
    powerRank: 41,
  },
  {
    id: 'club-5',
    name: 'inininAlive Club',
    logo: '/assets/images/club/logo-5.jpg',
    members: 22,
    power: 1520,
    founded: '2026-01-08',
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
    members: 29,
    power: 1470,
    founded: '2025-09-16',
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
export function filterClubList(
  clubs: ClubItem[],
  filter: string,
  keyword: string,
): ClubItem[] {
  const trimmed = keyword.trim();
  return clubs.filter((club) => {
    if (filter === '同城' && club.city !== CURRENT_CITY) return false;
    if (filter === '招新中' && !club.recruiting) return false;
    if (filter === '战力榜前50' && club.powerRank > 50) return false;
    if (trimmed && !club.name.includes(trimmed) && !club.id.includes(trimmed)) {
      return false;
    }
    return true;
  });
}

export function filterClubs(filter: string, keyword: string): ClubItem[] {
  return filterClubList(CLUB_LIST, filter, keyword);
}

/** 已登录示例账号加入的那一家。没有 joined 就是还没入会 */
export function getJoinedClub(): ClubItem | undefined {
  return CLUB_LIST.find((club) => club.joined);
}

/**
 * 未登录时不能看到「已加入」。列表和主页都走这一层，不要直接读 ClubItem.joined。
 */
export function withViewerJoinState(club: ClubItem, isLoggedIn: boolean): ClubItem {
  if (isLoggedIn) {
    return club;
  }
  return { ...club, joined: false };
}

export function clubsForViewer(clubs: ClubItem[], isLoggedIn: boolean): ClubItem[] {
  return clubs.map((club) => withViewerJoinState(club, isLoggedIn));
}

/** 俱乐部主页成员行。人数按实际名单，不再用写死的 24 去凑「6 / 24」。 */
export interface ClubMember {
  id: string;
  nickname: string;
  avatar: string;
  /** 已经带「加入」前缀，wxml 直接显示 */
  joinedAt: string;
  power: number;
  captain?: boolean;
}

const MEMBER_AVATARS = [
  '/assets/images/avatars/anime-01.jpg',
  '/assets/images/avatars/anime-02.jpg',
  '/assets/images/avatars/anime-03.jpg',
  '/assets/images/avatars/anime-04.jpg',
  '/assets/images/avatars/anime-05.jpg',
  '/assets/images/avatars/anime-06.jpg',
];

function memberOf(
  id: string,
  nickname: string,
  joinedAt: string,
  power: number,
  avatarIndex: number,
  captain?: boolean
): ClubMember {
  return {
    id,
    nickname,
    avatar: MEMBER_AVATARS[avatarIndex % MEMBER_AVATARS.length],
    joinedAt,
    power,
    captain,
  };
}

/**
 * 每个俱乐部主页上的成员名单。人数以这里为准，不要再另写一个更大的 members。
 * 改名单就改这里；头像循环复用榜单那几张示例图。
 */
export const CLUB_MEMBERS: Record<string, ClubMember[]> = {
  'club-1': [
    memberOf('m1-1', '豆豆龙', '加入 2026-08-06', 1620, 0, true),
    memberOf('m1-2', '阿宽', '加入 2026-08-08', 1200, 1),
    memberOf('m1-3', '小满', '加入 2026-08-10', 1840, 2),
    memberOf('m1-4', '果果', '加入 2026-08-12', 1320, 3),
    memberOf('m1-5', '阿福', '加入 2026-08-14', 1360, 0),
    memberOf('m1-6', '小林', '加入 2026-08-16', 1500, 1),
  ],
  'club-2': [
    memberOf('m2-1', 'Kiwi', '加入 2025-11-20', 1590, 2, true),
    memberOf('m2-2', '小鹿', '加入 2025-12-01', 1240, 3),
    memberOf('m2-3', 'nana', '加入 2026-01-08', 1820, 0),
    memberOf('m2-4', '阿海', '加入 2026-02-14', 1280, 1),
    memberOf('m2-5', '阿杰', '加入 2026-03-20', 1430, 2),
    memberOf('m2-6', '奶茶', '加入 2026-04-02', 1470, 3),
  ],
  'club-3': [
    memberOf('m3-1', '奶茶', '加入 2026-03-14', 1470, 0, true),
    memberOf('m3-2', '瑰夏豆豆', '加入 2026-03-18', 1980, 1),
    memberOf('m3-3', '老陈', '加入 2026-04-01', 1650, 2),
    memberOf('m3-4', '阿May', '加入 2026-04-16', 1720, 3),
    memberOf('m3-5', '小虎', '加入 2026-05-08', 1400, 0),
    memberOf('m3-6', '阿泰', '加入 2026-05-22', 1540, 1),
  ],
  'club-4': [
    memberOf('m4-1', '阿泰', '加入 2025-06-01', 1540, 0, true),
    memberOf('m4-2', '菠墩墩', '加入 2026-03-12', 980, 1),
    memberOf('m4-3', '詹詹乐', '加入 2026-04-08', 920, 2),
    memberOf('m4-4', 'Carven', '加入 2026-05-20', 880, 3),
    memberOf('m4-5', '黎明', '加入 2026-07-01', 760, 0),
    memberOf('m4-6', '未来', '加入 2026-08-01', 720, 1),
  ],
  'club-5': [
    memberOf('m5-1', '阿杰', '加入 2026-01-08', 1430, 2, true),
    memberOf('m5-2', '吕布', '加入 2026-01-12', 1910, 3),
    memberOf('m5-3', '阿飞', '加入 2026-02-02', 1760, 0),
    memberOf('m5-4', '大熊', '加入 2026-02-18', 1680, 1),
    memberOf('m5-5', '阿宽', '加入 2026-03-06', 1200, 2),
    memberOf('m5-6', '小鹿', '加入 2026-03-28', 1240, 3),
  ],
  'club-6': [
    memberOf('m6-1', '小林', '加入 2025-09-16', 1500, 0, true),
    memberOf('m6-2', '小虎', '加入 2025-10-01', 1400, 1),
    memberOf('m6-3', '阿福', '加入 2025-11-11', 1360, 2),
    memberOf('m6-4', '果果', '加入 2026-01-09', 1320, 3),
    memberOf('m6-5', '阿海', '加入 2026-03-03', 1280, 0),
    memberOf('m6-6', 'Kiwi', '加入 2026-04-18', 1590, 1),
  ],
};

/**
 * 按 id 取俱乐部主页数据。id 对不上就退回第一家，避免空白页。
 * 人数按名单实数，已加入的当前用户由 catalog 补进列表。
 */
export function getClubHome(id: string): {
  club: ClubItem;
  members: ClubMember[];
  shownLabel: string;
} {
  const found = CLUB_LIST.find((item) => item.id === id) ?? CLUB_LIST[0];
  const members = (CLUB_MEMBERS[found.id] ?? []).slice();
  const club = {
    ...found,
    members: members.length,
    meta: metaOf(members.length, found.power, found.founded),
  };
  return {
    club,
    members,
    shownLabel: `${members.length} 人`,
  };
}
