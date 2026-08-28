/**
 * ============================================================================
 * 超级杯页数据 —— 视觉刷新草稿 V5
 * ============================================================================
 *
 * 【和首页的区别】
 * 首页把入口收进汉堡侧栏。超级杯 V5 没有侧栏：四项杯赛、三项荣誉走
 * Cover Flow（中间大、两侧小，可横滑），俱乐部入口是下面那颗绿按钮。
 *
 * 【复用了首页的类型】
 * EventItem 和 HomeBanner 直接从 home.ts 引入。赛事卡要填齐 grade / tags /
 * price / statusLabel 等字段，event-card 才能画出 V5 卡片；不要去改
 * EventItem 接口本身。
 *
 * 【常见改动】
 * 想改杯赛 / 荣誉入口 → 改 SUPER_CUP_FEATURES（荣誉走 path；杯赛按关键词筛本页列表）
 * 想改头图 / 叠字     → 图用 banners 目录（直边、不要白浪）；文案改 SUPER_CUP_BANNERS
 * 想改赛事内容         → 改 SUPER_CUP_EVENTS，键名必须和 EVENT_FILTERS 一致
 * Cover Flow 的排列    → 改 SUPER_CUP_EVENT_TYPE_KEYS / SUPER_CUP_HONOR_KEYS
 */
import type { EventItem, HomeBanner } from './home';
import { EVENT_TAGS } from './home';

export interface SuperCupFeature {
  key: string;
  label: string;
  icon: string;
  path: string;
}

/** 头图叠字比 HomeBanner 多一个左上角小标签，没有就不画 */
export interface SuperCupBanner extends HomeBanner {
  eyebrow?: string;
}

export const SUPER_CUP_BANNERS: SuperCupBanner[] = [
  {
    id: 'sc-banner-union',
    eyebrow: '俱乐部联赛',
    title: '广佛俱乐部联名赛',
    subtitle: '球员精彩瞬间 · 点击查看',
    image: '/assets/images/banners/banner-01-club-union-photo.jpg',
    target: '/pages/gallery/index',
  },
  {
    id: 'sc-banner-rookie',
    eyebrow: '俱乐部联赛',
    title: '俱乐部新秀杯',
    subtitle: '第二届 · 12 支球队集结',
    image: '/assets/images/banners/banner-02-rookie-cup-photo.jpg',
    target: '/pages/super-cup/index',
  },
  {
    id: 'sc-banner-ceremony',
    eyebrow: '年度盛典',
    title: '年度颁奖典礼',
    subtitle: '11 月 15 日 · 广州四季酒店',
    image: '/assets/images/banners/banner-03-ceremony-photo.jpg',
    target: '/pages/poster/index?id=ceremony',
  },
  {
    id: 'sc-banner-champion',
    eyebrow: '俱乐部联赛',
    title: '超级杯冠军之夜',
    subtitle: '俱乐部荣耀时刻',
    image: '/assets/images/banners/banner-04-super-cup-photo.jpg',
    target: '/pages/super-cup/index',
  },
  {
    id: 'sc-banner-night',
    eyebrow: '球场开放',
    title: '夜间球场开放',
    subtitle: '灯光球场 · 预约开打',
    image: '/assets/images/banners/banner-05-night-court-photo.jpg',
    target: '/pages/clubs/index',
  },
  {
    id: 'sc-banner-mixed',
    eyebrow: '精彩瞬间',
    title: '混双精彩对决',
    subtitle: '默契搭档 · 点击查看',
    image: '/assets/images/banners/banner-06-mixed-doubles-photo.jpg',
    target: '/pages/gallery/index',
  },
];

/**
 * 八个入口仍保留完整列表，Cover Flow 和绿按钮按 key 来取。
 * 杯赛入口筛本页云库列表；荣誉 / 俱乐部仍走这里的 path。
 */
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

/** 赛事类型 Cover Flow 的显示顺序：常青杯 / 超级杯 / 新秀杯 / 女俱乐部赛 */
export const SUPER_CUP_EVENT_TYPE_KEYS = [
  'evergreen-cup-event',
  'super-cup-event',
  'rookie-cup-event',
  'women-club-event',
];

/** 荣誉与榜单 Cover Flow：年度最佳 / 俱乐部榜单 / 历届冠军 */
export const SUPER_CUP_HONOR_KEYS = [
  'annual-best',
  'club-leaderboard',
  'past-champions',
];

function featuresByKeys(keys: string[]): SuperCupFeature[] {
  return keys
    .map((key) => SUPER_CUP_FEATURES.find((item) => item.key === key))
    .filter((item): item is SuperCupFeature => Boolean(item));
}

