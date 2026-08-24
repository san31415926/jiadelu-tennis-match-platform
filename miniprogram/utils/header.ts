/**
 * 自定义导航用到的三个尺寸，启动时在 app.ts 里量好。
 * 页面 onLoad 里展开进 data，标题才能避开状态栏和右上角胶囊。
 */
export function headerMetrics(): {
  statusBarHeight: number;
  navBarHeight: number;
  menuInsetRight: number;
} {
  const app = getApp<IAppOption>();
  return {
    statusBarHeight: app.globalData.statusBarHeight,
    navBarHeight: app.globalData.navBarHeight,
    menuInsetRight: app.globalData.menuInsetRight,
  };
}
