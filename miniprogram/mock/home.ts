/**
 * 首页假数据。云开发接通后由 services 层替换，页面结构不需要改动。
 * 宫格图标的位置与尺寸逐项来自 Figma node 1:239 的子节点标注。
 */

export interface HomeBanner {
  id: string;
  title: string;
  subtitle: string;
  target: string;
}

export interface HomeFeature {
  key: string;
  label: string;
  icon: string;
  iconStyle: string;
  path: string;
}

export interface EventItem {
  id: string;
  title: string;
  poster: string;
  venue: string;
  time: string;
  slots: string;
  actionText: string;
}

export const HOME_BANNERS: HomeBanner[] = [
  {
    id: 'banner-super-cup',
    title: '广佛俱乐部联名赛',
    subtitle: '球员精彩瞬间 · 点击查看',
    target: '/pages/gallery/index',
  },
  {
    id: 'banner-rookie-cup',
    title: '俱乐部新秀杯（第二届）',
    subtitle: '12 支球队集结 · 查看赛程',
    target: '/pages/super-cup/index',
  },
  {
    id: 'banner-annual',
    title: 'LTJIMMY® 年度颁奖典礼',
    subtitle: '11 月 15 日 · 广州四季酒店',
    target: '/pages/ceremony/index',
  },
];

export const HOME_FEATURES: HomeFeature[] = [
  {
    key: 'ranking',
    label: '球员排行',
    icon: '/assets/icons/home/player-ranking.png',
    iconStyle: 'left:16rpx;top:-6rpx;width:111rpx;height:100rpx',
    path: '/pages/ranking/index',
  },
  {
    key: 'calendar',
    label: '赛事日历',
    icon: '/assets/icons/home/event-calendar.png',
    iconStyle: 'left:23rpx;top:0;width:113rpx;height:91rpx',
    path: '/pages/calendar/index',
  },
  {
    key: 'rewards',
    label: '积分兑换',
    icon: '/assets/icons/home/point-exchange.png',
    iconStyle: 'left:29rpx;top:-9rpx;width:100rpx;height:100rpx',
    path: '/pages/rewards/index',
  },
  {
    key: 'champions',
    label: '历届冠军',
    icon: '/assets/icons/home/past-champions.png',
    iconStyle: 'left:29rpx;top:5rpx;width:99rpx;height:86rpx',
    path: '/pages/champions/index',
  },
  {
    key: 'photos',
    label: '赛事照片',
    icon: '/assets/icons/home/event-photos.png',
    iconStyle: 'left:34rpx;top:13rpx;width:95rpx;height:78rpx',
    path: '/pages/gallery/index',
  },
  {
    key: 'annual',
    label: '年会典礼',
    icon: '/assets/icons/home/annual-ceremony.png',
    iconStyle: 'left:24rpx;top:-12rpx;width:103rpx;height:101rpx',
    path: '/pages/ceremony/index',
  },
  {
    key: 'registrations',
    label: '我的报名',
    icon: '/assets/icons/home/my-registrations.png',
    iconStyle: 'left:14rpx;top:-3rpx;width:110rpx;height:110rpx',
    path: '/pages/registrations/index',
  },
];

export const EVENT_FILTERS = ['我的报名', '报名中', '进行中', '已结束'];

const COURT_PHOTO = '/assets/images/court-photo.jpg';

export const MOCK_EVENTS: Record<string, EventItem[]> = {
  我的报名: [
    {
      id: 'e-mine-1',
      title: '7.0混双评级赛',
      poster: COURT_PHOTO,
      venue: '佛山球球热网球禅城店',
      time: '08月29日 16:00-21:00',
      slots: '8/16',
      actionText: '查看详情',
    },
  ],
  报名中: [
    {
      id: 'e-open-1',
      title: '7.0混双评级赛',
      poster: COURT_PHOTO,
      venue: '佛山球球热网球禅城店',
      time: '08月29日 16:00-21:00',
      slots: '8/16',
      actionText: '立即报名',
    },
    {
      id: 'e-open-2',
      title: '6.5男双积分赛',
      poster: COURT_PHOTO,
      venue: '广州润盈网球中心',
      time: '09月06日 09:00-18:00',
      slots: '12/16',
      actionText: '立即报名',
    },
  ],
  进行中: [
    {
      id: 'e-live-1',
      title: '常青杯团体赛',
      poster: COURT_PHOTO,
      venue: '东莞松山湖 TC',
      time: '08月20日 14:00-20:00',
      slots: '16/16',
      actionText: '查看对阵',
    },
  ],
  已结束: [
    {
      id: 'e-done-1',
      title: '7.0混双评级赛',
      poster: COURT_PHOTO,
      venue: '佛山球球热网球禅城店',
      time: '08月29日 16:00-21:00',
      slots: '8/16',
      actionText: '查看成绩',
    },
  ],
};
