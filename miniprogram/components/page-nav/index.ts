import { headerMetrics } from '../../utils/header';

/**
 * ============================================================================
 * 二级页吸顶导航：返回 + 标题
 * ============================================================================
 *
 * 【为什么是组件、为什么用 fixed】
 * 自定义导航栏（navigationStyle: custom）没有系统标题栏，返回和标题原先
 * 写在渐变头里，会跟着页面一起滚走。position: sticky 写在 .header 里也不行：
 * sticky 出不了父级，头部一滚出屏幕，标题栏也跟着没了。所以这条矮栏必须
 * position: fixed，钉在屏幕最顶上。
 *
 * 装饰（相机、旗子、波浪、网球）仍留在各页自己的头部里，可以滚走。
 *
 * 【怎么用】
 *   <page-nav title="相册" />
 *   <page-nav title="{{page.title}}" variant="gold" />
 *   <page-nav title="积分兑换" variant="plain" occupy="{{true}}" />
 *
 * variant：
 *   默认     青柠绿，盖在各页绿头上，滚过内容区时字仍然清楚
 *   gold     关于我们那种金头
 *   plain    白底，积分兑换 / 海报页
 *
 * occupy 为 true 时，组件会占掉自己那一截高度（白底页没有装饰头垫在下面，
 * 不占位的话黄条和海报会被挡住）。绿头/金头页不要开，否则会把装饰顶下去。
 */
Component({
  options: {
    // 去掉组件外壳节点，否则部分机型上 position:fixed 会钉在组件里而不是屏幕上
    virtualHost: true,
  },

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
      wx.navigateBack({
        fail: () => {
          wx.switchTab({ url: '/pages/events/index' });
        },
      });
    },
  },
});
