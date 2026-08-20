import { CLOUD_ENV_ID } from './config/env';

/**
 * ============================================================================
 * 小程序入口 —— 全局状态与启动逻辑
 * ============================================================================
 *
 * 【这个文件是干什么的】
 * 小程序启动时最先执行的地方。做两件事：
 * 1. 量一遍手机的状态栏高度、安全区高度，存到 globalData 供所有页面使用
 * 2. 如果配了云开发环境 ID，就初始化云能力
 *
 * 【globalData 是什么】
 * 全局共享的数据仓库。任何页面都可以用 getApp().globalData.xxx 读写。
 * 用它存的都是"所有页面都需要、且不该各算一遍"的东西。
 *
 * 【为什么要量状态栏高度】
 * 我们在 app.json 里把导航栏设成了 navigationStyle: "custom"，也就是不用微信
 * 自带的顶部标题栏，改成自己画渐变头部。好处是能做出设计稿那种通栏渐变，
 * 代价是要自己避开手机顶部的状态栏（信号、时间、电量那一条），否则标题会
 * 被状态栏压住。所以每个页面的头部都会加上 padding-top: {{statusBarHeight}}px。
 */
App<IAppOption>({
  globalData: {
    /** 手机状态栏高度（单位 px，不是 rpx），页面头部用它做上内边距 */
    statusBarHeight: 0,
    /** 自定义导航栏的推荐高度，做返回按钮垂直居中时可用 */
    navBarHeight: 0,
    /** 底部安全区高度（全面屏手机底部那条横杠区域） */
    safeAreaBottom: 0,
    /** 屏幕逻辑宽度，需要按屏幕尺寸做判断时用 */
    screenWidth: 375,
    /**
     * 微信登录态。首页与超级杯的「我的报名」筛选、我的页的资料展示都依赖它。
     * 现在由「我的」页点击登录后置为 true；接入云开发后应改为
     * 调云函数校验 openid 的结果。
     */
    isLoggedIn: false,
    /** 登录后的用户资料，目前未使用，接云开发后存真实资料 */
    userProfile: null,
    /** 云开发是否已就绪，页面调云函数前可以先检查这个 */
    cloudReady: false,
  },

  onLaunch() {
    this.initSystemMetrics();
    this.initCloud();
  },

  /**
   * 量取手机尺寸信息。
   *
   * 想调整头部与状态栏的间距，不要改这里，去各页面 wxml 里
   * style="padding-top:{{statusBarHeight}}px" 那一处加减数值。
   */
  initSystemMetrics() {
    const windowInfo = wx.getWindowInfo();
    const menuButton = wx.getMenuButtonBoundingClientRect();
    const statusBarHeight = windowInfo.statusBarHeight ?? 0;

    // 右上角胶囊按钮（···和⊙那个）的上下留白是对称的，
    // 用它反推出一个和微信自带导航栏等高的数值，做返回按钮时对齐更自然
    const navBarHeight =
      menuButton.bottom + (menuButton.top - statusBarHeight) - statusBarHeight;

    this.globalData.statusBarHeight = statusBarHeight;
    this.globalData.navBarHeight = navBarHeight > 0 ? navBarHeight : 44;
    this.globalData.screenWidth = windowInfo.windowWidth;
    // 屏幕总高减去安全区底边，得到底部横杠占的高度；老款手机是 0
    this.globalData.safeAreaBottom = Math.max(
      0,
      windowInfo.screenHeight - windowInfo.safeArea.bottom
    );
  },

  /**
   * 初始化云开发。环境 ID 在 config/env.ts 里填。
   * 没填就直接跳过，全站继续用假数据，不会报错。
   */
  initCloud() {
    if (!CLOUD_ENV_ID) {
      return;
    }
    if (!wx.cloud) {
      console.warn('当前基础库不支持云开发，请在开发者工具里把基础库调到 2.2.3 以上');
      return;
    }
    wx.cloud.init({
      env: CLOUD_ENV_ID,
      // traceUser 打开后，云开发控制台能看到用户访问记录，便于排查问题
      traceUser: true,
    });
    this.globalData.cloudReady = true;
  },
});
