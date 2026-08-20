/**
 * ============================================================================
 * 自定义底栏 —— 三个 Tab 的图标、文字与跳转
 * ============================================================================
 *
 * 【为什么不用微信自带的底栏】
 * 设计稿的底栏是 3D 立体图标 + 选中时图标背后有一圈淡绿光晕，微信原生底栏
 * 只支持"一张图 + 一行字"，做不出光晕效果。所以在 app.json 里设了
 * tabBar.custom: true，改用这个组件自己画。
 *
 * 【文件夹名字不能改】
 * 必须叫 custom-tab-bar，文件必须叫 index，这是微信的约定。改名后底栏会消失。
 *
 * 【选中态是怎么来的】
 * 这个组件不知道当前在哪个页面，需要每个 Tab 页在 onShow 里调用
 * syncTabBarSelected(this, 索引) 告诉它。详见 utils/tabbar.ts。
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
  data: {
    /** 当前选中第几个（从 0 开始），由页面通过 syncTabBarSelected 写入 */
    selected: 0,
    tabs: TABS,
    /**
     * 未选中图标的不透明度。设计稿里就是 52%，所以未选中的图标是"褪色"的。
     *
     * 调到 1 → 三个图标一样鲜艳，选中态只靠光晕和文字颜色区分
     * 调到 0.3 → 未选中更暗淡，选中态对比更强烈
     */
    idleOpacity: 0.52,
  },

  methods: {
    onTap(event: WechatMiniprogram.TouchEvent) {
      const index = Number(event.currentTarget.dataset.index);
      // 点当前页不做任何事，避免重复触发页面生命周期
      if (index === this.data.selected) {
        return;
      }
      // Tab 页之间必须用 switchTab，用 navigateTo 会报错
      wx.switchTab({ url: TABS[index].path });
    },
  },
});
