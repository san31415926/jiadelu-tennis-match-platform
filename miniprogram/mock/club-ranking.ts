/**
 * ============================================================================
 * 俱乐部榜单数据 —— 视觉刷新草稿 V5（Figma 287:292）
 * ============================================================================
 *
 * 和球员排行同一套领奖台 + 列表，但没有城市榜 / 全国榜。
 * V5 多了「本月 / 累计」时间范围，指标仍是战力、积分。
 *
 * 【常见改动】
 * 加俱乐部     → 往 RANKED_CLUBS 加一条，logo 可以复用已有的 club/logo-*.jpg
 * 改指标名称   → 改 CLUB_RANKING_METRICS，同时改 valueOf()
 * 改时间范围   → 改 CLUB_RANKING_PERIODS
 * 改「我的俱乐部」是哪一家 → 改 MY_CLUB_ID
 */
import { COLLAPSED_ROW_COUNT } from './ranking';
import type { PodiumPlayer, RankingRow } from './ranking';

export interface RankedClub {
  id: string;
  name: string;
  city: string;
  logo: string;
  members: number;
  /** 本月积分，对应「本月 × 积分」 */
  monthPoints: number;
  /** 本月战力，对应「本月 × 战力」 */
  monthPower: number;
  /** 累计积分 */
  points: number;
  /** 累计 / 总战力 */
  power: number;
}

export interface ClubPodiumPlayer extends PodiumPlayer {
  id: string;
}

export interface ClubRankingRow extends RankingRow {
  id: string;
}

export const CLUB_RANKING_PERIODS = ['本月', '累计'];
export const CLUB_RANKING_METRICS = ['积分', '战力'];

/** 底部「我的俱乐部」条对应的那一家，和 mock/club.ts 里 joined: true 的 club-5 对齐 */
export const MY_CLUB_ID = 'club-5';

export const RANKED_CLUBS: RankedClub[] = [
  { id: 'club-1', name: '菜菜才不菜', city: '广州', logo: '/assets/images/club/logo-1.jpg', members: 24, monthPoints: 1860, monthPower: 1980, points: 4200, power: 5100 },
  { id: 'club-2', name: 'GagaTennis Club', city: '佛山', logo: '/assets/images/club/logo-2.jpg', members: 31, monthPoints: 1790, monthPower: 1910, points: 4680, power: 4900 },
  { id: 'club-3', name: '椒个鹏友', city: '广州', logo: '/assets/images/club/logo-3.jpg', members: 18, monthPoints: 1640, monthPower: 1840, points: 3900, power: 4720 },
  { id: 'club-4', name: 'Volt Court 颜技社', city: '深圳', logo: '/assets/images/club/logo-4.jpg', members: 26, monthPoints: 1580, monthPower: 1760, points: 3520, power: 4480 },
  { id: 'club-5', name: 'inininAlive Club', city: '广州', logo: '/assets/images/club/logo-5.jpg', members: 22, monthPoints: 1520, monthPower: 1680, points: 3380, power: 4210 },
  { id: 'club-6', name: 'RisingAce 网球社', city: '东莞', logo: '/assets/images/club/logo-6.jpg', members: 29, monthPoints: 1470, monthPower: 1620, points: 3210, power: 4050 },
  { id: 'club-7', name: '广州嘻哈', city: '广州', logo: '/assets/images/club/logo-1.jpg', members: 20, monthPoints: 1400, monthPower: 1540, points: 2980, power: 3860 },
  { id: 'club-8', name: '深圳ACE网球俱乐部', city: '深圳', logo: '/assets/images/club/logo-4.jpg', members: 33, monthPoints: 1320, monthPower: 1470, points: 3600, power: 3990 },
  { id: 'club-9', name: '佛山飞跃队', city: '佛山', logo: '/assets/images/club/logo-2.jpg', members: 16, monthPoints: 1210, monthPower: 1400, points: 2740, power: 3520 },
  { id: 'club-10', name: '东莞松山湖TC', city: '东莞', logo: '/assets/images/club/logo-6.jpg', members: 28, monthPoints: 1100, monthPower: 1320, points: 2560, power: 3380 },
];

function valueOf(club: RankedClub, metric: string, period: string): number {
  const cumulative = period === '累计';
  if (metric === '积分') {
    return cumulative ? club.points : club.monthPoints;
  }
  return cumulative ? club.power : club.monthPower;
}

export function rankGivenClubs(
  clubs: RankedClub[],
  metric: string,
  period = '本月',
): RankedClub[] {
  return [...clubs].sort((a, b) => valueOf(b, metric, period) - valueOf(a, metric, period));
}

export function rankClubs(metric: string, period = '本月'): RankedClub[] {
  return rankGivenClubs(RANKED_CLUBS, metric, period);
}

export function toClubPodium(
  clubs: RankedClub[],
  metric: string,
  period = '本月',
): ClubPodiumPlayer[] {
  const [first, second, third] = clubs;
  const build = (club: RankedClub | undefined, rank: 1 | 2 | 3): ClubPodiumPlayer => ({
    id: club?.id ?? '',
    rank,
    nickname: club?.name ?? '虚位以待',
    club: club ? `${club.city} · ${club.members}人` : '--',
    score: club ? String(valueOf(club, metric, period)) : '--',
    avatar: club?.logo ?? '/assets/images/club/logo-1.jpg',
  });
  return [build(second, 2), build(first, 1), build(third, 3)];
}

export function toClubRows(
  clubs: RankedClub[],
  metric: string,
  period = '本月',
): ClubRankingRow[] {
  return clubs.slice(3).map((club, index) => ({
    id: club.id,
    rank: index + 4,
    nickname: club.name,
    club: `${club.city} · ${club.members}人`,
    score: String(valueOf(club, metric, period)),
    badge: '',
    avatar: club.logo,
  }));
}

export function myClubRankingOf(
  clubs: RankedClub[],
  clubId: string,
  metric: string,
  period = '本月',
) {
  if (!clubId) {
    return { summary: '', actionText: '', clubId: '' };
  }
  const ranked = rankGivenClubs(clubs, metric, period);
  const index = ranked.findIndex((club) => club.id === clubId);
  const club = index >= 0 ? ranked[index] : undefined;
  const rank = index >= 0 ? index + 1 : '--';
  const score = club ? valueOf(club, metric, period) : '--';
  return {
    summary: `我的俱乐部  第${rank}  •  ${metric} ${score}`,
    actionText: '去查看',
    clubId,
  };
}

export function myClubRanking(metric: string, period = '本月') {
  return myClubRankingOf(RANKED_CLUBS, MY_CLUB_ID, metric, period);
}

/**
 * 超级杯版俱乐部主页那四个数字：本月积分、总战力、积分榜、战力榜。
 * 名次按「本月积分」和「累计战力」分别排，和稿上 本月积分 / 总战力 两套口径对齐。
 */
export function clubSuperCupStatsOf(clubs: RankedClub[], id: string) {
  const byPoints = rankGivenClubs(clubs, '积分', '本月');
  const byPower = rankGivenClubs(clubs, '战力', '累计');
  const club = clubs.find((item) => item.id === id) ?? clubs[0];
  const pointsRank = byPoints.findIndex((item) => item.id === club.id) + 1;
  const powerRank = byPower.findIndex((item) => item.id === club.id) + 1;
  return {
    monthPoints: club.monthPoints,
    power: club.power,
    pointsRank,
    powerRank,
  };
}

export function clubSuperCupStats(id: string) {
  return clubSuperCupStatsOf(RANKED_CLUBS, id);
}

export { COLLAPSED_ROW_COUNT };
