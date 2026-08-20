import { EVENT_FILTERS, type EventItem } from '../../mock/home';
import {
  SUPER_CUP_BANNERS,
  SUPER_CUP_EVENTS,
  SUPER_CUP_FEATURES,
  type SuperCupFeature,
} from '../../mock/super-cup';
import { navigateToPage } from '../../utils/navigate';
import { syncTabBarSelected } from '../../utils/tabbar';

const DEFAULT_FILTER = '报名中';

/** 设计中宫格是两行四列的 Auto Layout，按行切分便于对齐行内边距 */
function toRows(features: SuperCupFeature[], perRow = 4): SuperCupFeature[][] {
  const rows: SuperCupFeature[][] = [];
  for (let index = 0; index < features.length; index += perRow) {
    rows.push(features.slice(index, index + perRow));
  }
  return rows;
}

Page({
  data: {
    statusBarHeight: 0,
    banners: SUPER_CUP_BANNERS,
    featureRows: toRows(SUPER_CUP_FEATURES),
    filters: EVENT_FILTERS,
    activeFilter: DEFAULT_FILTER,
    events: [] as EventItem[],
  },

  onLoad() {
    const app = getApp<IAppOption>();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      events: SUPER_CUP_EVENTS[DEFAULT_FILTER] ?? [],
    });
  },

  onShow() {
    syncTabBarSelected(this, 1);
  },

  onBannerTap(event: WechatMiniprogram.CustomEvent<{ index: number }>) {
    const banner = SUPER_CUP_BANNERS[event.detail.index];
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
      events: SUPER_CUP_EVENTS[filter] ?? [],
    });
  },

  onEventTap() {
    wx.showToast({ title: '赛事详情页待设计', icon: 'none' });
  },

  onSignupTap() {
    wx.showToast({ title: '团队报名流程待接入云开发', icon: 'none' });
  },
});
