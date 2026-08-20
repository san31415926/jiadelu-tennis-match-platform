/**
 * ============================================================================
 * 底栏选中态同步
 * ============================================================================
 *
 * 【为什么需要这个】
 * 我们在 app.json 里设了 tabBar.custom: true，也就是用自己画的底栏替换微信
 * 自带的那个（因为设计稿的底栏有 3D 图标和圆形光晕，原生底栏做不到）。
 *
 * 代价是：微信不再帮我们管理"当前在哪个 Tab"这个状态。每个 Tab 页都必须在
 * 自己显示的时候，主动告诉底栏组件"我是第几个"，否则切换 Tab 后高亮不会跟着动。
 *
 * 【怎么用】
 * 在每个 Tab 页的 onShow 里调用一次，索引从 0 开始，顺序和 app.json 里
 * tabBar.list 的顺序一致：
 *   赛事 = 0，超级杯 = 1，我的 = 2
 *
 *   onShow() {
 *     syncTabBarSelected(this, 0);
 *   }
 *
 * 【为什么写在 onShow 而不是 onLoad】
 * onLoad 只在页面第一次创建时执行；Tab 页切走再切回来不会重新 onLoad，
 * 但每次显示都会触发 onShow。写在 onLoad 里会导致来回切几次后高亮错位。
 *
 * 【为什么类型写得这么绕】
 * page.getTabBar 是微信提供的方法，但它的类型定义比较宽松。这里用一个
 * 最小化的类型描述（只要求有 setData 方法），既能通过类型检查，
 * 又不依赖具体的 typings 版本。
 */
export function syncTabBarSelected(
  page: { getTabBar?: <T>() => T },
  selected: number
): void {
  const tabBar = page.getTabBar?.<{
    setData: (data: { selected: number }) => void;
  }>();
  // 加 ?. 是因为页面可能在底栏组件还没挂载时就调用，此时 getTabBar 返回 undefined
  tabBar?.setData({ selected });
}
