import { listEventsByFilter, listSuperCupBanners } from '../../api/events';
import { EVENT_FILTERS } from '../../mock/home';
import type { EventItem } from '../../mock/home';
import {
  SUPER_CUP_CLUB_CENTER,
  SUPER_CUP_EVENT_TYPES,
  SUPER_CUP_FEATURES,
  SUPER_CUP_FEED_TITLES,
  SUPER_CUP_HONORS,
  SUPER_CUP_SERIES_HINT,
  matchSuperCupSeries,
} from '../../mock/super-cup';
import type { SuperCupBanner, SuperCupFeature } from '../../mock/super-cup';
import { headerMetrics } from '../../utils/header';
import { resolveVenueId } from '../../mock/venue';
import { navigateToEventDetail, navigateToPage } from '../../utils/navigate';
import { syncTabBarSelected } from '../../utils/tabbar';
import { themeBehavior } from '../../behaviors/theme';

const DEFAULT_FILTER = '报名中';
const LOGIN_REQUIRED_FILTER = '我的报名';

/** Cover Flow 默认停在中间那张：超级杯、俱乐部榜单 */
const DEFAULT_EVENT_TYPE_INDEX = 1;
const DEFAULT_HONOR_INDEX = 1;

type CoverRole = 'current' | 'prev' | 'next' | 'side';

interface CoverItem extends SuperCupFeature {
  role: CoverRole;
}

function withCoverRoles(items: SuperCupFeature[], current: number): CoverItem[] {
  const total = items.length;
  return items.map((item, index) => {
    let role: CoverRole = 'side';
    if (index === current) {
      role = 'current';
    } else if (index === (current - 1 + total) % total) {
      role = 'prev';
    } else if (index === (current + 1) % total) {
      role = 'next';
    }
    return { ...item, role };
  });
}

function feedTitleOf(filter: string, seriesKey: string): string {
  const base = SUPER_CUP_FEED_TITLES[filter] || '俱乐部赛';
  const feature = SUPER_CUP_FEATURES.find((item) => item.key === seriesKey);
  return feature ? `${feature.label} · ${base}` : base;
}

/**
 * ============================================================================
 * 超级杯页逻辑 —— 视觉刷新草稿 V5（Figma 230:158）
 * ============================================================================
 *
 * 【这个文件负责什么】
 * 顶栏字标、头图叠字、两组 Cover Flow、俱乐部中心按钮、胶囊筛选、赛事卡。
 * 赛事列表和头图走云库俱乐部线；杯赛入口筛同一批赛事。海报 / 榜单 / 俱乐部中心仍走各自页面。
 *
 * 【Cover Flow】
 * 横滑切换当前项（中间放大、两侧缩小）。点「赛事类型」按标题关键词筛本页列表，
 * 再点一次取消；荣誉入口仍走海报 / 俱乐部榜。「查看全部」弹出该组全部入口。
 *
 * 【筛选】
 * 仍是 我的报名 / 报名中 / 进行中 / 已结束。「我的报名」的登录判断和首页一致。
 */
