/**
 * ============================================================================
 * 关于我们页
 * ============================================================================
 * 终稿 Figma node 68:618。金色头 + 公众号二维码占位，文案在 mock/info-pages.ts。
 */
import { ABOUT_PAGE } from '../../mock/info-pages';

Page({
  data: {
    statusBarHeight: 0,
    page: ABOUT_PAGE,
  },

  onLoad() {
    const app = getApp<IAppOption>();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight });
  },
});
