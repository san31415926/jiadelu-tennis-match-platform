import { getMyClub } from '../api/catalog';

/**
 * ============================================================================
 * 页面跳转守卫 —— 控制哪些入口能点进去
 * ============================================================================
 *
 * 【这个文件是干什么的】
 * 首页七宫格、超级杯八宫格、我的页菜单一共有十几个入口，但有些页面还没有
 * 设计稿。如果直接 wx.navigateTo 跳过去，小程序会报「page not found」，体验很差。
 *
 * 所以这里维护一份"已经做好的页面"白名单：在名单里的正常跳转，
 * 不在名单里的弹一个提示，不跳转。
 *
 * 白名单只比对路径、不含 ?id= 参数。海报页共用 /pages/poster/index，
 * 用查询参数区分年会、冠军、四项杯赛等。
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
  '/pages/rewards/index',
  '/pages/poster/index',
  '/pages/club-ranking/index',
  '/pages/membership/index',
  '/pages/album-detail/index',
  '/pages/profile-edit/index',
  '/pages/business/index',
  '/pages/about/index',
  '/pages/service/index',
  '/pages/club-home/index',
  '/pages/event-detail/index',
  '/pages/records/index',
  '/pages/signup/index',
  '/pages/venue/index',
]);

/** 点赛事卡片跳详情。id 空就不跳，避免落到错误的一场 */
export function navigateToEventDetail(id?: string): void {
  if (!id) {
    return;
  }
  navigateToPage(`/pages/event-detail/index?id=${id}`);
}

function pagePath(url: string): string {
  return url.split('?')[0];
}

export function navigateToPage(path: string): void {
  if (!IMPLEMENTED_PAGES.has(pagePath(path))) {
    wx.showToast({ title: '该页面还在还原中', icon: 'none' });
    return;
  }
  // navigateTo 会保留当前页面（能返回）；如果想替换当前页用 redirectTo，
  // 但底部 Tab 页之间的切换必须用 switchTab，见 custom-tab-bar/index.ts
  wx.navigateTo({ url: path });
}

const EVENTS_TAB = '/pages/events/index';

/** 球员榜底部「去参赛」：赛事是 Tab 页，必须 switchTab，navigateTo 会报错 */
export function switchToEvents(): void {
  wx.switchTab({ url: EVENTS_TAB });
}

/**
 * 「我的俱乐部」入口。
 * 已登录且已经加入一家 → 直接进那家主页；
 * 未登录或还没入会 → 俱乐部中心找俱乐部。
 */
export function openMyClub(): void {
  void openMyClubAsync();
}

async function openMyClubAsync(): Promise<void> {
  await getApp<IAppOption>().globalData.cloudBoot;
  const isLoggedIn = getApp<IAppOption>().globalData.isLoggedIn;
  if (isLoggedIn) {
    const mine = await getMyClub();
    if (mine) {
      navigateToPage(`/pages/club-home/index?id=${mine.id}`);
      return;
    }
  }
  navigateToPage('/pages/clubs/index');
}

/**
 * 二级页左上角「返回」。栈里还有上一页就退一层；
 * 没有（开发者工具直接编译本页、或从分享卡进来）就回到赛事 Tab。
 */
export function navigateBackOrHome(): void {
  wx.navigateBack({
    delta: 1,
    fail: () => {
      switchToEvents();
    },
  });
}
