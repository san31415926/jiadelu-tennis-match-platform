import {
  EVENT_FILTERS,
  HOME_BANNERS,
  HOME_FEATURES,
  MOCK_EVENTS,
  type EventItem,
} from '../../mock/home';
import { navigateToPage } from '../../utils/navigate';
import { syncTabBarSelected } from '../../utils/tabbar';

const DEFAULT_FILTER = '报名中';

Page({
  data: {
    statusBarHeight: 0,
    banners: HOME_BANNERS,
    features: HOME_FEATURES,
    filters: EVENT_FILTERS,
    activeFilter: DEFAULT_FILTER,
    events: [] as EventItem[],
  },

  onLoad() {
    const app = getApp<IAppOption>();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      events: MOCK_EVENTS[DEFAULT_FILTER] ?? [],
    });
  },

  onShow() {
    syncTabBarSelected(this, 0);
  },

  onBannerTap(event: WechatMiniprogram.CustomEvent<{ index: number }>) {
    const banner = HOME_BANNERS[event.detail.index];
    if (banner) {
      navigateToPage(banner.target);
    }
  },

  onFeatureTap(event: WechatMiniprogram.TouchEvent) {
    navigateToPage(String(event.currentTarget.dataset.path));
  },

  onFilterChange(event: WechatMiniprogram.CustomEvent<{ tab: string }>) {
    const filter = event.detail.tab;
    this.setData({
      activeFilter: filter,
      events: MOCK_EVENTS[filter] ?? [],
    });
  },

  onEventTap() {
    wx.showToast({ title: '赛事详情页待设计', icon: 'none' });
  },

  onSignupTap() {
    wx.showToast({ title: '报名流程待接入云开发', icon: 'none' });
  },
});
