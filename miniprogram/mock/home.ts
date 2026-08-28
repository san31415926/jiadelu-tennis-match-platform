/**
 * ============================================================================
 * 首页数据 —— 想改首页显示的文字和赛事，就改这个文件
 * ============================================================================
 *
 * 【这个文件是干什么的】
 * 首页上所有的文字内容都在这里：轮播标题、侧栏七个入口的名字、热门赛事卡、
 * 赛事卡片的名称地点时间。页面只负责渲染，不含任何文案。
 *
 * 【接云开发后怎么办】
 * 这个文件会被云函数返回的真实数据替换，但下面这些 interface（数据结构）
 * 要保留，云数据库的字段名按它们来设计，这样页面代码一行都不用改。
 *
 * 【常见改动】
 * 想改轮播图           → 换 miniprogram/assets/images/banners/ 里对应 jpg，
 *                        原图在仓库根目录 测试图/轮播图/
 * 想改轮播文案         → 改 HOME_BANNERS 的 title / subtitle，页面叠在图上
 *                        图本身不要再画字，也不要白浪（V5 145:199 直边）
 * 想加一张轮播         → 往 HOME_BANNERS 加一项，指示点会自动变多
 * 想加一个侧栏入口     → 往 HOME_FEATURES 里加一项，侧栏会自动变长
 * 想改赛事卡片内容     → 改 MOCK_EVENTS
 * 想改筛选项名字       → 改 EVENT_FILTERS，但要同步改 MOCK_EVENTS 的键名，
 *                        两者必须一致，否则切过去是空列表
 * 想改热门赛事卡     → 云开发打开后改云库 events；下面 HOME_HOT_EVENTS 只给假数据开关用
 */

/** 顶部轮播的一张 */
export interface HomeBanner {
  /** 唯一标识，wx:for 的 key 用它，随便起但不要重复 */
  id: string;
  /** 大标题，叠在轮播图上（Figma 145:205，56rpx） */
  title: string;
  /** 副标题，叠在标题下面 */
  subtitle: string;
  /** 轮播配图。铺满整块绿色头部（750×321），图片本身建议宽 1200 左右的 jpg */
  image: string;
  /** 点击后跳转的页面路径。没做的页面会弹提示不跳转，见 utils/navigate.ts */
  target: string;
}

/** 首页侧栏（汉堡菜单）的一个入口。原来在七宫格里，V5 收进左侧栏 */
export interface HomeFeature {
  /** 唯一标识。注意 'registrations' 这个值有特殊逻辑：点它是切筛选而不是跳页 */
  key: string;
  /** 图标下方的文字，21rpx 加粗 */
  label: string;
  /** 图标图片路径，用绝对路径 */
  icon: string;
  /**
   * 图标的位置和尺寸，写成 CSS 内联样式字符串。
   *
   * 侧栏现在按 96×96 显示图标，这段坐标是给旧七宫格留的，侧栏用不到。
   * 先别删，万一哪页还要还原宫格能接着用。
   */
  iconStyle: string;
  /** 点击后跳转的页面路径 */
  path: string;
}

/** 卡片上那一排彩色小标签的配色。改样式去 event-card 的 `.event-tag--*` */
export type EventTagTone = 'realname' | 'court' | 'newbie';

export interface EventTag {
  label: string;
  tone: EventTagTone;
}

/**
 * 一张赛事卡片。首页、超级杯、日历三个页面共用这个结构。
 *
 * 版式来自视觉刷新草稿「赛事列表 / 参考卡」(180:215)：左海报 + 右信息，右下是价格
 * 而不是报名按钮。点整张卡进详情；有 venueLink 的那一行再点进店铺页。
 */
