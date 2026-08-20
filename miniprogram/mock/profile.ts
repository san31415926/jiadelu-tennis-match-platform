/** 我的页假数据，字段与 Figma node 10:213 的文本节点一一对应 */

export interface ProfileMenuItem {
  key: string;
  label: string;
  icon: string;
  path: string;
  /** 设计中「商务合作」「关于我们」的图标做了水平镜像 */
  mirrored?: boolean;
}

export interface ProfileSummary {
  nickname: string;
  rating: string;
  level: string;
  marketValue: string;
  marketValueTrend: string;
  points: string;
  xpHint: string;
  /** XP 进度条：设计中填充 377 / 轨道 690 */
  xpPercent: number;
}

/**
 * 未登录 / 未评级状态。设计稿只画了已登录态，这里沿用同一套布局，
 * 只把数值换成占位符，符合功能清单「未评级显示 --」「默认昵称微信用户」的要求。
 */
export const GUEST_PROFILE: ProfileSummary = {
  nickname: '微信用户',
  rating: '未评级',
  level: 'Lv.--',
  marketValue: '--',
  marketValueTrend: '',
  points: '--',
  xpHint: '完成首场比赛后开启等级',
  xpPercent: 0,
};

export const MOCK_PROFILE: ProfileSummary = {
  nickname: '帆',
  rating: '评分 5.0',
  level: 'Lv.18',
  marketValue: '¥12,800',
  marketValueTrend: '↑ 6.7%',
  points: '1650',
  xpHint: '距 Lv.19 还差 320 XP',
  xpPercent: 54.6,
};

export const PROFILE_MENU: ProfileMenuItem[] = [
  {
    key: 'profile',
    label: '我的资料',
    icon: '/assets/icons/profile/profile-info.png',
    path: '/pages/profile-edit/index',
  },
  {
    key: 'business',
    label: '商务合作',
    icon: '/assets/icons/profile/business-handshake.png',
    path: '/pages/business/index',
    mirrored: true,
  },
  {
    key: 'about',
    label: '关于我们',
    icon: '/assets/icons/profile/about-us.png',
    path: '/pages/about/index',
    mirrored: true,
  },
  {
    key: 'club',
    label: '我的俱乐部',
    icon: '/assets/icons/profile/my-club-flag.png',
    path: '/pages/clubs/index',
  },
  {
    key: 'records',
    label: '参赛记录',
    icon: '/assets/icons/profile/records-trophy.png',
    path: '/pages/records/index',
  },
  {
    key: 'service',
    label: '联系客服',
    icon: '/assets/icons/profile/customer-service.png',
    path: '/pages/service/index',
  },
];
