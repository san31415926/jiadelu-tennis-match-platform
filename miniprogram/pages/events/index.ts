import { listEventsByFilter, listHomeBanners, listHotEvents } from '../../api/events';
import {
  AREA_BY_CITY,
  CATEGORY_LEFT,
  CATEGORY_RIGHT,
  COURT_TYPE_ROWS,
  EVENT_FILTERS,
  GRADE_BAND_ROWS,
  HOME_CITIES,
  HOME_FEATURES,
  LEVEL_LABELS,
  SLOT_ROWS,
  UNLIMITED,
  defaultMoreFilters,
  matchCategory,
  matchMoreFilters,
  moreFiltersActive,
} from '../../mock/home';
import type { EventItem, EventListFilterKey, HomeBanner, HomeHotEvent, MoreFilterState } from '../../mock/home';
import { resolveVenueId } from '../../mock/venue';
import {
  WEEKDAY_NAMES,
  buildMonthCells,
  eventDateKey,
  formatMonthDay,
  formatMonthTitle,
} from '../../utils/calendar';
import { headerMetrics } from '../../utils/header';
import { navigateToEventDetail, navigateToPage } from '../../utils/navigate';
import { setTabBarHidden, syncTabBarSelected } from '../../utils/tabbar';
import { themeBehavior } from '../../behaviors/theme';

/**
 * ============================================================================
 * 赛事首页逻辑 —— 视觉刷新草稿 V5（Figma 145:199）
 * ============================================================================
 *
 * 【这个文件负责什么】
 * 把数据交给页面渲染、响应点击、切换两层筛选、开关左侧栏。
 * 赛事列表和热门卡走 api/events（云库）；轮播图、筛选项、侧栏入口仍是本页配置。
 *
 * 【两层筛选 + 搜索】
 * 上面四个状态 Tab（我的报名 / 报名中 / 进行中 / 已结束）决定取哪一份列表。
 * 城市、关键词、项目 / 区域 / 日期 / 更多 叠在这份列表上再筛。
 * 点 ↺ 只清项目那一行，不清状态 Tab，也不清城市和搜索词。
 *
 * 【四个筛选弹层】
 * 项目 194:346、区域 204:199、日期 204:322、更多 204:237。
 * 是同一页的状态，不要做成四个页面，也不要用微信自带的 ActionSheet。
 *
 * 【侧栏】
 * 原来的七宫格搬进汉堡菜单。点「我的报名」仍是切筛选，不跳页。
 *
 * 顶栏自己画，用 headerMetrics() 避开状态栏。换色挂 themeBehavior，不要写死青绿。
 */

/** 页面打开时默认选中哪个筛选。改成 '进行中' 就会默认显示进行中的赛事 */
const DEFAULT_FILTER = '报名中';

/**
 * 需要登录才能看的筛选项。
 * 「我的报名」显然只有登录后才有意义，所以未登录时显示空列表 + 登录提示。
 */
const LOGIN_REQUIRED_FILTER = '我的报名';

type FilterSheet = '' | 'category' | 'area' | 'date' | 'more';

interface ListFilters {
  category: string;
  area: string;
  dates: string[];
  more: MoreFilterState;
}

const LIST_FILTER_CHIPS: { key: EventListFilterKey; label: string }[] = [
  { key: 'category', label: '项目' },
  { key: 'area', label: '区域' },
  { key: 'date', label: '日期' },
  { key: 'more', label: '更多' },
];

function emptyListFilters(): ListFilters {
  return {
    category: UNLIMITED,
    area: UNLIMITED,
    dates: [],
    more: defaultMoreFilters(),
  };
}

