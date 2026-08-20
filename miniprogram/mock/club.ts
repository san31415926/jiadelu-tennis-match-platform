/** 俱乐部页假数据，与 Figma node 23:368 的列表行对应 */

export interface ClubItem {
  id: string;
  name: string;
  logo: string;
  meta: string;
  /** 仅少数俱乐部有城市排名徽章 */
  rankBadge?: string;
  joined?: boolean;
}

export const CLUB_FILTERS = ['全部', '同城', '招新中', '战力榜前50'];

const META = '成员 24 人 · 战力 1860 · 成立 2026-08-06';

export const CLUB_LIST: ClubItem[] = [
  {
    id: 'club-1',
    name: '菜菜才不菜',
    logo: '/assets/images/club/logo-1.jpg',
    meta: META,
    rankBadge: '城市第 3',
  },
  {
    id: 'club-2',
    name: 'GagaTennis Club',
    logo: '/assets/images/club/logo-2.jpg',
    meta: META,
  },
  {
    id: 'club-3',
    name: '椒个鹏友',
    logo: '/assets/images/club/logo-3.jpg',
    meta: META,
  },
  {
    id: 'club-4',
    name: 'Volt Court 颜技社',
    logo: '/assets/images/club/logo-4.jpg',
    meta: META,
  },
  {
    id: 'club-5',
    name: 'inininAlive Club',
    logo: '/assets/images/club/logo-5.jpg',
    meta: META,
    joined: true,
  },
  {
    id: 'club-6',
    name: 'RisingAce 网球社',
    logo: '/assets/images/club/logo-6.jpg',
    meta: META,
  },
];

export const CLUB_SUMMARY = '找到你的球队 · 共 86 家俱乐部';
