/** 俱乐部页假数据，与 Figma node 23:368 的列表行对应 */

export interface ClubItem {
  id: string;
  name: string;
  logo: string;
  meta: string;
  city: string;
  /** 是否正在招新，对应「招新中」筛选 */
  recruiting: boolean;
  /** 战力榜名次，对应「战力榜前50」筛选 */
  powerRank: number;
  /** 仅进入城市前三的俱乐部有徽章 */
  rankBadge?: string;
  joined?: boolean;
}

export const CLUB_FILTERS = ['全部', '同城', '招新中', '战力榜前50'];

/** 「同城」按当前用户所在城市过滤 */
export const CURRENT_CITY = '广州';

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

/** 筛选与关键词可以叠加生效 */
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
