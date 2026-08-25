/**
 * ============================================================================
 * 我的页数据 —— 视觉刷新草稿 V5（Figma 302:103 / 401:359）
 * ============================================================================
 *
 * 【两套数据的作用】
 * MOCK_PROFILE  = 已登录的示例资料
 * GUEST_PROFILE = 未登录占位，数值是 --
 * 页面布局只有一套，靠换数据切换。
 *
 * 【常见改动】
 * 想改示例资料     → 改 MOCK_PROFILE
 * 想改未登录文案   → 改 GUEST_PROFILE
 * 想改封面候选图   → 改 PROFILE_COVERS
 * 想改背景色色板   → 改 PROFILE_THEMES（页面用 theme 字段换 CSS class）
 * 想改战力六个分   → 改 MOCK_PROFILE.radar
 */
export interface ProfileRadar {
  overall: number;
  axes: { label: string; value: number }[];
}

export interface ProfileSummary {
  nickname: string;
  avatar: string;
  uid: string;
  bio: string;
  cover: string;
  theme: string;
  marketValue: string;
  points: string;
  wins: string;
  hand: string;
  profileComplete: string;
  clubRank: string;
  clubMembers: string;
  recordSummary: string;
  lastEvent: string;
  radar: ProfileRadar;
}

export interface ProfileTheme {
  key: string;
  label: string;
  /** 色点本身的颜色 */
  swatch: string;
}

export interface ProfileCover {
  id: string;
  image: string;
}

export const PROFILE_THEMES: ProfileTheme[] = [
  { key: 'mint', label: '薄荷', swatch: '#66c4b4' },
  { key: 'lime', label: '青柠', swatch: '#83d414' },
  { key: 'gold', label: '暖金', swatch: '#e2b15a' },
  { key: 'sky', label: '天空', swatch: '#6eb4e0' },
  { key: 'dusk', label: '暮粉', swatch: '#e08aaa' },
  { key: 'photo', label: '原图', swatch: '' },
];

export const PROFILE_COVERS: ProfileCover[] = [
  { id: 'cover-1', image: '/assets/images/banners/banner-01-club-union.jpg' },
  { id: 'cover-2', image: '/assets/images/banners/banner-04-super-cup.jpg' },
  { id: 'cover-3', image: '/assets/images/banners/banner-05-night-court.jpg' },
];

export const GUEST_PROFILE: ProfileSummary = {
  nickname: '登录',
  avatar: '/assets/images/ranking/avatar-demo.jpg',
  uid: 'UID --',
  bio: '登录后编辑介绍',
  cover: PROFILE_COVERS[0].image,
  theme: 'mint',
  marketValue: '--',
  points: '--',
  wins: '--',
  hand: '--',
  profileComplete: '--',
  clubRank: '--',
  clubMembers: '--',
  recordSummary: '登录后查看参赛记录',
  lastEvent: '',
  radar: {
    overall: 0,
    axes: [
      { label: '发球', value: 0 },
      { label: '正手', value: 0 },
      { label: '反手', value: 0 },
      { label: '网前', value: 0 },
      { label: '步伐', value: 0 },
      { label: '体能', value: 0 },
    ],
  },
};

export const MOCK_PROFILE: ProfileSummary = {
  nickname: '帆',
  avatar: '/assets/images/ranking/avatar-demo.jpg',
  uid: 'UID 10008652',
  bio: '',
  cover: PROFILE_COVERS[0].image,
  theme: 'mint',
  marketValue: '¥12,800',
  points: '1650',
  wins: '8',
  hand: '右手',
  profileComplete: '80%',
  clubRank: '第5',
  clubMembers: '26人',
  recordSummary: '12 场比赛   8 胜  4 负',
  lastEvent: '7.0混双评级赛',
  radar: {
    overall: 73,
    axes: [
      { label: '发球', value: 78 },
      { label: '正手', value: 86 },
      { label: '反手', value: 64 },
      { label: '网前', value: 58 },
      { label: '步伐', value: 80 },
      { label: '体能', value: 72 },
    ],
  },
};
