/**
 * ============================================================================
 * 超级杯页数据
 * ============================================================================
 *
 * 【和首页的区别】
 * 首页七宫格的图标是逐个手调位置和大小的（所以 HomeFeature 有 iconStyle 字段），
 * 而超级杯的八个宫格在设计里是规整的两行四列，图标统一 110×105，
 * 所以 SuperCupFeature 不需要 iconStyle，页面用 CSS 统一控制。
 *
 * 【复用了首页的类型】
 * EventItem 和 HomeBanner 直接从 home.ts 引入，因为赛事卡片和轮播的结构
 * 完全一样。改 home.ts 里那两个 interface 会同时影响这里。
 *
 * 【常见改动】
 * 想改八个入口的名字/图标 → 改 SUPER_CUP_FEATURES
 * 想改轮播图/文案         → 改 SUPER_CUP_BANNERS（图和首页共用 banners 目录）
 * 想改赛事内容             → 改 SUPER_CUP_EVENTS
 * 想加第三行入口           → 加数据后要同时加大 tokens.wxss 的 --grid-height，
 *                            并检查 pages/super-cup/index.ts 里 toRows 的每行个数
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
    image: '/assets/images/banners/banner-01-club-union.jpg',
    target: '/pages/gallery/index',
  },
  {
    id: 'sc-banner-rookie',
    title: '俱乐部新秀杯',
    subtitle: '第二届 · 12 支球队集结',
    image: '/assets/images/banners/banner-02-rookie-cup.jpg',
    target: '/pages/super-cup/index',
  },
  {
    id: 'sc-banner-ceremony',
    title: '年度颁奖典礼',
    subtitle: '11 月 15 日 · 广州四季酒店',
    image: '/assets/images/banners/banner-03-ceremony.jpg',
    target: '/pages/poster/index?id=ceremony',
  },
  {
    id: 'sc-banner-champion',
    title: '超级杯冠军之夜',
    subtitle: '俱乐部荣耀时刻',
    image: '/assets/images/banners/banner-04-super-cup.jpg',
    target: '/pages/super-cup/index',
  },
  {
    id: 'sc-banner-night',
    title: '夜间球场开放',
    subtitle: '灯光球场 · 预约开打',
    image: '/assets/images/banners/banner-05-night-court.jpg',
    target: '/pages/clubs/index',
  },
  {
    id: 'sc-banner-mixed',
    title: '混双精彩对决',
    subtitle: '默契搭档 · 点击查看',
    image: '/assets/images/banners/banner-06-mixed-doubles.jpg',
    target: '/pages/gallery/index',
  },
];

export const SUPER_CUP_FEATURES: SuperCupFeature[] = [
  {
    key: 'super-cup-event',
    label: '超级杯赛事',
    icon: '/assets/icons/super-cup/super-cup-event.png',
    path: '/pages/poster/index?id=super-cup',
  },
  {
    key: 'rookie-cup-event',
    label: '新秀杯赛事',
    icon: '/assets/icons/super-cup/rookie-cup-event.png',
    path: '/pages/poster/index?id=rookie-cup',
  },
  {
    key: 'women-club-event',
    label: '女俱乐部赛',
    icon: '/assets/icons/super-cup/women-club-event.png',
    path: '/pages/poster/index?id=women-cup',
  },
  {
    key: 'evergreen-cup-event',
    label: '常青杯赛事',
    icon: '/assets/icons/super-cup/evergreen-cup-event.png',
    path: '/pages/poster/index?id=evergreen-cup',
  },
  {
    key: 'club-leaderboard',
    label: '俱乐部榜单',
    icon: '/assets/icons/super-cup/club-leaderboard.png',
    path: '/pages/club-ranking/index',
  },
  {
    key: 'past-champions',
    label: '历届冠军',
    icon: '/assets/icons/super-cup/past-champions.png',
    path: '/pages/poster/index?id=champions',
  },
  {
    key: 'annual-best',
    label: '年度最佳',
    icon: '/assets/icons/super-cup/annual-best.png',
    path: '/pages/poster/index?id=annual-best',
  },
  {
    key: 'club-badge',
    label: '俱乐部',
    icon: '/assets/icons/super-cup/club-badge.png',
    path: '/pages/clubs/index',
  },
];

const COURT_PHOTO = '/assets/images/court-photo.jpg';

/**
 * 超级杯的赛事列表。
 *
 * 【注意 slots 的口径不同】
 * 俱乐部赛事是按「队」报名的，所以写「12/16 队」；个人赛事按人，写「8/16」。
 * 按钮文字也相应是「团队报名」而不是「立即报名」。
 *
 * 【「我的报名」是空数组】
 * 故意留空用来演示空状态。未登录时会显示「登录后查看你报名的赛事」，
 * 登录后显示「该分类下暂无赛事」。想看有数据的效果就往里加几条。
 */
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