Page({
  behaviors: [themeBehavior],
  data: {
    statusBarHeight: 0,
    navBarHeight: 44,
    menuInsetRight: 96,
    banners: [] as SuperCupBanner[],
    currentBanner: 0,
    eventTypes: withCoverRoles(SUPER_CUP_EVENT_TYPES, DEFAULT_EVENT_TYPE_INDEX),
    eventTypeIndex: DEFAULT_EVENT_TYPE_INDEX,
    honors: withCoverRoles(SUPER_CUP_HONORS, DEFAULT_HONOR_INDEX),
    honorIndex: DEFAULT_HONOR_INDEX,
    clubCenterPath: SUPER_CUP_CLUB_CENTER.path,
    filters: EVENT_FILTERS,
    activeFilter: DEFAULT_FILTER,
    activeSeries: '',
    feedTitle: feedTitleOf(DEFAULT_FILTER, ''),
    events: [] as EventItem[],
    emptyHint: '该分类下暂无赛事',
    /** 离开本页时藏掉 fixed 顶栏，避免挡住下一页左上角「返回」 */
    pageHidden: false,
  },

  onLoad() {
    this.setData(headerMetrics());
    const boot = getApp<IAppOption>().globalData.cloudBoot;
    if (boot) {
      boot.then(() => {
        this.refreshBanners();
        this.applyFilter(DEFAULT_FILTER);
      });
    } else {
      this.refreshBanners();
      this.applyFilter(DEFAULT_FILTER);
    }
  },

  onShow() {
    this.setData({ pageHidden: false });
    syncTabBarSelected(this, 1);
    if (this.data.activeFilter === LOGIN_REQUIRED_FILTER) {
      this.applyFilter(LOGIN_REQUIRED_FILTER);
    }
  },

  onHide() {
    this.setData({ pageHidden: true });
  },

  refreshBanners() {
    listSuperCupBanners()
      .then((banners) => this.setData({ banners }))
      .catch((error) => {
        console.warn('读超级杯轮播失败', error);
        this.setData({ banners: [] });
      });
  },

  /** 「我的报名」依赖登录态，未登录时列表为空并提示登录 */
  applyFilter(filter: string) {
    const isLoggedIn = getApp<IAppOption>().globalData.isLoggedIn;
    const needLogin = filter === LOGIN_REQUIRED_FILTER && !isLoggedIn;
    const seriesKey = this.data.activeSeries;

    if (needLogin) {
      this.setData({
        activeFilter: filter,
        feedTitle: feedTitleOf(filter, seriesKey),
        events: [],
        emptyHint: '登录后查看你报名的赛事',
      });
      return;
    }

    listEventsByFilter(filter, 'super-cup')
      .then((pool) => {
        const events = seriesKey ? pool.filter((item) => matchSuperCupSeries(item, seriesKey)) : pool;
        this.setData({
          activeFilter: filter,
          feedTitle: feedTitleOf(filter, seriesKey),
          events,
          emptyHint: pool.length > 0 && events.length === 0 ? '该杯赛下暂无赛事' : '该分类下暂无赛事',
        });
      })
      .catch((error) => {
        console.warn('读超级杯赛事失败', error);
        this.setData({
          activeFilter: filter,
          feedTitle: feedTitleOf(filter, seriesKey),
          events: [],
          emptyHint: '该分类下暂无赛事',
        });
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

  onEventTypeChange(event: WechatMiniprogram.SwiperChange) {
    const index = event.detail.current;
    this.setData({
      eventTypeIndex: index,
      eventTypes: withCoverRoles(SUPER_CUP_EVENT_TYPES, index),
    });
  },

  onHonorChange(event: WechatMiniprogram.SwiperChange) {
    const index = event.detail.current;
    this.setData({
      honorIndex: index,
      honors: withCoverRoles(SUPER_CUP_HONORS, index),
    });
  },

  onCoverTap(event: WechatMiniprogram.TouchEvent) {
    const key = String(event.currentTarget.dataset.key || '');
    const path = String(event.currentTarget.dataset.path || '');
    if (SUPER_CUP_SERIES_HINT[key]) {
      const next = this.data.activeSeries === key ? '' : key;
      this.setData({ activeSeries: next }, () => this.applyFilter(this.data.activeFilter));
      return;
    }
    navigateToPage(path);
  },

  /** 「查看全部」列出该组全部入口，点哪项就走哪项的 path */
  onViewAllEventTypes() {
    this.openFeatureSheet(SUPER_CUP_EVENT_TYPES);
  },

  onViewAllHonors() {
    this.openFeatureSheet(SUPER_CUP_HONORS);
  },

  openFeatureSheet(items: SuperCupFeature[]) {
    wx.showActionSheet({
      itemList: items.map((item) => item.label),
      success: (res) => {
        const target = items[res.tapIndex];
        if (!target) {
          return;
        }
        if (SUPER_CUP_SERIES_HINT[target.key]) {
          const next = this.data.activeSeries === target.key ? '' : target.key;
          this.setData({ activeSeries: next }, () => this.applyFilter(this.data.activeFilter));
          return;
        }
        navigateToPage(target.path);
      },
    });
  },

  onClubCenterTap() {
    navigateToPage(this.data.clubCenterPath);
  },

  onFilterChange(event: WechatMiniprogram.CustomEvent<{ tab: string }>) {
    this.applyFilter(event.detail.tab);
  },

  onEventTap(event: WechatMiniprogram.CustomEvent<{ id?: string }>) {
    navigateToEventDetail(event.detail.id);
  },

  onVenueTap(event: WechatMiniprogram.CustomEvent<{ id?: string; venue?: string; venueId?: string }>) {
    navigateToPage(`/pages/venue/index?id=${resolveVenueId(event.detail)}`);
  },
});
