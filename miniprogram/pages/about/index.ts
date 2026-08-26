/**
 * ============================================================================
 * 关于我们页
 * ============================================================================
 * 终稿 Figma node 68:618。文案和二维码占位在 mock/info-pages.ts。
 *
 * 吸顶栏 occupy 打开，状态栏高度由 page-nav 自己量，本页不必再抄 statusBarHeight。
 * 根节点挂 themeBehavior，换背景时竖向渐变跟着走。
 */
import { ABOUT_PAGE } from '../../mock/info-pages';
import { themeBehavior } from '../../behaviors/theme';

Page({
  behaviors: [themeBehavior],
  data: {
    page: ABOUT_PAGE,
  },
});
