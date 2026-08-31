/**
 * LTJIMMY 选手号与年度会员。
 *
 * L-ID 是永久身份（一人一号），年费买的是报 L-15 / L-25 的资格，不是号本身。
 * 年费不等于免单站报名费。排名积分只来自会员参加的巡回赛，52 周滚动。
 */

export const PLAYER_ID_PREFIX = 'L-';
export const LATE_WITHDRAW_EXEMPT = 3;
export const RANK_WINDOW_DAYS = 52 * 7;
export const TOUR_NEEDS_MEMBER = ['L-15', 'L-25', 'masters'];

export function rawUid(uid: string): string {
  return String(uid || '')
    .replace(/^UID\s*/i, '')
    .replace(/^L-/i, '')
    .trim();
}

export function formatPlayerId(uid: string): string {
  const raw = rawUid(uid);
  if (!raw || raw === '--') {
    return 'L-ID --';
  }
  return `${PLAYER_ID_PREFIX}${raw}`;
}

export function todayKey(now = Date.now()): string {
  const date = new Date(now);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function isPlayerMember(
  memberUntil?: string | number,
  memberPaused?: boolean,
): boolean {
  if (memberPaused) {
    return false;
  }
  const until = String(memberUntil || '').slice(0, 10);
  return !!until && until >= todayKey();
}

export function tourSeriesOf(value: unknown): 'open' | 'L-15' | 'L-25' | 'masters' {
  const text = String(value || 'open');
  if (text === 'L-15' || text === 'L-25' || text === 'masters') {
    return text;
  }
  return 'open';
}

export function tourNeedsMember(tour: string): boolean {
  return TOUR_NEEDS_MEMBER.indexOf(tour) >= 0;
}

export function dateKeyInRankWindow(dateKey: string, now = Date.now()): boolean {
  const key = String(dateKey || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    return false;
  }
  const played = Date.parse(`${key}T00:00:00`);
  if (!played) {
    return false;
  }
  return now - played <= RANK_WINDOW_DAYS * 24 * 3600 * 1000;
}
