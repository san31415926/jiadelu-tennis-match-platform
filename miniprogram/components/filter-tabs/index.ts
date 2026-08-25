/**
 * ============================================================================
 * 状态筛选条组件
 * ============================================================================
 *
 * 【怎么用】
 *   <filter-tabs
 *     tabs="{{filters}}"          <!-- 选项文字数组 -->
 *     active="{{activeFilter}}"   <!-- 当前选中的那一项（传文字本身，不是索引） -->
 *     active-color="#83d414"      <!-- 选中态底色 -->
 *     variant="capsule"           <!-- V5 胶囊条；不传仍是旧矮条 -->
 *     bind:change="onFilterChange"
 *   />
 *
 * 【为什么用文字而不是索引表示选中】
 * 因为筛选项的文字同时也是数据的键名（见 mock/home.ts 的 MOCK_EVENTS），
 * 用文字可以直接拿去查数据，不用再做一次索引到键名的转换。
 *
 * 【wxml 里属性名要用连字符】
 * TS 里定义的 activeColor，在 wxml 里要写成 active-color，这是小程序的约定。
 */
Component({
  properties: {
    /** 选项文字数组，如 ['我的报名', '报名中', '进行中', '已结束'] */
    tabs: {
      type: Array,
      value: [],
    },
    /** 当前选中项的文字。必须是 tabs 数组里的某一项，否则没有任何项高亮 */
    active: {
      type: String,
      value: '',
    },
    /**
     * 选中态底色。
     *
     * V5 首页和超级杯都是 #83d414。做成可配置项，万一哪页要换色不用改组件。
     * 不传则用默认的 #83d414。
     */
    activeColor: {
      type: String,
      value: '#83d414',
    },
    /**
     * 外观。capsule 是 V5 圆角胶囊条（首页 148:199 / 超级杯 231:199）；
     * 不传仍是旧的矮条，给还没换皮的页用。
     */
    variant: {
      type: String,
      value: '',
    },
  },

  methods: {
    onTap(event: WechatMiniprogram.TouchEvent) {
      const tab = String(event.currentTarget.dataset.tab);
      // 点当前项不触发事件，避免页面做无意义的重新取数
      if (tab === this.data.active) {
        return;
      }
      // 组件不自己改 active，而是通知页面，由页面决定是否切换
      // （这样页面可以在切换前做拦截，比如"我的报名"要先判断登录）
      this.triggerEvent('change', { tab });
    },
  },
});
