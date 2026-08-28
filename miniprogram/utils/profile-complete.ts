/**
 * ============================================================================
 * 资料完成度 —— 按已填项现算，不要写死 20%
 * ============================================================================
 *
 * 「我的生涯」卡片上那行百分比。以前存在 users.profileComplete 里，
 * 新建用户写死 20%，保存资料也不会改，所以看起来是固定的。
 *
 * 现在按下面 10 项各算 10%。想增减计分项，改 CHECKS，云函数 login /
 * updateProfile 里同名函数要一起改，两边规则才一致。
 *
 * 不计分：性别 / 惯用手 / 常打项目（一进来就有默认值，算上会虚高）。
 * 俱乐部按 club_members / users.clubId 算，不要只看资料页有没有手填。
 * 头像还是包内那张默认图、昵称还是「微信用户」，都算没填。
 */

const DEFAULT_AVATAR = '/assets/images/avatars/anime-01.jpg';

function hasText(value?: string): boolean {
  return String(value || '').trim().length > 0;
}

type ProfileBits = {
  nickname?: string;
  avatar?: string;
  phone?: string;
  realName?: string;
  city?: string;
  club?: string;
  clubId?: string;
  years?: string;
  tags?: string;
  bio?: string;
  cover?: string;
};

const CHECKS: Array<(profile: ProfileBits) => boolean> = [
  (p) => hasText(p.avatar) && p.avatar !== DEFAULT_AVATAR,
  (p) => {
    const name = String(p.nickname || '').trim();
    return !!name && name !== '微信用户' && name !== '登录';
  },
  (p) => hasText(p.phone),
  (p) => hasText(p.realName),
  (p) => hasText(p.city),
  (p) => hasText(p.club) || hasText(p.clubId),
  (p) => hasText(p.years),
  (p) => hasText(p.tags),
  (p) => hasText(p.bio),
  (p) => hasText(p.cover),
];

export function profileCompleteLabel(profile: ProfileBits): string {
  const filled = CHECKS.filter((check) => check(profile)).length;
  return `${Math.round((filled / CHECKS.length) * 100)}%`;
}

export function withProfileComplete<T extends ProfileBits>(profile: T): T {
  return {
    ...profile,
    profileComplete: profileCompleteLabel(profile),
  };
}