export interface EventItem {
  id: string;
  /**
   * 赛事名称，不含前面的等级块（等级用 grade）。
   * 26rpx 加粗，太长会单行省略，建议控制在 10 个字内。
   */
  title: string;
  /** 左侧海报，188×210 显示，图片本身建议 2 倍尺寸以上 */
  poster: string;
  /** 地点，配一个定位图标 */
  venue: string;
  /** 时间，配一个时钟图标 */
  time: string;
  /** 签位原文，如 8/16。海报底条真正显示的是 slotCaption */
  slots: string;
  /**
   * 点价格或详情页报名时用的动作文案。
   * 列表卡上不再画按钮，但详情页和 toast 还读它。
   */
  actionText: string;
  /** 标题左侧色块，如 7.0 / 6.5 / 团体 */
  grade: string;
  /** 等级块颜色。orange=#f57a29，green=#73bf40 */
  gradeTone: 'orange' | 'green';
  /** 海报左上角状态，如 报名中 / 进行中 / 已结束 */
  statusLabel: string;
  /** 海报底部半透明条，如 混双·8/16签 */
  slotCaption: string;
  /** 标题下方的属性标签。没有就给空数组，不要省略这个字段 */
  tags: EventTag[];
  /** 右下角价格，如 ¥158。纯展示，点它和点卡片一样进详情 */
  price: string;
  /**
   * 「项目」筛到的细项：男单 / 女单 / 男双 / 女双 / 混双 / 团体。
   * 弹层左边是单打/双打，右边才是这一项；对不上就筛成空列表。
   */
  category: string;
  /**
   * 城市。搜索条左侧「广州 ▾」按它过滤。
   * 例如 广州 / 佛山 / 东莞。
   */
  area: string;
  /**
   * 区县。点「区域」弹出的名单按它过滤，比如 天河 / 禅城。
   * 不填则区域筛选选具体区时这条不会出现。
   */
  district?: string;
  /** 云库场馆 id，点场馆行进店铺时优先用它，不要再反查 mock 赛事表 */
  venueId?: string;
  /** 桃底推荐卡。为 true 时卡片背景换成 #fff5ed，并画出底部三点 */
  featured?: boolean;
  /** 海报右上角「推荐」角标 */
  recommended?: boolean;
  /** 卡片底部那一行场馆入口（logo + 名称 + ›） */
  venueLink?: boolean;
}

/** 属性标签的现成配色。新增标签优先复用，不要随手写一组新颜色 */
export const EVENT_TAGS = {
  realname: { label: '实名', tone: 'realname' as const },
  indoor: { label: '室内场', tone: 'court' as const },
  weather: { label: '风雨场', tone: 'court' as const },
  newbie: { label: '萌新最爱', tone: 'newbie' as const },
};

/**
 * 状态筛选下面那一行：项目 / 区域 / 日期 / 更多。
 * 四个弹层是同一页的状态（Figma 194:199 / 203:199 / 203:354 / 203:509），
 * 不是微信自带的 ActionSheet。
 *
 * 改了左边/右边的项目名，赛事的 category 也要能对得上，否则会筛成空列表。
 * 改了区县名单，赛事的 district 也要能对得上。
 */
export const UNLIMITED = '不限';

export const CATEGORY_LEFT = ['不限', '单打', '双打'];

/** 左边选哪一项，右边滚轮就换成这一列 */
export const CATEGORY_RIGHT: Record<string, string[]> = {
  不限: ['不限'],
  单打: ['不限', '男单', '女单'],
  双打: ['不限', '男双', '女双', '混双'],
};

/**
 * 「区域」名单跟着搜索条上的城市走。
 * 设计稿画的是广州十二区（城市停在广州时）。佛山 / 东莞另给常用区，避免点了没赛事。
 */
export const AREA_BY_CITY: Record<string, string[]> = {
  全部: [
    '不限',
    '荔湾',
    '越秀',
    '海珠',
    '天河',
    '白云',
    '黄埔',
    '番禺',
    '花都',
    '南沙',
    '从化',
    '增城',
    '禅城',
    '南海',
    '顺德',
    '松山湖',
  ],
  广州: ['不限', '荔湾', '越秀', '海珠', '天河', '白云', '黄埔', '番禺', '花都', '南沙', '从化', '增城'],
  佛山: ['不限', '禅城', '南海', '顺德', '三水', '高明'],
  东莞: ['不限', '东城', '南城', '莞城', '万江', '松山湖'],
};

