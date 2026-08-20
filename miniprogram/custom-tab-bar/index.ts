interface TabItem {
  path: string;
  text: string;
  icon: string;
  /** 每个图标在 Figma 中的位置与尺寸都不同，逐项保留原始几何 */
  iconStyle: string;
}

/** 赛事 tab 与首页宫格「赛事日历」在设计中引用同一张资产 */
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
    selected: 0,
    tabs: TABS,
    idleOpacity: 0.52,
  },

  methods: {
    onTap(event: WechatMiniprogram.TouchEvent) {
      const index = Number(event.currentTarget.dataset.index);
      if (index === this.data.selected) {
        return;
      }
      wx.switchTab({ url: TABS[index].path });
    },
  },
});