function listFilterChips(values: ListFilters) {
  return LIST_FILTER_CHIPS.map((chip) => ({
    ...chip,
    on:
      chip.key === 'category'
        ? values.category !== UNLIMITED
        : chip.key === 'area'
          ? values.area !== UNLIMITED
          : chip.key === 'date'
            ? values.dates.length > 0
            : moreFiltersActive(values.more),
  }));
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
    item.district || '',
    item.slotCaption,
    ...(item.tags || []).map((tag) => tag.label),
  ].join(' ');
  return hay.indexOf(needle) >= 0;
}

function matchListFilters(item: EventItem, values: ListFilters, city: string, keyword: string): boolean {
  if (city !== '全部' && item.area !== city) {
    return false;
  }
  if (!matchCategory(item, values.category)) {
    return false;
  }
  if (values.area !== UNLIMITED && item.district !== values.area) {
    return false;
  }
  if (values.dates.length > 0) {
    const key = eventDateKey(item.time);
    if (!key || values.dates.indexOf(key) < 0) {
      return false;
    }
  }
  if (!matchMoreFilters(item, values.more)) {
    return false;
  }
  return matchKeyword(item, keyword);
}

function cloneMore(more: MoreFilterState): MoreFilterState {
  return { ...more };
}

function dateSummary(keys: string[]): string {
  if (keys.length === 0) {
    return UNLIMITED;
  }
  const sorted = keys.slice().sort();
  if (sorted.length === 1) {
    return formatMonthDay(sorted[0]);
  }
  return `${formatMonthDay(sorted[0])} 等${sorted.length}天`;
}

function decorateWeeks(year: number, month: number, selected: string[]) {
  const picked = new Set(selected);
  return buildMonthCells(year, month, new Set()).map((row) =>
    row.map((cell) => ({
      ...cell,
      selected: cell.inMonth && picked.has(cell.key),
    })),
  );
}

function areaOptionsOf(city: string): string[] {
  return AREA_BY_CITY[city] || AREA_BY_CITY['全部'];
}

function categoryValue(leftIndex: number, rightIndex: number): string {
  const left = CATEGORY_LEFT[leftIndex] || UNLIMITED;
  const rights = CATEGORY_RIGHT[left] || [UNLIMITED];
  const right = rights[rightIndex] || UNLIMITED;
  if (right !== UNLIMITED) {
    return right;
  }
  return left;
}

function categoryPickerFromValue(selected: string): { value: number[]; right: string[] } {
  if (selected === UNLIMITED) {
    return { value: [0, 0], right: CATEGORY_RIGHT[UNLIMITED] };
  }
  if (selected === '单打' || selected === '双打') {
    return {
      value: [CATEGORY_LEFT.indexOf(selected), 0],
      right: CATEGORY_RIGHT[selected],
    };
  }
  const left = selected === '男单' || selected === '女单' ? '单打' : '双打';
  const rights = CATEGORY_RIGHT[left];
  const rightIndex = Math.max(0, rights.indexOf(selected));
  return { value: [CATEGORY_LEFT.indexOf(left), rightIndex], right: rights };
}