export const COURT_TYPE_ROWS = [
  ['不限', '室内', '室外'],
  ['风雨', '草地'],
];

export const SLOT_ROWS = [
  ['不限', '上午(7-9点)'],
  ['中午(11-13点)', '下午(14-16点)'],
  ['傍晚(17-19点)', '晚上(20-23点)'],
];

export const GRADE_BAND_ROWS = [
  ['不限', '7.0', '6.5', '6.0'],
  ['5.5', '5.0', '4.5', '4.0'],
];

/** 等级范围步进器中间那格的数字，0 是「不限」 */
export const LEVEL_LABELS = [
  '不限',
  '2.0',
  '2.5',
  '3.0',
  '3.5',
  '4.0',
  '4.5',
  '5.0',
  '5.5',
  '6.0',
  '6.5',
  '7.0',
];

/**
 * 「仅展示我可报名的」拿这个数和赛事 grade 比。
 * 假数据没有真实球员档案，6.5 能报 6.5，报不了 7.0，用来看出勾选有没有生效。
 */
export const HOME_USER_RATING = 6.5;

export type EventListFilterKey = 'category' | 'area' | 'date' | 'more';

export interface MoreFilterState {
  court: string;
  eligible: boolean;
  personalMin: number;
  personalMax: number;
  teamMin: number;
  teamMax: number;
  slot: string;
  gradeBand: string;
}

export function defaultMoreFilters(): MoreFilterState {
  return {
    court: UNLIMITED,
    eligible: false,
    personalMin: 0,
    personalMax: 0,
    teamMin: 0,
    teamMax: 0,
    slot: UNLIMITED,
    gradeBand: UNLIMITED,
  };
}

export function moreFiltersActive(more: MoreFilterState): boolean {
  return (
    more.court !== UNLIMITED ||
    more.eligible ||
    more.personalMin > 0 ||
    more.personalMax > 0 ||
    more.teamMin > 0 ||
    more.teamMax > 0 ||
    more.slot !== UNLIMITED ||
    more.gradeBand !== UNLIMITED
  );
}

function categoryFamily(category: string): '单打' | '双打' | '' {
  if (category === '男单' || category === '女单') {
    return '单打';
  }
  if (category === '男双' || category === '女双' || category === '混双' || category === '团体') {
    return '双打';
  }
  return '';
}

/** 单打 / 双打。报名名单、组队、项目筛选都认这个，不要再靠标题里有没有「单」字。 */
export function isSinglesEvent(item: Pick<EventItem, 'category'>): boolean {
  return categoryFamily(item.category) === '单打';
}

/** 详情页「赛事类型」、报名页「参赛项目」用完整名称，不要直接写 category 缩写。 */
const EVENT_TYPE_LABEL: Record<string, string> = {
  男单: '男子单打',
  女单: '女子单打',
  男双: '男子双打',
  女双: '女子双打',
  混双: '混合双打',
  团体: '团体赛',
};

export function eventTypeLabel(category: string): string {
  return EVENT_TYPE_LABEL[category] || category;
}

export function findMockEvent(id: string): EventItem | undefined {
  const keys = Object.keys(MOCK_EVENTS);
  for (let i = 0; i < keys.length; i += 1) {
    const list = MOCK_EVENTS[keys[i]];
    for (let j = 0; j < list.length; j += 1) {
      if (list[j].id === id) {
        return list[j];
      }
    }
  }
  return undefined;
}

function courtTypeOf(item: EventItem): string {
  const labels = (item.tags || []).map((tag) => tag.label);
  if (labels.indexOf('室内场') >= 0) {
    return '室内';
  }
  if (labels.indexOf('风雨场') >= 0) {
    return '风雨';
  }
  if (labels.indexOf('室外场') >= 0) {
    return '室外';
  }
  if (labels.indexOf('草地场') >= 0) {
    return '草地';
  }
  return '';
}

function startHourOf(time: string): number {
  const matched = time.match(/(\d{1,2}):\d{2}/);
  return matched ? Number(matched[1]) : -1;
}

