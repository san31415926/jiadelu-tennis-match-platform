import {
  EVENT_FILTERS,
  EVENT_LIST_FILTERS,
  HOME_BANNERS,
  HOME_CITIES,
  HOME_FEATURES,
  HOME_HOT_EVENTS,
  MOCK_EVENTS,
  eventDateLabel,
} from '../../mock/home';
import type { EventItem, EventListFilterKey } from '../../mock/home';
import { venueIdByEventId } from '../../mock/venue';
import { headerMetrics } from '../../utils/header';
import { navigateToEventDetail, navigateToPage } from '../../utils/navigate';
import { syncTabBarSelected } from '../../utils/tabbar';

/**
 * ============================================================================
 * 赛事首页逻辑 —— 视觉刷新草稿 V5（Figma 145:199）
 * ============================================================================
 *
 * 【这个文件负责什么】
 * 把数据交给页面渲染、响应点击、切换两层筛选、开关左侧栏。
 * 所有文案和数据都在 mock/home.ts，样式在 index.wxss。
 *
 * 【两层筛选 + 搜索】
 * 上面四个状态 Tab（我的报名 / 报名中 / 进行中 / 已结束）决定取哪一份列表。
 * 城市、关键词、项目 / 区域 / 日期 / 更多 叠在这份列表上再筛。
 * 点 ↺ 只清项目那一行，不清状态 Tab，也不清城市和搜索词。
 *
 * 【侧栏】
 * 原来的七宫格搬进汉堡菜单。点「我的报名」仍是切筛选，不跳页。
 */

/** 页面打开时默认选中哪个筛选。改成 '进行中' 就会默认显示进行中的赛事 */
const DEFAULT_FILTER = '报名中';

/**
 * 需要登录才能看的筛选项。
 * 「我的报名」显然只有登录后才有意义，所以未登录时显示空列表 + 登录提示。
 */
const LOGIN_REQUIRED_FILTER = '我的报名';

const DEFAULT_LIST_FILTERS: Record<EventListFilterKey, string> = {
  category: '全部',
  area: '全部',
  date: '全部',
  more: '全部',
};

const LIST_FILTER_CHIPS: { key: EventListFilterKey; label: string }[] = [
  { key: 'category', label: '项目' },
  { key: 'area', label: '区域' },
  { key: 'date', label: '日期' },
  { key: 'more', label: '更多' },
];

function listFilterChips(values: Record<EventListFilterKey, string>) {
  return LIST_FILTER_CHIPS.map((chip) => ({
    ...chip,
    on: values[chip.key] !== '全部',
  }));
}

function dateOptions(pool: EventItem[]): string[] {
  const labels = Array.from(new Set(pool.map((item) => eventDateLabel(item.time))));
  return ['全部', ...labels];
}

function optionsFor(key: EventListFilterKey, pool: EventItem[]): string[] {
  if (key === 'date') {
    return dateOptions(pool);
  }
  const found = EVENT_LIST_FILTERS.find((item) => item.key === key);
  return found ? [...found.options] : ['全部'];
}

function matchKeyword(item: EventItem, keyword: string): boolean {
  const needle = keyword.trim();
  if (!needle) {
    return true;
  }
  const hay = [
    item.title,
    item.venue,
    item.category,
    item.area,
    item.slotCaption,
    ...(item.tags || []).map((tag) => tag.label),
  ].join(' ');
  return hay.indexOf(needle) >= 0;
}

