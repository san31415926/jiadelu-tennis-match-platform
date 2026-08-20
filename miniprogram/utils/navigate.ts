/**
 * ============================================================================
 * 页面跳转守卫 —— 控制哪些入口能点进去
 * ============================================================================
 *
 * 【这个文件是干什么的】
 * 首页七宫格、超级杯八宫格、我的页菜单一共有十几个入口，但有些页面还没有
 * 设计稿（积分兑换、历届冠军、年会典礼等）。如果直接 wx.navigateTo 跳过去，
 * 小程序会报「page not found」错误，体验很差。
 *
 * 所以这里维护一份"已经做好的页面"白名单：在名单里的正常跳转，
 * 不在名单里的弹一个提示，不跳转。
 *
 * 【新做完一个页面后要做两件事】
 * 1. 在下面的 IMPLEMENTED_PAGES 里加上它的路径
 * 2. 在 app.json 的 pages 数组里也加上（注意 app.json 里不带开头的斜杠）
 * 漏了第 2 步会编译报错，漏了第 1 步则点击没反应只弹提示。
 *
 * 【想改提示文案】
 * 改下面 wx.showToast 里的 title。icon: 'none' 表示只显示文字不显示图标，
 * 换成 'success' 会显示一个绿色对勾（这里不合适）。
 */

const IMPLEMENTED_PAGES = new Set<string>([
  '/pages/ranking/index',
  '/pages/calendar/index',
  '/pages/clubs/index',
  '/pages/gallery/index',
]);

export function navigateToPage(path: string): void {
  if (!IMPLEMENTED_PAGES.has(path)) {
    wx.showToast({ title: '该页面还在还原中', icon: 'none' });
    return;
  }
  // navigateTo 会保留当前页面（能返回）；如果想替换当前页用 redirectTo，
  // 但底部 Tab 页之间的切换必须用 switchTab，见 custom-tab-bar/index.ts
  wx.navigateTo({ url: path });
}
