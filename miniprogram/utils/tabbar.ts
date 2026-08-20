/**
 * 使用自定义 tabBar 时，框架不会自动同步选中态，
 * 每个 tab 页需要在 onShow 里告知底栏当前是第几项。
 */
export function syncTabBarSelected(
  page: { getTabBar?: <T>() => T },
  selected: number
): void {
  const tabBar = page.getTabBar?.<{
    setData: (data: { selected: number }) => void;
  }>();
  tabBar?.setData({ selected });
}
