import { CLOUD_ENV_ID } from './config/env';

App<IAppOption>({
  globalData: {
    statusBarHeight: 0,
    navBarHeight: 0,
    safeAreaBottom: 0,
    screenWidth: 375,
    userProfile: null,
    cloudReady: false,
  },

  onLaunch() {
    this.initSystemMetrics();
    this.initCloud();
  },

  initSystemMetrics() {
    const windowInfo = wx.getWindowInfo();
    const menuButton = wx.getMenuButtonBoundingClientRect();
    const statusBarHeight = windowInfo.statusBarHeight ?? 0;

    // 胶囊按钮上下留白对称，据此推导自定义导航栏高度
    const navBarHeight =
      menuButton.bottom + (menuButton.top - statusBarHeight) - statusBarHeight;

    this.globalData.statusBarHeight = statusBarHeight;
    this.globalData.navBarHeight = navBarHeight > 0 ? navBarHeight : 44;
    this.globalData.screenWidth = windowInfo.windowWidth;
    this.globalData.safeAreaBottom = Math.max(
      0,
      windowInfo.screenHeight - windowInfo.safeArea.bottom
    );
  },

  initCloud() {
    if (!CLOUD_ENV_ID) {
      return;
    }
    if (!wx.cloud) {
      console.warn('当前基础库不支持云开发，请使用 2.2.3 以上版本');
      return;
    }
    wx.cloud.init({
      env: CLOUD_ENV_ID,
      traceUser: true,
    });
    this.globalData.cloudReady = true;
  },
});
