import { CLOUD_ENV_ID } from './config/env';
import { restoreSession, writeSession } from './api/auth';
import { ensureEventsSeeded } from './api/events';
import { measureHeaderMetrics } from './utils/header';
import { getAppTheme, paintWindow } from './utils/theme';

/**
 * ============================================================================
 * 小程序入口 —— 全局状态与启动逻辑
 * ============================================================================
 *
 * 【这个文件是干什么的】
 * 小程序启动时最先执行的地方。做四件事：
 * 1. 量一遍手机的状态栏高度、安全区高度，存到 globalData 供所有页面使用
 * 2. 如果配了云开发环境 ID，就初始化云能力
 * 3. 读出全站主题（默认薄荷），把窗口露底色刷成对应色
 * 4. 恢复上次的登录、按 mock 覆盖写赛事示例数据（见 api/auth.ts、api/events.ts）
 *
 * 【globalData 是什么】
 * 全局共享的数据仓库。任何页面都可以用 getApp().globalData.xxx 读写。
 * 用它存的都是"所有页面都需要、且不该各算一遍"的东西。
 *
 * 【为什么要量状态栏高度】
 * 我们在 app.json 里把导航栏设成了 navigationStyle: "custom"。
 * 首页 / 超级杯 / 我的 自己画顶栏，要用 padding-top 避开状态栏。
 * 二级页打开 page-nav 的 occupy，组件内部会量，页面不用再抄一份。
 *
 * 【换颜色】
 * 不要在页面里写死青绿。挂 themeBehavior，色值只改 utils/theme.ts 的 THEME_CHROME。
 */
App<IAppOption>({
  globalData: {
    /** 手机状态栏高度（单位 px，不是 rpx），页面头部用它做上内边距 */
    statusBarHeight: 0,
    /** 自定义导航栏的推荐高度，做返回按钮垂直居中时可用 */
    navBarHeight: 0,
    /** 标题左右留白，避开右上角胶囊按钮，单位 px */
    menuInsetRight: 0,
    /** 底部安全区高度（全面屏手机底部那条横杠区域） */
    safeAreaBottom: 0,
    /** 屏幕逻辑宽度，需要按屏幕尺寸做判断时用 */
    screenWidth: 375,
    /**
     * 微信登录态。首页与超级杯的「我的报名」筛选、我的页的资料展示都依赖它。
     * 点「我的」登录后为 true；下次启动会调 login(create:false) 自动恢复。
     * 点了「退出登录」会写本地标记，启动就不再自动接上，直到再登录。
     */
    isLoggedIn: false,
    /** 登录后的用户资料，来自云函数 login */
    userProfile: null,
    /** 云开发是否已就绪，页面调云函数前可以先检查这个 */
    cloudReady: false,
    cloudBoot: Promise.resolve(),
    /** 全站壳色，默认薄荷。我的页「更换背景」会改它 */
    theme: 'mint',
  },

  onLaunch() {
    this.initSystemMetrics();
    this.globalData.theme = getAppTheme();
    paintWindow(this.globalData.theme);
    this.initCloud();
  },

  /**
   * 量取手机尺寸信息。
   *
   * 想调整头部与状态栏的间距，不要改这里，去各页面 wxml 里
   * style="padding-top:{{statusBarHeight}}px" 那一处加减数值。
   */
  initSystemMetrics() {
    const metrics = measureHeaderMetrics();
    const windowInfo = wx.getWindowInfo();

    this.globalData.statusBarHeight = metrics.statusBarHeight;
    this.globalData.navBarHeight = metrics.navBarHeight;
    this.globalData.menuInsetRight = metrics.menuInsetRight;
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
      this.globalData.cloudBoot = Promise.resolve();
      return;
    }
    if (!wx.cloud) {
      console.warn('当前基础库不支持云开发，请在开发者工具里把基础库调到 2.2.3 以上');
      this.globalData.cloudBoot = Promise.resolve();
      return;
    }
    wx.cloud.init({
      env: CLOUD_ENV_ID,
      // traceUser 打开后，云开发控制台能看到用户访问记录，便于排查问题
      traceUser: true,
    });
    this.globalData.cloudReady = true;
    this.globalData.cloudBoot = this.bootCloud();
  },

  async bootCloud() {
    try {
      const profile = await restoreSession();
      if (profile) {
        writeSession(profile);
      }
    } catch (error) {
      console.warn('恢复登录失败（云函数还没上传时会出现）', error);
    }
    try {
      await ensureEventsSeeded();
    } catch (error) {
      console.warn('灌入示例数据失败（云函数还没上传时会出现）', error);
    }
  },
});