function matchListFilters(
  item: EventItem,
  values: Record<EventListFilterKey, string>,
  keyword: string,
): boolean {
  if (values.category !== '全部' && item.category !== values.category) {
    return false;
  }
  if (values.area !== '全部' && item.area !== values.area) {
    return false;
  }
  if (values.date !== '全部' && eventDateLabel(item.time) !== values.date) {
    return false;
  }
  if (values.more !== '全部') {
    if (values.more === '推荐') {
      if (!item.recommended) {
        return false;
      }
    } else if (!(item.tags || []).some((tag) => tag.label === values.more)) {
      return false;
    }
  }
  return matchKeyword(item, keyword);
}

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 44,
    menuInsetRight: 96,
    banners: HOME_BANNERS,
    hotEvents: HOME_HOT_EVENTS,
    features: HOME_FEATURES,
    filters: EVENT_FILTERS,
    activeFilter: DEFAULT_FILTER,
    currentBanner: 0,
    drawerOpen: false,
    city: '全部',
    cityLabel: '城市',
    keyword: '',
    /** 当前状态 Tab 下的完整列表，再交给下面四个筛选项过滤 */
    statusPool: [] as EventItem[],
    events: [] as EventItem[],
    listFilterValues: { ...DEFAULT_LIST_FILTERS },
    listFilters: listFilterChips(DEFAULT_LIST_FILTERS),
    /** 列表为空时显示的文案，会随场景变化 */
    emptyHint: '该分类下暂无赛事',
  },

  onLoad() {
    this.setData(headerMetrics());
    this.applyFilter(DEFAULT_FILTER);
  },

  /**
   * onShow 每次页面显示都会执行（包括从其他 Tab 切回来），
   * 而 onLoad 只在第一次创建时执行。
   *
   * 这里做两件事：
   * 1. 告诉自定义底栏"当前是第 0 个 Tab"，否则切换后高亮不会动
   * 2. 如果当前停在「我的报名」，重新取一次数——因为用户可能刚去
   *    「我的」页登录完回来，登录态变了但页面数据还是旧的
   */
  onShow() {
    syncTabBarSelected(this, 0);
    if (this.data.activeFilter === LOGIN_REQUIRED_FILTER) {
      this.applyFilter(LOGIN_REQUIRED_FILTER);
    }
  },

  onHide() {
    if (this.data.drawerOpen) {
      this.setData({ drawerOpen: false });
    }
  },

  /**
   * 切换状态筛选并取对应的数据。
   *
   * 【为什么单独抽成一个方法】
   * 有三个地方要触发切换：页面初始化、点筛选条、点侧栏里的「我的报名」。
   * 抽出来避免逻辑重复。
   *
   * 【登录判断】
   * 登录态存在 app.globalData.isLoggedIn（由「我的」页登录后写入），
   * 这样跨页面共享。未登录看「我的报名」时给空列表 + 引导文案，
   * 而不是直接弹登录框——弹框太打扰，先让用户看到"这里有什么"。
   */
  applyFilter(
    filter: string,
    nextListValues?: Record<EventListFilterKey, string>,
    keyword?: string,
  ) {
    const nextKeyword = keyword ?? this.data.keyword;
    const isLoggedIn = getApp<IAppOption>().globalData.isLoggedIn;
    const needLogin = filter === LOGIN_REQUIRED_FILTER && !isLoggedIn;
    const pool = needLogin ? [] : MOCK_EVENTS[filter] ?? [];
    const values = { ...(nextListValues || this.data.listFilterValues) };
    const dates = dateOptions(pool);
    if (values.date !== '全部' && dates.indexOf(values.date) < 0) {
      values.date = '全部';
    }
    const events = pool.filter((item) => matchListFilters(item, values, nextKeyword));
    const filteredEmpty = pool.length > 0 && events.length === 0;

    this.setData({
      activeFilter: filter,
      statusPool: pool,
      events,
      keyword: nextKeyword,
      listFilterValues: values,
      listFilters: listFilterChips(values),
      emptyHint: needLogin
        ? '登录后查看你报名的赛事'
        : filteredEmpty
          ? '没有符合条件的赛事'
          : '该分类下暂无赛事',
    });
  },

  onSwiperChange(event: WechatMiniprogram.SwiperChange) {
    this.setData({ currentBanner: event.detail.current });
  },

  onBannerTap(event: WechatMiniprogram.TouchEvent) {
    const banner = HOME_BANNERS[Number(event.currentTarget.dataset.index)];
    if (banner) {
      navigateToPage(banner.target);
    }
  },

  onHotTap(event: WechatMiniprogram.TouchEvent) {
    navigateToPage(String(event.currentTarget.dataset.target));
  },

  onOpenDrawer() {
    this.setData({ drawerOpen: true });
  },

  onCloseDrawer() {
    this.setData({ drawerOpen: false });
  },

  /** 蒙层上拦掉滑动，避免侧栏打开时底下页面跟着滚 */
  onPreventMove() {},

  onDarkModeTap() {
    wx.showToast({ title: '深色模式待接入', icon: 'none' });
  },

  /**
   * 点侧栏入口。
   *
   * 【「我的报名」是特例】
   * 它在设计里既是侧栏入口，也是下面筛选条的一项。点它的正确行为是
   * 切到那个筛选，而不是跳到一个新页面（本来也没有这个页面）。
   */
  onFeatureTap(event: WechatMiniprogram.TouchEvent) {
    this.setData({ drawerOpen: false });
    if (String(event.currentTarget.dataset.key) === 'registrations') {
      this.applyFilter(LOGIN_REQUIRED_FILTER);
      return;
    }
    navigateToPage(String(event.currentTarget.dataset.path));
  },

  onFilterChange(event: WechatMiniprogram.CustomEvent<{ tab: string }>) {
    this.applyFilter(event.detail.tab);
  },

  onKeywordInput(event: WechatMiniprogram.Input) {
    this.applyFilter(this.data.activeFilter, undefined, event.detail.value);
  },

  /**
   * 城市和「区域」是同一套选项。选了广州，区域那一列也会亮起来。
   * 「全部」在顶上显示成「城市」，跟稿上占位一致。
   */
  onCityTap() {
    wx.showActionSheet({
      itemList: HOME_CITIES,
      success: (res) => {
        const city = HOME_CITIES[res.tapIndex];
        const values = {
          ...this.data.listFilterValues,
          area: city,
        };
        this.setData({
          city,
          cityLabel: city === '全部' ? '城市' : city,
        });
        this.applyFilter(this.data.activeFilter, values);
      },
    });
  },

  /**
   * 弹出当前筛选项的列表。日期是按当前状态下有哪些比赛现场算的，
   * 所以切到「进行中」再点日期，选项会跟报名中不一样。
   */
  onListFilterTap(event: WechatMiniprogram.TouchEvent) {
    const key = String(event.currentTarget.dataset.key) as EventListFilterKey;
    const options = optionsFor(key, this.data.statusPool);
    wx.showActionSheet({
      itemList: options,
      success: (res) => {
        const next = options[res.tapIndex];
        const values = {
          ...this.data.listFilterValues,
          [key]: next,
        };
        const patch: Record<string, string> = {};
        if (key === 'area') {
          patch.city = next;
          patch.cityLabel = next === '全部' ? '城市' : next;
        }
        this.setData(patch);
        this.applyFilter(this.data.activeFilter, values);
      },
    });
  },

  /** 清项目 / 区域 / 日期 / 更多，城市跟着回到「全部」；状态 Tab 和搜索词不动 */
  onResetListFilters() {
    this.setData({
      city: '全部',
      cityLabel: '城市',
    });
    this.applyFilter(this.data.activeFilter, { ...DEFAULT_LIST_FILTERS });
  },

  /** 点卡片主体，进赛事详情 */
  onEventTap(event: WechatMiniprogram.CustomEvent<{ id?: string }>) {
    navigateToEventDetail(event.detail.id);
  },

  /** 点卡片底部场馆行，进对应店铺页（默认禅城店） */
  onVenueTap(event: WechatMiniprogram.CustomEvent<{ id?: string }>) {
    navigateToPage(`/pages/venue/index?id=${venueIdByEventId(event.detail.id)}`);
  },
});
