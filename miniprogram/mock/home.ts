/**
 * ============================================================================
 * 首页数据 —— 想改首页显示的文字和赛事，就改这个文件
 * ============================================================================
 *
 * 【这个文件是干什么的】
 * 首页上所有的文字内容都在这里：轮播标题、七个宫格入口的名字、赛事卡片的
 * 名称地点时间。页面只负责渲染，不含任何文案。
 *
 * 【接云开发后怎么办】
 * 这个文件会被云函数返回的真实数据替换，但下面这些 interface（数据结构）
 * 要保留，云数据库的字段名按它们来设计，这样页面代码一行都不用改。
 *
 * 【常见改动】
 * 想改轮播图           → 换 miniprogram/assets/images/banners/ 里对应 jpg，
 *                        原图在仓库根目录 测试图/轮播图/
 * 想改轮播文案         → 文案已经画进 jpg（主标题 36、副标题 19，对齐 Figma）
 *                        换图才改得了字；title/subtitle 只是对照用
 * 想加一张轮播         → 往 HOME_BANNERS 加一项，指示点会自动变多
 * 想加一个宫格入口     → 往 HOME_FEATURES 里加一项，注意同时要加大
 *                        tokens.wxss 里的 --grid-height，否则新增的会被裁掉
 * 想改赛事卡片内容     → 改 MOCK_EVENTS
 * 想改筛选项名字       → 改 EVENT_FILTERS，但要同步改 MOCK_EVENTS 的键名，
 *                        两者必须一致，否则切过去是空列表
 */

/** 顶部轮播的一张 */
export interface HomeBanner {
  /** 唯一标识，wx:for 的 key 用它，随便起但不要重复 */
  id: string;
  /** 大标题。已经画进轮播 jpg，页面上不再叠一层；留着方便对照换图 */
  title: string;
  /** 副标题，同样画进 jpg */
  subtitle: string;
  /** 轮播配图。铺满整块绿色头部（750×321），图片本身建议宽 1200 左右的 jpg */
  image: string;
  /** 点击后跳转的页面路径。没做的页面会弹提示不跳转，见 utils/navigate.ts */
  target: string;
}

/** 首页七宫格的一个入口 */
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
   * 【为什么每个都不一样】
   * 这七个 3D 图标外形差别很大（领奖台是横的、礼盒是方的、香槟是竖的），
   * 设计师在 Figma（node 1:239）里给每个都单独调了位置和大小，
   * 套用统一尺寸会让画面参差不齐。
   *
   * 【坐标基准】
   * left/top 相对每一格（158rpx 宽 × 154rpx 高）的左上角。
   * 有些 top 是负数（如 -6rpx），表示图标顶部故意超出格子被裁掉一点，
   * 这是设计稿的效果，不是错误。
   *
   * 【想让某个图标大一点】
   * 加大 width/height，同时把 left 减掉宽度增量的一半，保持水平居中。
   * 例如从 width:100rpx;left:29rpx 放大到 width:120rpx，left 就改成 19rpx。
   */
  iconStyle: string;
  /** 点击后跳转的页面路径 */
  path: string;
}

/** 一张赛事卡片。首页、超级杯、日历三个页面共用这个结构 */
export interface EventItem {
  id: string;
  /** 赛事名称，24rpx 加粗，太长会换行把卡片撑高，建议控制在 12 个字内 */
  title: string;
  /** 左侧那张图，286×238 显示，图片本身建议 2 倍尺寸以上 */
  poster: string;
  /** 地点，配一个圆点图标 */
  venue: string;
  /** 时间，配一个时钟图标 */
  time: string;
  /** 签位，如 8/16（个人赛按人）或 12/16 队（俱乐部赛按队），配一个人形图标 */
  slots: string;
  /** 右下角按钮上的字。报名中写「立即报名」，已结束写「查看成绩」等 */
  actionText: string;
}

export const HOME_BANNERS: HomeBanner[] = [
  {
    id: 'banner-club-union',
    title: '广佛俱乐部联名赛',
    subtitle: '球员精彩瞬间 · 点击查看',
    image: '/assets/images/banners/banner-01-club-union.jpg',
    target: '/pages/gallery/index',
  },
  {
    id: 'banner-rookie-cup',
    title: '俱乐部新秀杯',
    subtitle: '第二届 · 12 支球队集结',
    image: '/assets/images/banners/banner-02-rookie-cup.jpg',
    target: '/pages/super-cup/index',
  },
  {
    id: 'banner-annual',
    title: '年度颁奖典礼',
    subtitle: '11 月 15 日 · 广州四季酒店',
    image: '/assets/images/banners/banner-03-ceremony.jpg',
    target: '/pages/poster/index?id=ceremony',
  },
  {
    id: 'banner-super-cup',
    title: '超级杯冠军之夜',
    subtitle: '俱乐部荣耀时刻',
    image: '/assets/images/banners/banner-04-super-cup.jpg',
    target: '/pages/super-cup/index',
  },
  {
    id: 'banner-night-court',
    title: '夜间球场开放',
    subtitle: '灯光球场 · 预约开打',
    image: '/assets/images/banners/banner-05-night-court.jpg',
    target: '/pages/clubs/index',
  },
  {
    id: 'banner-mixed-doubles',
    title: '混双精彩对决',
    subtitle: '默契搭档 · 点击查看',
    image: '/assets/images/banners/banner-06-mixed-doubles.jpg',
    target: '/pages/gallery/index',
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
 */
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
