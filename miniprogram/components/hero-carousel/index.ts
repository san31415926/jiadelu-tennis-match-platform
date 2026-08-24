/**
 * ============================================================================
 * 渐变头部 + 轮播组件（首页与超级杯共用）
 * ============================================================================
 *
 * 【这个组件包含什么】
 * 上面一行绿条放页标题（不叠在图上），下面 321rpx 整块是轮播图，
 * 底部波浪叠在图上。赛事名画进 jpg；指示点仍用 WXML，好跟当前张走。
 *
 * 【轮播图从哪来】
 * 原图在仓库根目录 测试图/轮播图/，小程序用的是压缩 jpg：
 * miniprogram/assets/images/banners/。换图时两处都要换，并改
 * mock/home.ts / mock/super-cup.ts 里对应项的 image 路径。
 * 图上的赛事名是画进 jpg 的，改字要重新出图，改 mock 里的 title 不会显示在轮播上。
 *
 * 【怎么用】
 *   <hero-carousel
 *     title="LTJIMMY赛事"
 *     banners="{{banners}}"
 *     status-bar-height="{{statusBarHeight}}"
 *     nav-bar-height="{{navBarHeight}}"
 *     menu-inset-right="{{menuInsetRight}}"
 *     bind:bannertap="onBannerTap"
 *   />
 *
 * 【status-bar-height / nav-bar-height / menu-inset-right 都要传】
 * 自定义导航栏要自己避开状态栏和右上角胶囊。「LTJIMMY赛事」比较长，
 * 不留 menu-inset-right 会被胶囊挡住。三个值都在 app.ts 启动时量好。
 */
Component({
  properties: {
    /** 页面大标题，40rpx 加粗居中，固定在轮播上方的绿条里 */
    title: {
      type: String,
      value: '',
    },
    /** 轮播数据，结构见 mock/home.ts 的 HomeBanner */
    banners: {
      type: Array,
      value: [],
    },
    /** 手机状态栏高度，单位 px（注意不是 rpx），从 app.globalData 取 */
    statusBarHeight: {
      type: Number,
      value: 0,
    },
    /** 和胶囊按钮同高的那一行，标题垂直居中用。单位 px */
    navBarHeight: {
      type: Number,
      value: 44,
    },
    /** 标题左右内边距，避开胶囊。单位 px */
    menuInsetRight: {
      type: Number,
      value: 96,
    },
  },

  data: {
    current: 0,
  },

  methods: {
    onSwiperChange(event: WechatMiniprogram.SwiperChange) {
      this.setData({ current: event.detail.current });
    },

    /**
     * 点击轮播时把索引抛给页面，由页面决定跳哪里。
     * 组件不直接跳转，是为了让不同页面能配不同的跳转目标。
     */
    onSlideTap(event: WechatMiniprogram.TouchEvent) {
      const index = Number(event.currentTarget.dataset.index);
      this.triggerEvent('bannertap', { index });
    },
  },
});
