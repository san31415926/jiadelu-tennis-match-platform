/**
 * ============================================================================
 * 俱乐部榜单数据
 * ============================================================================
 *
 * 仿球员排行，但没有城市榜/全国榜——只排小程序里已经注册的俱乐部。
 * 指标目前是「战力」和「积分」两项（俱乐部没有身价）。
 *
 * 【常见改动】
 * 加俱乐部     → 往 RAW_CLUBS 加一条，logo 可以复用已有的 club/logo-*.jpg
 * 改指标名称   → 改 CLUB_RANKING_METRICS，同时改 valueOf()
 * 改底部文案   → 改 MY_CLUB_RANKING
 */
import { COLLAPSED_ROW_COUNT } from './ranking';
import type { PodiumPlayer, RankingRow } from './ranking';

export interface RankedClub {
  id: string;
  name: string;
  city: string;
  logo: string;
  members: number;
  points: number;
  power: number;
}

export const CLUB_RANKING_METRICS = ['战力', '积分'];

const RAW_CLUBS: RankedClub[] = [
  { id: 'club-1', name: '菜菜才不菜', city: '广州', logo: '/assets/images/club/logo-1.jpg', members: 24, points: 1860, power: 1980 },
  { id: 'club-2', name: 'GagaTennis Club', city: '佛山', logo: '/assets/images/club/logo-2.jpg', members: 31, points: 1790, power: 1910 },
  { id: 'club-3', name: '椒个鹏友', city: '广州', logo: '/assets/images/club/logo-3.jpg', members: 18, points: 1640, power: 1840 },
  { id: 'club-4', name: 'Volt Court 颜技社', city: '深圳', logo: '/assets/images/club/logo-4.jpg', members: 26, points: 1580, power: 1760 },
  { id: 'club-5', name: 'inininAlive Club', city: '广州', logo: '/assets/images/club/logo-5.jpg', members: 22, points: 1520, power: 1680 },
  { id: 'club-6', name: 'RisingAce 网球社', city: '东莞', logo: '/assets/images/club/logo-6.jpg', members: 29, points: 1470, power: 1620 },
  { id: 'club-7', name: '广州嘻哈', city: '广州', logo: '/assets/images/club/logo-1.jpg', members: 20, points: 1400, power: 1540 },
  { id: 'club-8', name: '深圳ACE网球俱乐部', city: '深圳', logo: '/assets/images/club/logo-4.jpg', members: 33, points: 1320, power: 1470 },
  { id: 'club-9', name: '佛山飞跃队', city: '佛山', logo: '/assets/images/club/logo-2.jpg', members: 16, points: 1210, power: 1400 },
  { id: 'club-10', name: '东莞松山湖TC', city: '东莞', logo: '/assets/images/club/logo-6.jpg', members: 28, points: 1100, power: 1320 },
];

function valueOf(club: RankedClub, metric: string): number {
  if (metric === '积分') return club.points;
  return club.power;
}

export function rankClubs(metric: string): RankedClub[] {
  return [...RAW_CLUBS].sort((a, b) => valueOf(b, metric) - valueOf(a, metric));
}

export function toClubPodium(clubs: RankedClub[], metric: string): PodiumPlayer[] {
  const [first, second, third] = clubs;
  const build = (club: RankedClub | undefined, rank: 1 | 2 | 3): PodiumPlayer => ({
    rank,
    nickname: club?.name ?? '虚位以待',
    club: club?.city ?? '--',
    score: club ? String(valueOf(club, metric)) : '--',
    avatar: club?.logo ?? '/assets/images/club/logo-1.jpg',
  });
  return [build(second, 2), build(first, 1), build(third, 3)];
}

export function toClubRows(clubs: RankedClub[], metric: string): RankingRow[] {
  return clubs.slice(3).map((club, index) => ({
    rank: index + 4,
    nickname: club.name,
    club: `成员 ${club.members} 人`,
    score: String(valueOf(club, metric)),
    badge: club.city,
    avatar: club.logo,
  }));
}

export const MY_CLUB_RANKING = {
  summary: '我的俱乐部  第5  •  战力 1680',
  actionText: '去查看',
};

export { COLLAPSED_ROW_COUNT };
