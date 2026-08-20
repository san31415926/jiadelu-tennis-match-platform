/**
 * ============================================================================
 * 渐变头部 + 轮播组件（首页与超级杯共用）
 * ============================================================================
 *
 * 【这个组件包含什么】
 * 顶部那整块绿色渐变区域：页面大标题、可自动播放的轮播文案、三个指示点、
 * 以及下缘的波浪。渐变背景和波浪的样式在 app.wxss 里（因为七个页面都用），
 * 这个组件的 wxss 只管轮播部分。
 *
 * 【怎么用】
 *   <hero-carousel
 *     title="LTJIMMY赛事"
 *     title-top="0"                        <!-- 标题微调，见下方说明 -->
 *     banners="{{banners}}"
 *     status-bar-height="{{statusBarHeight}}"
 *     bind:bannertap="onBannerTap"
 *   />
 *
 * 【status-bar-height 是必须传的】
 * 因为我们用了自定义导航栏，需要手动避开手机顶部状态栏。这个值由
 * app.ts 在启动时测量并存在 globalData 里，页面在 onLoad 里取出来传进来。
 * 不传的话标题会被状态栏压住。
 */
Component({
  properties: {
    /** 页面大标题，40rpx 加粗居中 */
    title: {
      type: String,
      value: '',
    },
    /**
     * 标题的垂直微调（单位 rpx）。
     *
     * 标题在一个 80rpx 高的区域里垂直居中，这个值是那个区域的上偏移。
     * 首页传 0，超级杯传 10 —— 因为设计稿里两页的标题位置差了一点点。
     * 调大数值标题往下移，调小往上移（可以是负数）。
     */
    titleTop: {
      type: Number,
      value: 0,
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
  },

  data: {
    /** 当前显示第几张，指示点靠它判断哪个要高亮 */
    current: 0,
  },

  methods: {
    /**
     * 轮播切换时同步指示点。
     * swiper 组件自己会处理滑动和自动播放，我们只需要接住它的 change 事件。
     */
    onChange(event: WechatMiniprogram.SwiperChange) {
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
