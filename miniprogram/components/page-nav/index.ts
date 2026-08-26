import { headerMetrics } from '../../utils/header';
import { navigateBackOrHome } from '../../utils/navigate';
import { themeBehavior } from '../../behaviors/theme';

/**
 * ============================================================================
 * 二级页吸顶导航：返回 + 标题
 * ============================================================================
 *
 * 自定义导航栏没有系统标题栏，返回和标题必须 position: fixed 钉在顶上，
 * 否则一滚就跟着内容走。现页二级页都打开 occupy，不要再垫一层装饰头。
 *
 * 【怎么用】
 *   <page-nav title="相册" occupy="{{true}}" />
 *   <page-nav title="开通会员" variant="plain" occupy="{{true}}" />
 *
 * variant：
 *   默认 / gold / mint  都吃当前主题的 --page-nav-bg
 *   plain               页底色，积分兑换 / 海报 / 会员 / 相册 Tab
 *
 * occupy 为 true 时占掉自己那一截高度，下面的内容不会被挡住。
 * 颜色走 themeBehavior，根节点写 style="{{themeVars}}"。
 */
Component({
  options: {
    // 去掉组件外壳节点，否则部分机型上 position:fixed 会钉在组件里而不是屏幕上
    virtualHost: true,
  },
  behaviors: [themeBehavior],

  properties: {
    title: {
      type: String,
      value: '',
    },
    variant: {
      type: String,
      value: '',
    },
    occupy: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
  },

  lifetimes: {
    attached() {
      this.setData(headerMetrics());
    },
  },

  methods: {
    onBack() {
      // 栈里有上一页就退一层；没有（直达本页 / 分享卡）就回赛事 Tab
      navigateBackOrHome();
    },
  },
});