export const SUPER_CUP_EVENT_TYPES = featuresByKeys(SUPER_CUP_EVENT_TYPE_KEYS);
export const SUPER_CUP_HONORS = featuresByKeys(SUPER_CUP_HONOR_KEYS);
export const SUPER_CUP_CLUB_CENTER = SUPER_CUP_FEATURES.find(
  (item) => item.key === 'club-badge',
) as SuperCupFeature;

/** 点赛事类型 Cover Flow 时，用标题/等级里的关键词筛云库俱乐部赛。 */
export const SUPER_CUP_SERIES_HINT: Record<string, string[]> = {
  'super-cup-event': ['超级杯'],
  'rookie-cup-event': ['新秀'],
  'women-club-event': ['女'],
  'evergreen-cup-event': ['常青'],
};

export function matchSuperCupSeries(item: EventItem, key: string): boolean {
  const hints = SUPER_CUP_SERIES_HINT[key];
  if (!hints || hints.length === 0) {
    return true;
  }
  const hay = `${item.title} ${item.grade} ${item.slotCaption} ${item.category}`;
  return hints.some((hint) => hay.indexOf(hint) >= 0);
}

const COURT_PHOTO = '/assets/images/court-photo.jpg';

/**
 * 超级杯的赛事列表。
 *
 * 【注意 slots 的口径不同】
 * 俱乐部赛事是按「队」报名的，所以写「12/16 队」；个人赛事按人，写「8/16」。
 * 卡片右下角那行青绿字用 price 字段（event-card 的价格位），团体赛写成
 * 「团队报名」而不是 ¥ 价格。
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
      title: '俱乐部新秀杯',
      poster: COURT_PHOTO,
      venue: '广州润盈网球中心',
      time: '12月16日 10:00-18:00',
      slots: '12/16 队',
      actionText: '团队报名',
      grade: '团体',
      gradeTone: 'green',
      statusLabel: '报名中',
      slotCaption: '团体·12/16队',
      tags: [EVENT_TAGS.realname, EVENT_TAGS.weather],
      price: '团队报名',
      category: '团体',
      area: '广州',
      venueLink: true,
    },
    {
      id: 'sc-open-2',
      title: '女子俱乐部邀请赛',
      poster: COURT_PHOTO,
      venue: '佛山球球热网球禅城店',
      time: '11月08日 09:00-17:00',
      slots: '6/12 队',
      actionText: '团队报名',
      grade: '女团',
      gradeTone: 'green',
      statusLabel: '报名中',
      slotCaption: '女团·6/12队',
      tags: [EVENT_TAGS.realname, EVENT_TAGS.weather],
      price: '团队报名',
      category: '团体',
      area: '佛山',
      venueLink: true,
    },
  ],
  进行中: [
    {
      id: 'sc-live-1',
      title: '第一届 LTJIMMY 超级杯',
      poster: COURT_PHOTO,
      venue: '广州天河体育中心',
      time: '08月20日 13:00-21:00',
      slots: '16/16 队',
      actionText: '查看对阵',
      grade: '团体',
      gradeTone: 'green',
      statusLabel: '进行中',
      slotCaption: '团体·16/16队',
      tags: [EVENT_TAGS.realname, EVENT_TAGS.weather],
      price: '查看对阵',
      category: '团体',
      area: '广州',
      venueLink: true,
    },
  ],
  已结束: [
    {
      id: 'sc-done-1',
      title: '常青杯团体赛',
      poster: COURT_PHOTO,
      venue: '东莞松山湖 TC',
      time: '06月14日 10:00-18:00',
      slots: '8/8 队',
      actionText: '查看成绩',
      grade: '团体',
      gradeTone: 'green',
      statusLabel: '已结束',
      slotCaption: '团体·8/8队',
      tags: [EVENT_TAGS.realname, EVENT_TAGS.weather],
      price: '查看成绩',
      category: '团体',
      area: '东莞',
      venueLink: true,
    },
    {
      id: 'sc-night-1',
      title: '超级杯冠军之夜',
      poster: '/assets/images/banners/banner-04-super-cup-photo.jpg',
      venue: '广州天河体育中心',
      time: '08月22日 19:00-22:00',
      slots: '16/16 队',
      actionText: '查看详情',
      grade: '典礼',
      gradeTone: 'orange',
      statusLabel: '已结束',
      slotCaption: '典礼·冠军之夜',
      tags: [EVENT_TAGS.realname],
      price: '查看详情',
      category: '团体',
      area: '广州',
      district: '天河',
      venueLink: true,
    },
  ],
};

/** 列表上方那句标题，随状态 Tab 变。改文案只动这里 */
export const SUPER_CUP_FEED_TITLES: Record<string, string> = {
  我的报名: '我报名的俱乐部赛',
  报名中: '报名中的俱乐部赛',
  进行中: '进行中的俱乐部赛',
  已结束: '已结束的俱乐部赛',
};
