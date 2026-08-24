/**
 * ============================================================================
 * 商务合作页
 * ============================================================================
 * 终稿 Figma node 68:580。二维码还没定，先留虚线框；拿到图后改 mock/info-pages.ts。
 */
import { BUSINESS_PAGE } from '../../mock/info-pages';

Page({
  data: {
    statusBarHeight: 0,
    page: BUSINESS_PAGE,
  },

  onLoad() {
    const app = getApp<IAppOption>();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight });
  },
});
