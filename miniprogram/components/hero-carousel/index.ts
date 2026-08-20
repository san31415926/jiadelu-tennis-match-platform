Component({
  properties: {
    title: {
      type: String,
      value: '',
    },
    /** 标题在 80rpx 高的区域内居中，首页为 0，超级杯页设计下移 10rpx */
    titleTop: {
      type: Number,
      value: 0,
    },
    banners: {
      type: Array,
      value: [],
    },
    statusBarHeight: {
      type: Number,
      value: 0,
    },
  },

  data: {
    current: 0,
  },

  methods: {
    onChange(event: WechatMiniprogram.SwiperChange) {
      this.setData({ current: event.detail.current });
    },

    onSlideTap(event: WechatMiniprogram.TouchEvent) {
      const index = Number(event.currentTarget.dataset.index);
      this.triggerEvent('bannertap', { index });
    },
  },
});
