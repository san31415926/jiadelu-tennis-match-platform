/**
 * 超级杯页假数据。
 * 与首页不同，这里的宫格在设计中是规整的 Auto Layout：
 * 两行四列，图标统一 110x105，因此不需要逐项几何。
 */
import type { EventItem, HomeBanner } from './home';

export interface SuperCupFeature {
  key: string;
  label: string;
  icon: string;
  path: string;
}

export const SUPER_CUP_BANNERS: HomeBanner[] = [
  {
    id: 'sc-banner-union',
    title: '广佛俱乐部联名赛',
    subtitle: '球员精彩瞬间 · 点击查看',
    target: '/pages/gallery/index',
  },
  {
    id: 'sc-banner-leaderboard',
    title: '俱乐部战力榜更新',
    subtitle: '86 家俱乐部 · 查看排名',
    target: '/pages/clubs/index',
  },
  {
    id: 'sc-banner-evergreen',
    title: '常青杯报名开启',
    subtitle: '年长组专属赛事 · 立即了解',
    target: '/pages/super-cup/index',
  },
];

export const SUPER_CUP_FEATURES: SuperCupFeature[] = [
  {
    key: 'super-cup-event',
    label: '超级杯赛事',
    icon: '/assets/icons/super-cup/super-cup-event.png',
    path: '/pages/super-cup/index',
  },
  {
    key: 'rookie-cup-event',
    label: '新秀杯赛事',
    icon: '/assets/icons/super-cup/rookie-cup-event.png',
    path: '/pages/super-cup/index',
  },
  {
    key: 'women-club-event',
    label: '女俱乐部赛',
    icon: '/assets/icons/super-cup/women-club-event.png',
    path: '/pages/super-cup/index',
  },
  {
    key: 'evergreen-cup-event',
    label: '常青杯赛事',
    icon: '/assets/icons/super-cup/evergreen-cup-event.png',
    path: '/pages/super-cup/index',
  },
  {
    key: 'club-leaderboard',
    label: '俱乐部榜单',
    icon: '/assets/icons/super-cup/club-leaderboard.png',
    path: '/pages/clubs/index',
  },
  {
    key: 'past-champions',
    label: '历届冠军',
    icon: '/assets/icons/super-cup/past-champions.png',
    path: '/pages/champions/index',
  },
  {
    key: 'annual-best',
    label: '年度最佳',
    icon: '/assets/icons/super-cup/annual-best.png',
    path: '/pages/ceremony/index',
  },
  {
    key: 'club-badge',
    label: '俱乐部',
    icon: '/assets/icons/super-cup/club-badge.png',
    path: '/pages/clubs/index',
  },
];

/** 俱乐部赛事按队计算签位，与个人赛的人数口径不同 */
const COURT_PHOTO = '/assets/images/court-photo.jpg';

export const SUPER_CUP_EVENTS: Record<string, EventItem[]> = {
  我的报名: [],
  报名中: [
    {
      id: 'sc-open-1',
      title: '俱乐部新秀杯（第二届）',
      poster: COURT_PHOTO,
      venue: '广州 · 润盈网球中心',
      time: '12月16日 10:00-18:00',
      slots: '12/16 队',
      actionText: '团队报名',
    },
    {
      id: 'sc-open-2',
      title: '女子俱乐部邀请赛',
      poster: COURT_PHOTO,
      venue: '佛山 · 球球热网球禅城店',
      time: '11月08日 09:00-17:00',
      slots: '6/12 队',
      actionText: '团队报名',
    },
  ],
  进行中: [
    {
      id: 'sc-live-1',
      title: '第一届 LTJIMMY 超级杯',
      poster: COURT_PHOTO,
      venue: '广州 · 天河体育中心',
      time: '08月20日 13:00-21:00',
      slots: '16/16 队',
      actionText: '查看对阵',
    },
  ],
  已结束: [
    {
      id: 'sc-done-1',
      title: '常青杯团体赛（第三届）',
      poster: COURT_PHOTO,
      venue: '东莞 · 松山湖 TC',
      time: '06月14日 10:00-18:00',
      slots: '8/8 队',
      actionText: '查看成绩',
    },
  ],
};
