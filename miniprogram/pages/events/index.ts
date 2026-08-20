import {
  EVENT_FILTERS,
  HOME_BANNERS,
  HOME_FEATURES,
  MOCK_EVENTS,
  type EventItem,
} from '../../mock/home';
import { navigateToPage } from '../../utils/navigate';
import { syncTabBarSelected } from '../../utils/tabbar';

/**
 * ============================================================================
 * 赛事首页逻辑
 * ============================================================================
 *
 * 【这个文件负责什么】
 * 只做三件事：把数据交给页面渲染、响应点击、切换筛选。
 * 所有文案和数据都在 mock/home.ts，样式在 index.wxss，这里不含任何内容。
 */

/** 页面打开时默认选中哪个筛选。改成 '进行中' 就会默认显示进行中的赛事 */
const DEFAULT_FILTER = '报名中';

/**
 * 需要登录才能看的筛选项。
 * 「我的报名」显然只有登录后才有意义，所以未登录时显示空列表 + 登录提示。
 */
const LOGIN_REQUIRED_FILTER = '我的报名';

Page({
  data: {
    /** 状态栏高度，传给头部组件用来避开手机顶部状态栏 */
    statusBarHeight: 0,
    banners: HOME_BANNERS,
    features: HOME_FEATURES,
    filters: EVENT_FILTERS,
    activeFilter: DEFAULT_FILTER,
    events: [] as EventItem[],
    /** 列表为空时显示的文案，会随场景变化 */
    emptyHint: '该分类下暂无赛事',
  },

  onLoad() {
    const app = getApp<IAppOption>();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight });
    this.applyFilter(DEFAULT_FILTER);
  },

  /**
   * onShow 每次页面显示都会执行（包括从其他 Tab 切回来），
   * 而 onLoad 只在第一次创建时执行。
   *
   * 这里做两件事：
   * 1. 告诉自定义底栏"当前是第 0 个 Tab"，否则切换后高亮不会动
   * 2. 如果当前停在「我的报名」，重新取一次数——因为用户可能刚去
   *    「我的」页登录完回来，登录态变了但页面数据还是旧的
   */
  onShow() {
    syncTabBarSelected(this, 0);
    if (this.data.activeFilter === LOGIN_REQUIRED_FILTER) {
      this.applyFilter(LOGIN_REQUIRED_FILTER);
    }
  },

  /**
   * 切换筛选并取对应的数据。
   *
   * 【为什么单独抽成一个方法】
   * 有三个地方要触发切换：页面初始化、点筛选条、点宫格里的「我的报名」入口。
   * 抽出来避免逻辑重复。
   *
   * 【登录判断】
   * 登录态存在 app.globalData.isLoggedIn（由「我的」页登录后写入），
   * 这样跨页面共享。未登录看「我的报名」时给空列表 + 引导文案，
   * 而不是直接弹登录框——弹框太打扰，先让用户看到"这里有什么"。
   */
  applyFilter(filter: string) {
    const isLoggedIn = getApp<IAppOption>().globalData.isLoggedIn;
    const needLogin = filter === LOGIN_REQUIRED_FILTER && !isLoggedIn;

    this.setData({
      activeFilter: filter,
      events: needLogin ? [] : MOCK_EVENTS[filter] ?? [],
      emptyHint: needLogin ? '登录后查看你报名的赛事' : '该分类下暂无赛事',
    });
  },

  /** 点轮播：拿到索引后查出对应的跳转目标 */
  onBannerTap(event: WechatMiniprogram.CustomEvent<{ index: number }>) {
    const banner = HOME_BANNERS[event.detail.index];
    if (banner) {
      navigateToPage(banner.target);
    }
  },

  /**
   * 点七宫格入口。
   *
   * 【「我的报名」是特例】
   * 它在设计里既是宫格入口，也是下面筛选条的一项。点它的正确行为是
   * 切到那个筛选，而不是跳到一个新页面（本来也没有这个页面）。
   * 所以这里按 key 做了特殊分支。
   *
   * 其余入口走 navigateToPage，没做好的页面会弹提示不跳转，
   * 白名单见 utils/navigate.ts。
   */
  onFeatureTap(event: WechatMiniprogram.TouchEvent) {
    if (String(event.currentTarget.dataset.key) === 'registrations') {
      this.applyFilter(LOGIN_REQUIRED_FILTER);
      return;
    }
    navigateToPage(String(event.currentTarget.dataset.path));
  },

  onFilterChange(event: WechatMiniprogram.CustomEvent<{ tab: string }>) {
    this.applyFilter(event.detail.tab);
  },

  /** 点卡片主体。赛事详情页还没有设计稿，先给提示 */
  onEventTap() {
    wx.showToast({ title: '赛事详情页待设计', icon: 'none' });
  },

  /** 点报名按钮。报名要写库和支付，等接了云开发再实现 */
  onSignupTap() {
    wx.showToast({ title: '报名流程待接入云开发', icon: 'none' });
  },
});