Page({
  behaviors: [themeBehavior],
  data: {
    statusBarHeight: 0,
    navBarHeight: 44,
    menuInsetRight: 96,
    banners: [] as HomeBanner[],
    hotEvents: [] as HomeHotEvent[],
    features: HOME_FEATURES,
    filters: EVENT_FILTERS,
    activeFilter: DEFAULT_FILTER,
    currentBanner: 0,
    /** 离开本页时藏掉 fixed 顶栏，避免挡住下一页左上角「返回」 */
    pageHidden: false,
    drawerOpen: false,
    city: '全部',
    cityLabel: '城市',
    keyword: '',
    /** 当前状态 Tab 下的完整列表，再交给下面四个筛选项过滤 */
    statusPool: [] as EventItem[],
    events: [] as EventItem[],
    listFilterValues: emptyListFilters(),
    listFilters: listFilterChips(emptyListFilters()),
    emptyHint: '该分类下暂无赛事',
    filterSheet: '' as FilterSheet,
    draftCatValue: [0, 0],
    draftCatRight: CATEGORY_RIGHT[UNLIMITED],
    categoryLeft: CATEGORY_LEFT,
    areaOptions: AREA_BY_CITY['全部'],
    draftDates: [] as string[],
    calYear: 2026,
    calMonth: 8,
    calTitle: '2026年08月',
    calWeeks: decorateWeeks(2026, 8, []),
    weekdays: WEEKDAY_NAMES,
    dateSummary: UNLIMITED,
    draftMore: defaultMoreFilters(),
    levelLabels: LEVEL_LABELS,
    courtTypeRows: COURT_TYPE_ROWS,
    slotRows: SLOT_ROWS,
    gradeBandRows: GRADE_BAND_ROWS,
  },

  onLoad() {
    this.setData(headerMetrics());
    const boot = getApp<IAppOption>().globalData.cloudBoot;
    if (boot) {
      boot.then(() => {
        this.refreshChrome();
        this.applyFilter(DEFAULT_FILTER);
      });
    } else {
      this.refreshChrome();
      this.applyFilter(DEFAULT_FILTER);
    }
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
    this.setData({ pageHidden: false });
    syncTabBarSelected(this, 0);
    setTabBarHidden(this, false);
    if (this.data.activeFilter === LOGIN_REQUIRED_FILTER) {
      this.applyFilter(LOGIN_REQUIRED_FILTER);
    }
  },

  refreshChrome() {
    Promise.all([listHomeBanners(), listHotEvents()])
      .then(([banners, hotEvents]) => this.setData({ banners, hotEvents }))
      .catch((error) => {
        console.warn('读首页轮播和热门失败', error);
        this.setData({ banners: [], hotEvents: [] });
      });
  },

  onHide() {
    setTabBarHidden(this, false);
    this.setData({
      pageHidden: true,
      drawerOpen: false,
      filterSheet: '',
    });
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
   *
   * 列表来自 api/events.ts：开关关上后读云库，我的报名读 registrations。
   */
  applyFilter(filter: string, nextListValues?: ListFilters, keyword?: string, city?: string) {
    const nextKeyword = keyword ?? this.data.keyword;
    const nextCity = city ?? this.data.city;
    const isLoggedIn = getApp<IAppOption>().globalData.isLoggedIn;
    const needLogin = filter === LOGIN_REQUIRED_FILTER && !isLoggedIn;
    const values = nextListValues
      ? {
          ...nextListValues,
          dates: nextListValues.dates.slice(),
          more: cloneMore(nextListValues.more),
        }
      : {
          ...this.data.listFilterValues,
          dates: this.data.listFilterValues.dates.slice(),
          more: cloneMore(this.data.listFilterValues.more),
        };

    const applyPool = (pool: EventItem[]) => {
      const events = pool.filter((item) =>
        matchListFilters(item, values, nextCity, nextKeyword),
      );
      const filteredEmpty = pool.length > 0 && events.length === 0;
      this.setData({
        activeFilter: filter,
        statusPool: pool,
        events,
        keyword: nextKeyword,
        city: nextCity,
        cityLabel: nextCity === '全部' ? '城市' : nextCity,
        listFilterValues: values,
        listFilters: listFilterChips(values),
        emptyHint: needLogin
          ? '登录后查看你报名的赛事'
          : filteredEmpty
            ? '没有符合条件的赛事'
            : '该分类下暂无赛事',
      });
    };

    if (needLogin) {
      applyPool([]);
      return;
    }

    listEventsByFilter(filter, 'personal')
      .then(applyPool)
      .catch((error) => {
        console.warn('读首页赛事失败', error);
        applyPool([]);
      });
  },

  onSwiperChange(event: WechatMiniprogram.SwiperChange) {
    this.setData({ currentBanner: event.detail.current });
  },

  onBannerTap(event: WechatMiniprogram.TouchEvent) {
    const banner = this.data.banners[Number(event.currentTarget.dataset.index)];
    if (banner) {
      navigateToPage(banner.target);
    }
  },

  onHotTap(event: WechatMiniprogram.TouchEvent) {
    navigateToEventDetail(String(event.currentTarget.dataset.id));
  },

  onOpenDrawer() {
    this.setData({ drawerOpen: true, filterSheet: '' });
    setTabBarHidden(this, true);
  },

  onCloseDrawer() {
    this.setData({ drawerOpen: false });
    setTabBarHidden(this, false);
  },

  /** 蒙层上拦掉滑动，避免侧栏 / 筛选弹层打开时底下页面跟着滚 */
  onPreventMove() {},

  /**
   * 点侧栏入口。
   *
   * 【「我的报名」是特例】
   * 它在设计里既是侧栏入口，也是下面筛选条的一项。点它的正确行为是
   * 切到那个筛选，而不是跳到一个新页面（本来也没有这个页面）。
   */
  onFeatureTap(event: WechatMiniprogram.TouchEvent) {
    this.onCloseDrawer();
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
   * 搜索条左侧是城市，和「区域」弹层不是同一套。
   * 「全部」在顶上显示成「城市」，跟稿上占位一致。
   * 换了城市后，当前区县如果不属于这座城，就退回「不限」。
   */
  onCityTap() {
    wx.showActionSheet({
      itemList: HOME_CITIES,
      success: (res) => {
        const city = HOME_CITIES[res.tapIndex];
        const options = areaOptionsOf(city);
        const district = options.indexOf(this.data.listFilterValues.area) >= 0
          ? this.data.listFilterValues.area
          : UNLIMITED;
        this.applyFilter(
          this.data.activeFilter,
          {
            ...this.data.listFilterValues,
            area: district,
          },
          undefined,
          city,
        );
      },
    });
  },

  onListFilterTap(event: WechatMiniprogram.TouchEvent) {
    const key = String(event.currentTarget.dataset.key) as EventListFilterKey;
    if (key === 'category') {
      const picker = categoryPickerFromValue(this.data.listFilterValues.category);
      this.setData({
        filterSheet: 'category',
        draftCatValue: picker.value,
        draftCatRight: picker.right,
      });
      return;
    }
    if (key === 'area') {
      this.setData({
        filterSheet: 'area',
        areaOptions: areaOptionsOf(this.data.city),
      });
      return;
    }
    if (key === 'date') {
      const dates = this.data.listFilterValues.dates.slice();
      let year = this.data.calYear;
      let month = this.data.calMonth;
      if (dates[0]) {
        const parts = dates[0].split('-').map(Number);
        year = parts[0];
        month = parts[1];
      }
      this.setData({
        filterSheet: 'date',
        draftDates: dates,
        calYear: year,
        calMonth: month,
        calTitle: formatMonthTitle(year, month),
        calWeeks: decorateWeeks(year, month, dates),
        dateSummary: dateSummary(dates),
      });
      return;
    }
    this.setData({
      filterSheet: 'more',
      draftMore: cloneMore(this.data.listFilterValues.more),
    });
  },

  onCloseFilterSheet() {
    this.setData({ filterSheet: '' });
  },

  onDraftCatChange(event: WechatMiniprogram.PickerViewChange) {
    const value = event.detail.value as number[];
    const leftIndex = value[0] || 0;
    const left = CATEGORY_LEFT[leftIndex] || UNLIMITED;
    const rights = CATEGORY_RIGHT[left] || [UNLIMITED];
    let rightIndex = value[1] || 0;
    if (rightIndex >= rights.length) {
      rightIndex = 0;
    }
    this.setData({
      draftCatValue: [leftIndex, rightIndex],
      draftCatRight: rights,
    });
  },

  onConfirmCategory() {
    const category = categoryValue(this.data.draftCatValue[0], this.data.draftCatValue[1]);
    this.setData({ filterSheet: '' });
    this.applyFilter(this.data.activeFilter, {
      ...this.data.listFilterValues,
      category,
    });
  },

  onSelectArea(event: WechatMiniprogram.TouchEvent) {
    const area = String(event.currentTarget.dataset.name);
    this.setData({ filterSheet: '' });
    this.applyFilter(this.data.activeFilter, {
      ...this.data.listFilterValues,
      area,
    });
  },

  onDraftDateTap(event: WechatMiniprogram.TouchEvent) {
    const key = String(event.currentTarget.dataset.key);
    if (!key) {
      return;
    }
    const current = this.data.draftDates.slice();
    const index = current.indexOf(key);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(key);
    }
    this.setData({
      draftDates: current,
      calWeeks: decorateWeeks(this.data.calYear, this.data.calMonth, current),
      dateSummary: dateSummary(current),
    });
  },

  onShiftMonth(event: WechatMiniprogram.TouchEvent) {
    const delta = Number(event.currentTarget.dataset.delta);
    let year = this.data.calYear;
    let month = this.data.calMonth + delta;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    if (month > 12) {
      month = 1;
      year += 1;
    }
    this.setData({
      calYear: year,
      calMonth: month,
      calTitle: formatMonthTitle(year, month),
      calWeeks: decorateWeeks(year, month, this.data.draftDates),
    });
  },

  onResetDates() {
    this.setData({
      draftDates: [],
      calWeeks: decorateWeeks(this.data.calYear, this.data.calMonth, []),
      dateSummary: UNLIMITED,
    });
  },

  onConfirmDates() {
    this.setData({ filterSheet: '' });
    this.applyFilter(this.data.activeFilter, {
      ...this.data.listFilterValues,
      dates: this.data.draftDates.slice(),
    });
  },

  onSelectMoreChip(event: WechatMiniprogram.TouchEvent) {
    const field = String(event.currentTarget.dataset.field) as 'court' | 'slot' | 'gradeBand';
    const name = String(event.currentTarget.dataset.name);
    this.setData({
      draftMore: {
        ...this.data.draftMore,
        [field]: name,
      },
    });
  },

  onToggleEligible() {
    this.setData({
      draftMore: {
        ...this.data.draftMore,
        eligible: !this.data.draftMore.eligible,
      },
    });
  },

  onStepLevel(event: WechatMiniprogram.TouchEvent) {
    const field = String(event.currentTarget.dataset.field) as
      | 'personalMin'
      | 'personalMax'
      | 'teamMin'
      | 'teamMax';
    const delta = Number(event.currentTarget.dataset.delta);
    const next = Math.min(
      LEVEL_LABELS.length - 1,
      Math.max(0, this.data.draftMore[field] + delta),
    );
    this.setData({
      draftMore: {
        ...this.data.draftMore,
        [field]: next,
      },
    });
  },

  onResetMore() {
    this.setData({ draftMore: defaultMoreFilters() });
  },

  onConfirmMore() {
    this.setData({ filterSheet: '' });
    this.applyFilter(this.data.activeFilter, {
      ...this.data.listFilterValues,
      more: cloneMore(this.data.draftMore),
    });
  },

  /** 清项目 / 区域 / 日期 / 更多；状态 Tab、城市、搜索词不动 */
  onResetListFilters() {
    this.applyFilter(this.data.activeFilter, emptyListFilters());
  },

  /** 点卡片主体，进赛事详情 */
  onEventTap(event: WechatMiniprogram.CustomEvent<{ id?: string }>) {
    navigateToEventDetail(event.detail.id);
  },

  /** 点卡片底部场馆行，进对应店铺页 */
  onVenueTap(event: WechatMiniprogram.CustomEvent<{ id?: string; venue?: string; venueId?: string }>) {
    navigateToPage(`/pages/venue/index?id=${resolveVenueId(event.detail)}`);
  },
});
