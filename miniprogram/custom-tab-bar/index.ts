import { themeBehavior } from '../behaviors/theme';

/**
 * ============================================================================
 * 自定义底栏 —— 三个 Tab 的图标、文字与跳转
 * ============================================================================
 *
 * 设计稿是 3D 图标 + 选中光晕，微信原生底栏做不到，所以 app.json 里
 * tabBar.custom: true，用这个组件自己画。文件夹名必须叫 custom-tab-bar。
 *
 * 选中第几个：各 Tab 页 onShow 里 syncTabBarSelected(this, 索引)。
 * 选中颜色：挂了 themeBehavior，跟全站强调色走，不必再单独登记。
 */

interface TabItem {
  /** 页面路径，必须以斜杠开头，且必须是 app.json 里 tabBar.list 中登记过的页面 */
  path: string;
  /** 图标下方的文字 */
  text: string;
  /** 图标图片路径。用绝对路径（以斜杠开头），组件里用相对路径容易出错 */
  icon: string;
  /**
   * 每个图标的位置和尺寸。
   *
   * 【为什么要逐个写而不是统一尺寸】
   * 这三个 3D 图标的外形差异很大：日历是横向的、奖杯是纵向的、人物是窄的。
   * 设计稿（Figma node 1:295）给它们标了各自的宽高和位置，套用统一尺寸会
   * 让某些图标看起来偏大或偏小、上下不齐。
   *
   * 【坐标怎么算】
   * left/top 是相对于这一格（250rpx 宽 × 153rpx 高）的左上角。
   * 三格平分屏幕：750rpx ÷ 3 = 250rpx。
   *
   * 【想让图标整体变大】
   * 同时加大 width 和 height，并把 left 减掉增量的一半、top 也相应上移，
   * 否则图标会偏向右下。例如赛事图标从 69×60 放大到 79×70：
   *   left 从 102 改成 97（减 5），top 从 18 改成 13（减 5）
   *
   * 【想让图标整体上移】
   * 三个 top 各减同样的数值。注意别和下方 87rpx 处的文字重叠。
   */
  iconStyle: string;
}

/**
 * 三个 Tab 的配置。
 *
 * 顺序必须和 app.json 里 tabBar.list 完全一致，否则点击会跳错页面。
 *
 * 【注意「赛事」的图标】
 * 它和首页七宫格里「赛事日历」用的是同一张图片——这是设计稿本身的复用
 * （Figma 里两处引用了同一个资产），不是写错了。所以不需要单独再存一份，
 * 省下十几 KB 的包体积。
 */
const TABS: TabItem[] = [
  {
    path: '/pages/events/index',
    text: '赛事',
    icon: '/assets/icons/home/event-calendar.png',
    iconStyle: 'left:102rpx;top:18rpx;width:69rpx;height:60rpx',
  },
  {
    path: '/pages/super-cup/index',
    text: '超级杯',
    icon: '/assets/icons/tabbar/tab-super-cup.png',
    iconStyle: 'left:77rpx;top:15rpx;width:78rpx;height:80rpx',
  },
  {
    path: '/pages/profile/index',
    text: '我的',
    icon: '/assets/icons/tabbar/tab-profile.png',
    iconStyle: 'left:93rpx;top:22rpx;width:72rpx;height:70rpx',
  },
];

Component({
  behaviors: [themeBehavior],
  data: {
    /** 当前选中第几个（从 0 开始）。以当前页路径为准，不要只信这份缓存 */
    selected: 0,
    tabs: TABS,
    /**
     * 未选中图标的不透明度。设计稿里就是 52%，所以未选中的图标是"褪色"的。
     *
     * 调到 1 → 三个图标一样鲜艳，选中态只靠光晕和文字颜色区分
     * 调到 0.3 → 未选中更暗淡，选中态对比更强烈
     */
    idleOpacity: 0.52,
    /** 首页侧栏打开时为 true，整条底栏藏掉，避免挡住侧栏底部两项 */
    hidden: false,
  },

  pageLifetimes: {
    show() {
      this.syncFromRoute();
    },
  },

  methods: {
    currentRoute(): string {
      const pages = getCurrentPages();
      const current = pages[pages.length - 1];
      return current && current.route ? `/${current.route}` : '';
    },

    /** 高亮跟当前页走，避免还停在「赛事」时点「赛事」被当成已经在这一页 */
    syncFromRoute() {
      const route = this.currentRoute();
      const selected = TABS.findIndex((tab) => tab.path === route);
      if (selected >= 0 && selected !== this.data.selected) {
        this.setData({ selected });
      }
    },

    onTap(event: WechatMiniprogram.TouchEvent) {
      const index = Number(event.currentTarget.dataset.index);
      if (index < 0 || index >= TABS.length) {
        return;
      }
      const url = TABS[index].path;
      this.setData({ selected: index });
      if (this.currentRoute() === url) {
        return;
      }
      wx.switchTab({ url });
    },
  },
});
