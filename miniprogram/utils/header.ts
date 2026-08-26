/**
 * ============================================================================
 * 自定义导航用到的三个尺寸
 * ============================================================================
 *
 * 首页 / 超级杯 / 我的 的顶栏自己写 padding-top:{{statusBarHeight}}px。
 * 二级页把 page-nav 的 occupy 打开即可，组件内部会调这个函数。
 *
 * 单位都是 px（不是 rpx），因为量的是真机物理区域。
 *
 * 【为什么要能当场再量一遍】
 * 开发者工具热重载常常只刷新页面、不重跑 App.onLaunch，这时 globalData
 * 里的高度会变回 0。顶栏只剩字标那几十 rpx，整条会被状态栏和胶囊盖住。
 * 所以缓存是 0 时立刻用 wx.getWindowInfo 再量，不要死等启动时那一次。
 */
export type HeaderMetrics = {
  statusBarHeight: number;
  navBarHeight: number;
  menuInsetRight: number;
};

/** 当场量。App 启动和热重载兜底都走这里。 */
export function measureHeaderMetrics(): HeaderMetrics {
  const windowInfo = wx.getWindowInfo();
  const menuButton = wx.getMenuButtonBoundingClientRect();
  const statusBarHeight = windowInfo.statusBarHeight ?? 0;

  // 右上角胶囊上下留白对称，用它反推和微信自带导航栏等高的数值
  const navBarHeight =
    menuButton.bottom + (menuButton.top - statusBarHeight) - statusBarHeight;

  return {
    statusBarHeight,
    navBarHeight: navBarHeight > 0 ? navBarHeight : 44,
    menuInsetRight: Math.max(96, windowInfo.windowWidth - menuButton.left + 8),
  };
}

function readCachedMetrics(): HeaderMetrics | null {
  try {
    const app = getApp<IAppOption>();
    const cached = app && app.globalData;
    if (cached && cached.statusBarHeight) {
      return {
        statusBarHeight: cached.statusBarHeight,
        navBarHeight: cached.navBarHeight,
        menuInsetRight: cached.menuInsetRight,
      };
    }
  } catch {
    // App 还没起来，走当场量
  }
  return null;
}

function writeCachedMetrics(metrics: HeaderMetrics) {
  try {
    const app = getApp<IAppOption>();
    if (app && app.globalData) {
      app.globalData.statusBarHeight = metrics.statusBarHeight;
      app.globalData.navBarHeight = metrics.navBarHeight;
      app.globalData.menuInsetRight = metrics.menuInsetRight;
    }
  } catch {
    // 写不进缓存也没关系，返回值照样能垫顶栏
  }
}

export function headerMetrics(): HeaderMetrics {
  const cached = readCachedMetrics();
  if (cached) {
    return cached;
  }
  const measured = measureHeaderMetrics();
  writeCachedMetrics(measured);
  return measured;
}
