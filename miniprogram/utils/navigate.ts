/**
 * 已实现的二级页路径。随着页面逐个还原，在这里登记后入口即生效；
 * 未登记的入口点击只给提示，避免跳转到不存在的路由。
 */
const IMPLEMENTED_PAGES = new Set<string>([
  '/pages/ranking/index',
  '/pages/calendar/index',
]);

export function navigateToPage(path: string): void {
  if (!IMPLEMENTED_PAGES.has(path)) {
    wx.showToast({ title: '该页面还在还原中', icon: 'none' });
    return;
  }
  wx.navigateTo({ url: path });
}