function slotOf(hour: number): string {
  if (hour >= 7 && hour <= 9) {
    return '上午(7-9点)';
  }
  if (hour >= 11 && hour <= 13) {
    return '中午(11-13点)';
  }
  if (hour >= 14 && hour <= 16) {
    return '下午(14-16点)';
  }
  if (hour >= 17 && hour <= 19) {
    return '傍晚(17-19点)';
  }
  if (hour >= 20 && hour <= 23) {
    return '晚上(20-23点)';
  }
  return '';
}

function parseGrade(grade: string): number {
  const value = parseFloat(grade);
  return Number.isFinite(value) ? value : NaN;
}

function levelValue(index: number): number {
  if (index <= 0) {
    return NaN;
  }
  return parseFloat(LEVEL_LABELS[index] || '');
}

export function matchCategory(item: EventItem, selected: string): boolean {
  if (!selected || selected === UNLIMITED) {
    return true;
  }
  if (selected === '单打' || selected === '双打') {
    return categoryFamily(item.category) === selected;
  }
  return item.category === selected;
}

export function matchMoreFilters(item: EventItem, more: MoreFilterState): boolean {
  if (more.court !== UNLIMITED && courtTypeOf(item) !== more.court) {
    return false;
  }
  const grade = parseGrade(item.grade);
  if (more.eligible && Number.isFinite(grade) && grade > HOME_USER_RATING) {
    return false;
  }
  if (more.gradeBand !== UNLIMITED && item.grade !== more.gradeBand) {
    return false;
  }
  const family = categoryFamily(item.category);
  const minIndex = family === '单打' ? more.personalMin : more.teamMin;
  const maxIndex = family === '单打' ? more.personalMax : more.teamMax;
  const min = levelValue(minIndex);
  const max = levelValue(maxIndex);
  if (Number.isFinite(grade)) {
    if (Number.isFinite(min) && grade < min) {
      return false;
    }
    if (Number.isFinite(max) && grade > max) {
      return false;
    }
  }
  if (more.slot !== UNLIMITED && slotOf(startHourOf(item.time)) !== more.slot) {
    return false;
  }
  return true;
}

/**
 * 从 time 文案里抽出「08月29日」这种日期，给「日期」筛选当选项。
 * time 不是标准日期格式，所以用正则抠，改了 time 写法这里可能抠不到。
 */
export function eventDateLabel(time: string): string {
  const matched = time.match(/\d+月\d+日/);
  return matched ? matched[0] : time;
}

export const HOME_BANNERS: HomeBanner[] = [
  {
    id: 'banner-club-union',
    title: '广佛俱乐部联名赛',
    subtitle: '球员精彩瞬间 · 点击查看',
    image: '/assets/images/banners/banner-01-club-union-photo.jpg',
    target: '/pages/gallery/index',
  },
  {
    id: 'banner-rookie-cup',
    title: '俱乐部新秀杯',
    subtitle: '第二届 · 12 支球队集结',
    image: '/assets/images/banners/banner-02-rookie-cup-photo.jpg',
    target: '/pages/super-cup/index',
  },
  {
    id: 'banner-annual',
    title: '年度颁奖典礼',
    subtitle: '11 月 15 日 · 广州四季酒店',
    image: '/assets/images/banners/banner-03-ceremony-photo.jpg',
    target: '/pages/poster/index?id=ceremony',
  },
  {
    id: 'banner-super-cup',
    title: '超级杯冠军之夜',
    subtitle: '俱乐部荣耀时刻',
    image: '/assets/images/banners/banner-04-super-cup-photo.jpg',
    target: '/pages/super-cup/index',
  },
  {
    id: 'banner-night-court',
    title: '夜间球场开放',
    subtitle: '灯光球场 · 预约开打',
    image: '/assets/images/banners/banner-05-night-court-photo.jpg',
    target: '/pages/clubs/index',
  },
  {
    id: 'banner-mixed-doubles',
    title: '混双精彩对决',
    subtitle: '默契搭档 · 点击查看',
    image: '/assets/images/banners/banner-06-mixed-doubles-photo.jpg',
    target: '/pages/gallery/index',
  },
];

