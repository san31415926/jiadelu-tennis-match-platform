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
const LOGIN_REQUIRED_FILTER = '我的报名';

/**
 * 把八个入口切成每行四个。
 *
 * 【为什么要切行而不是直接 flex-wrap】
 * 设计里每一行有独立的左右内边距（左 38rpx、右 32rpx，不对称），
 * 用 flex-wrap 只能给整个容器设一次内边距，做不出这个效果。
 * 切成两行后每行单独设内边距，才能精确复现。
 *
 * @param perRow 每行几个。改成 3 会变成三行（3+3+2），
 *               但要同时调大格子宽度，否则一行留白很多。
 */
function toRows(features: SuperCupFeature[], perRow = 4): SuperCupFeature[][] {
  const rows: SuperCupFeature[][] = [];
  for (let index = 0; index < features.length; index += perRow) {
    rows.push(features.slice(index, index + perRow));
  }
  return rows;
}

/**
 * ============================================================================
 * 超级杯页逻辑
 * ============================================================================
 *
 * 结构和首页几乎一样（都是轮播 + 宫格 + 筛选 + 卡片列表），区别只有：
 *   1. 宫格是规整的两行四列，所以要先用 toRows 切行
 *   2. 筛选选中色是 #76d709（设计稿里和首页的 #83d414 不同）
 *   3. 数据来自 mock/super-cup.ts
 *
 * 「我的报名」的登录判断逻辑与首页一致，两边都改的时候别漏一个。
 */
Page({
  data: {
    statusBarHeight: 0,
    banners: SUPER_CUP_BANNERS,
    featureRows: toRows(SUPER_CUP_FEATURES),
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
    syncTabBarSelected(this, 1);
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
      events: needLogin ? [] : SUPER_CUP_EVENTS[filter] ?? [],
      emptyHint: needLogin ? '登录后查看你报名的赛事' : '该分类下暂无赛事',
    });
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
    this.applyFilter(event.detail.tab);
  },

  onEventTap() {
    wx.showToast({ title: '赛事详情页待设计', icon: 'none' });
  },

  onSignupTap() {
    wx.showToast({ title: '团队报名流程待接入云开发', icon: 'none' });
  },
});
