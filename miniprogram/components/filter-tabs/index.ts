Component({
  properties: {
    tabs: {
      type: Array,
      value: [],
    },
    active: {
      type: String,
      value: '',
    },
    /** 首页选中态为 #83d414，超级杯页设计中为 #76d709 */
    activeColor: {
      type: String,
      value: '#83d414',
    },
  },

  methods: {
    onTap(event: WechatMiniprogram.TouchEvent) {
      const tab = String(event.currentTarget.dataset.tab);
      if (tab === this.data.active) {
        return;
      }
      this.triggerEvent('change', { tab });
    },
  },
});