/**
 * 首页「热门赛事」横滑卡（Figma 145:199 写的是热门赛事，不是热门活动）。
 * 点卡进赛事详情。云开发打开后由 api/events.listHotEvents 按云库现算，
 * 下面这份只给 USE_MOCK.events 还开着时用。
 */
export interface HomeHotEvent {
  id: string;
  rank: string;
  title: string;
  subtitle: string;
  image: string;
  eventId: string;
}

export const HOME_HOT_EVENTS: HomeHotEvent[] = [
  {
    id: 'hot-club-union',
    rank: '1',
    title: '广佛俱乐部联名赛',
    subtitle: '球员精彩瞬间',
    image: '/assets/images/banners/banner-01-club-union-photo.jpg',
    eventId: 'e-club-union',
  },
  {
    id: 'hot-rookie-cup',
    rank: '2',
    title: '俱乐部新秀杯',
    subtitle: '第二届 · 12 支球队',
    image: '/assets/images/banners/banner-02-rookie-cup-photo.jpg',
    eventId: 'sc-open-1',
  },
  {
    id: 'hot-annual',
    rank: '3',
    title: '年度颁奖典礼',
    subtitle: '11 月 15 日 · 广州',
    image: '/assets/images/banners/banner-03-ceremony-photo.jpg',
    eventId: 'e-ceremony',
  },
  {
    id: 'hot-super-cup',
    rank: '4',
    title: '超级杯冠军之夜',
    subtitle: '俱乐部荣耀时刻',
    image: '/assets/images/banners/banner-04-super-cup-photo.jpg',
    eventId: 'sc-night-1',
  },
];

/** 搜索条左侧城市。区域弹层的名单按这座城市切换，见 AREA_BY_CITY */
export const HOME_CITIES = ['全部', '广州', '佛山', '东莞'];

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
    path: '/pages/poster/index?id=champions',
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
    path: '/pages/poster/index?id=ceremony',
  },
  {
    key: 'registrations',
    label: '我的报名',
    icon: '/assets/icons/home/my-registrations.png',
    iconStyle: 'left:14rpx;top:-3rpx;width:110rpx;height:110rpx',
    path: '/pages/registrations/index',
  },
];

/**
 * 状态筛选的四个选项。
 *
 * 数组里的文字既是显示的标签，也是下面 MOCK_EVENTS 的键名，两处必须一字不差。
 *
 * 【注意宽度】
 * 设计稿给每个 Tab 固定了 174.5rpx 宽（Figma node 1:261），四个选项最多各放
 * 4 个汉字。如果改成 5 个字以上会挤在一起，需要同时调整
 * components/filter-tabs/index.wxss 里的 .filters__item 宽度。
 *
 * 【「我的报名」是特殊项】
 * 它依赖登录态：未登录时列表为空并提示登录，见 pages/events/index.ts 里的
 * LOGIN_REQUIRED_FILTER。
 */
export const EVENT_FILTERS = ['我的报名', '报名中', '进行中', '已结束'];

/** 示例球场照片。接云开发后这里应换成云存储的网络图片地址 */
const COURT_PHOTO = '/assets/images/court-photo.jpg';

/**
 * 四个筛选状态各自的赛事列表。
 *
 * 【键名必须和 EVENT_FILTERS 完全一致】否则切到那个筛选会显示空列表。
 * 【空数组是合法的】页面会显示「该分类下暂无赛事」的空状态。
 * 【想看多卡片效果】往某个数组里多加几条，卡片之间会自动留 16rpx 间距。
 *
 * 「报名中」前两张是测试用：e-open-1 单打、e-open-2 双打。
 * 详情页标题 / 赛事类型 / 报名名单 / 组队，以及报名页选方式，都跟
 * isSinglesEvent(category) 走。改卡片记得同步 mock/event-detail.ts 的 DETAIL_EXTRAS。
 */
