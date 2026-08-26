/**
 * ============================================================================
 * 底栏选中态同步
 * ============================================================================
 *
 * 自定义底栏不知道当前在哪个 Tab。每个 Tab 页 onShow 里调用一次，
 * 索引和 app.json 的 tabBar.list 一致：赛事 = 0，超级杯 = 1，我的 = 2。
 *
 * 颜色由底栏自己的 themeBehavior 管，这里只改「选中第几个」。
 * 顺手把 hidden 拨回 false：从侧栏跳走再切回来时，底栏必须还在。
 */

export function syncTabBarSelected(
  page: { getTabBar?: <T>() => T },
  selected: number
): void {
  const tabBar = page.getTabBar?.<{
    setData: (data: { selected: number; hidden?: boolean }) => void;
  }>();
  tabBar?.setData({ selected, hidden: false });
}

/**
 * 自定义底栏是独立一层，页面 z-index 压不住。
 * 侧栏打开时把它藏掉，「收起」才不会垫在底栏后面。
 */
export function setTabBarHidden(
  page: { getTabBar?: <T>() => T },
  hidden: boolean
): void {
  const tabBar = page.getTabBar?.<{
    setData: (data: { hidden: boolean }) => void;
  }>();
  tabBar?.setData({ hidden });
}
