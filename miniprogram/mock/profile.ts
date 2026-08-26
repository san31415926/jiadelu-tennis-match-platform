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
 * 想改示例头像 → 改 MOCK_PROFILE.avatar，图在 assets/images/avatars/
 * 想改未登录文案   → 改 GUEST_PROFILE
 * 想改背景色色板   → 改 PROFILE_THEMES；选中后由 utils/theme.ts 作用到全站
 *                    顶栏 / 页底，不只这一页的霜化罩
 * 封面默认空，只显示主题纯色。用户从相册上传后才写入 cover。
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

export const PROFILE_THEMES: ProfileTheme[] = [
  { key: 'mint', label: '薄荷', swatch: '#66c4b4' },
  { key: 'lime', label: '青柠', swatch: '#83d414' },
  { key: 'gold', label: '暖金', swatch: '#e2b15a' },
  { key: 'sky', label: '天空', swatch: '#6eb4e0' },
  { key: 'dusk', label: '暮粉', swatch: '#e08aaa' },
  { key: 'photo', label: '原图', swatch: '' },
];

export const GUEST_PROFILE: ProfileSummary = {
  nickname: '登录',
  avatar: '/assets/images/avatars/anime-01.jpg',
  uid: 'UID --',
  bio: '登录后编辑介绍',
  cover: '',
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
  avatar: '/assets/images/avatars/anime-01.jpg',
  uid: 'UID 10008652',
  bio: '',
  cover: '',
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