export const MOCK_EVENTS: Record<string, EventItem[]> = {
  我的报名: [
    {
      id: 'e-mine-1',
      title: '混双评级赛',
      poster: COURT_PHOTO,
      venue: '佛山球球热网球禅城店',
      time: '08月29日 16:00-21:00',
      slots: '8/16',
      actionText: '查看详情',
      grade: '7.0',
      gradeTone: 'green',
      statusLabel: '报名中',
      slotCaption: '混双·8/16签',
      tags: [EVENT_TAGS.realname, EVENT_TAGS.indoor, EVENT_TAGS.newbie],
      price: '¥158',
      category: '混双',
      area: '佛山',
      district: '禅城',
    },
  ],
  报名中: [
    {
      id: 'e-open-1',
      title: '男单评级赛',
      poster: COURT_PHOTO,
      venue: '佛山球球热网球禅城店',
      time: '08月29日 16:00-21:00',
      slots: '8/16',
      actionText: '立即报名',
      grade: '7.0',
      gradeTone: 'green',
      statusLabel: '报名中',
      slotCaption: '男单·8/16签',
      tags: [EVENT_TAGS.realname, EVENT_TAGS.indoor, EVENT_TAGS.newbie],
      price: '¥158',
      category: '男单',
      area: '佛山',
      district: '禅城',
      recommended: true,
      venueLink: true,
    },
    {
      id: 'e-open-2',
      title: '男双公开赛',
      poster: COURT_PHOTO,
      venue: '广州润盈网球中心',
      time: '09月06日 09:00-18:00',
      slots: '12/16',
      actionText: '立即报名',
      grade: '6.5',
      gradeTone: 'green',
      statusLabel: '报名中',
      slotCaption: '男双·12/16签',
      tags: [EVENT_TAGS.realname, EVENT_TAGS.weather],
      price: '¥138',
      category: '男双',
      area: '广州',
      district: '天河',
      venueLink: true,
    },
    {
      id: 'e-club-union',
      title: '广佛俱乐部联名赛',
      poster: '/assets/images/banners/banner-01-club-union-photo.jpg',
      venue: '广州润盈网球中心',
      time: '09月20日 14:00-20:00',
      slots: '16/32',
      actionText: '立即报名',
      grade: '混双',
      gradeTone: 'green',
      statusLabel: '报名中',
      slotCaption: '混双·16/32签',
      tags: [EVENT_TAGS.realname, EVENT_TAGS.indoor],
      price: '¥168',
      category: '混双',
      area: '广州',
      district: '天河',
      recommended: true,
      venueLink: true,
    },
    {
      id: 'e-ceremony',
      title: '年度颁奖典礼',
      poster: '/assets/images/banners/banner-03-ceremony-photo.jpg',
      venue: '广州四季酒店',
      time: '11月15日 18:00-21:00',
      slots: '200/200',
      actionText: '查看详情',
      grade: '典礼',
      gradeTone: 'orange',
      statusLabel: '报名中',
      slotCaption: '典礼·11月15日',
      tags: [EVENT_TAGS.realname],
      price: '免费',
      category: '团体',
      area: '广州',
      district: '天河',
      venueLink: true,
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
      grade: '团体',
      gradeTone: 'green',
      statusLabel: '进行中',
      slotCaption: '团体·16/16签',
      tags: [EVENT_TAGS.realname, EVENT_TAGS.weather],
      price: '¥188',
      category: '团体',
      area: '东莞',
      district: '松山湖',
    },
  ],
  已结束: [
    {
      id: 'e-done-1',
      title: '混双评级赛',
      poster: COURT_PHOTO,
      venue: '佛山球球热网球禅城店',
      time: '08月29日 16:00-21:00',
      slots: '8/16',
      actionText: '查看成绩',
      grade: '7.0',
      gradeTone: 'green',
      statusLabel: '已结束',
      slotCaption: '混双·8/16签',
      tags: [EVENT_TAGS.realname, EVENT_TAGS.indoor],
      price: '¥158',
      category: '混双',
      area: '佛山',
      district: '禅城',
    },
  ],
};
