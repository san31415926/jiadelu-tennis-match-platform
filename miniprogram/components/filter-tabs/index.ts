import { themeBehavior } from '../../behaviors/theme';

/**
 * ============================================================================
 * 状态筛选条组件
 * ============================================================================
 *
 * 【怎么用】
 *   <filter-tabs
 *     tabs="{{filters}}"
 *     active="{{activeFilter}}"
 *     variant="capsule"
 *     bind:change="onFilterChange"
 *   />
 *
 * 选中色默认跟全站主题走。要覆盖时再传 active-color / active-text-color。
 *
 * 【为什么用文字而不是索引表示选中】
 * 筛选项的文字同时也是数据的键名（见 mock/home.ts 的 MOCK_EVENTS），
 * 用文字可以直接拿去查数据，不用再做一次索引到键名的转换。
 */
Component({
  behaviors: [themeBehavior],
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
     * 选中态底色。不传就用当前主题的 accent。
     * 首页 / 超级杯也会显式传入，效果一样。
     */
    activeColor: {
      type: String,
      value: '',
    },
    /** 选中态文字色。不传就用 accentText。 */
    activeTextColor: {
      type: String,
      value: '',
    },
    /**
     * 外观。capsule 是 V5 圆角胶囊条（首页 148:199 / 超级杯 231:199）；
     * 不传仍是旧的矮条。
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
