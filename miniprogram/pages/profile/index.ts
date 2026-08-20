import { GUEST_PROFILE, MOCK_PROFILE, PROFILE_MENU } from '../../mock/profile';
import { navigateToPage } from '../../utils/navigate';
import { syncTabBarSelected } from '../../utils/tabbar';

/** XP 轨道在设计中宽 690rpx，小球直径 28rpx */
const XP_TRACK_WIDTH = 690;
const XP_TRACK_LEFT = 32;
const XP_BALL_SIZE = 28;

Page({
  data: {
    statusBarHeight: 0,
    isLoggedIn: false,
    profile: GUEST_PROFILE,
    menu: PROFILE_MENU,
    xpFillWidth: 0,
    xpBallLeft: 0,
  },

  onLoad() {
    const app = getApp<IAppOption>();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight });
    this.applyProfile(app.globalData.isLoggedIn);
  },

  onShow() {
    syncTabBarSelected(this, 2);
  },

  /** 未登录时数值为占位符，XP 进度为 0；登录态存在 globalData 供其他页共享 */
  applyProfile(isLoggedIn: boolean) {
    const profile = isLoggedIn ? MOCK_PROFILE : GUEST_PROFILE;
    const fillWidth = Math.round((XP_TRACK_WIDTH * profile.xpPercent) / 100);

    getApp<IAppOption>().globalData.isLoggedIn = isLoggedIn;
    this.setData({
      isLoggedIn,
      profile,
      xpFillWidth: fillWidth,
      // 小球骑在填充末端上；进度为 0 时藏在轨道左端
      xpBallLeft: XP_TRACK_LEFT + fillWidth - XP_BALL_SIZE / 2,
    });
  },

  /**
   * wx.login 拿到的 code 需要后端换取 openid，云开发接入后在这里调用云函数。
   * 当前先用示例资料填充，让已登录态可以预览。
   */
  onLogin() {
    if (this.data.isLoggedIn) {
      navigateToPage('/pages/profile-edit/index');
      return;
    }
    wx.login({
      success: () => {
        this.applyProfile(true);
        wx.showToast({ title: '已载入示例资料，登录待接入云开发', icon: 'none' });
      },
      fail: () => {
        wx.showToast({ title: '微信登录失败，请重试', icon: 'none' });
      },
    });
  },

  onMenuTap(event: WechatMiniprogram.TouchEvent) {
    if (!this.data.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    navigateToPage(String(event.currentTarget.dataset.path));
  },
});
