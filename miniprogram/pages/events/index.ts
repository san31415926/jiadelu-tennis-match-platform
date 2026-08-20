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
const LOGIN_REQUIRED_FILTER = '我的报名';

Page({
  data: {
    statusBarHeight: 0,
    banners: HOME_BANNERS,
    features: HOME_FEATURES,
    filters: EVENT_FILTERS,
    activeFilter: DEFAULT_FILTER,
    events: [] as EventItem[],
    emptyHint: '该分类下暂无赛事',
  },

  onLoad() {
    const app = getApp<IAppOption>();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight });
    this.applyFilter(DEFAULT_FILTER);
  },

  onShow() {
    syncTabBarSelected(this, 0);
    // 从「我的」页登录回来后，我的报名需要重新取数
    if (this.data.activeFilter === LOGIN_REQUIRED_FILTER) {
      this.applyFilter(LOGIN_REQUIRED_FILTER);
    }
  },

  /** 「我的报名」依赖登录态，未登录时列表为空并提示登录 */
  applyFilter(filter: string) {
    const isLoggedIn = getApp<IAppOption>().globalData.isLoggedIn;
    const needLogin = filter === LOGIN_REQUIRED_FILTER && !isLoggedIn;

    this.setData({
      activeFilter: filter,
      events: needLogin ? [] : MOCK_EVENTS[filter] ?? [],
      emptyHint: needLogin ? '登录后查看你报名的赛事' : '该分类下暂无赛事',
    });
  },

  onBannerTap(event: WechatMiniprogram.CustomEvent<{ index: number }>) {
    const banner = HOME_BANNERS[event.detail.index];
    if (banner) {
      navigateToPage(banner.target);
    }
  },

  /** 「我的报名」在设计中既是宫格入口也是筛选项，点入口等于切到该筛选 */
  onFeatureTap(event: WechatMiniprogram.TouchEvent) {
    if (String(event.currentTarget.dataset.key) === 'registrations') {
      this.applyFilter(LOGIN_REQUIRED_FILTER);
      return;
    }
    navigateToPage(String(event.currentTarget.dataset.path));
  },

  onFilterChange(event: WechatMiniprogram.CustomEvent<{ tab: string }>) {
    this.applyFilter(event.detail.tab);
  },

  onEventTap() {
    wx.showToast({ title: '赛事详情页待设计', icon: 'none' });
  },

  onSignupTap() {
    wx.showToast({ title: '报名流程待接入云开发', icon: 'none' });
  },
});
