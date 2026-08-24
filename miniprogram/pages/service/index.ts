/**
 * ============================================================================
 * 联系客服页
 * ============================================================================
 * 终稿 Figma node 68:655。大按钮用 button + open-type="contact"，
 * 才能打开微信客服会话。公众平台还没开通客服时，点了会失败，文案先按设计放着。
 */
import { SERVICE_PAGE } from '../../mock/info-pages';

Page({
  data: {
    statusBarHeight: 0,
    page: SERVICE_PAGE,
  },

  onLoad() {
    const app = getApp<IAppOption>();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight });
  },
});
