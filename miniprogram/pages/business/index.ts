/**
 * ============================================================================
 * 商务合作页
 * ============================================================================
 * 终稿 Figma node 68:580。二维码还没定，先留虚线框；拿到图后改 mock/info-pages.ts。
 *
 * 吸顶栏 occupy 打开，状态栏高度由 page-nav 自己量。版式和「关于我们」同一套。
 */
import { BUSINESS_PAGE } from '../../mock/info-pages';
import { themeBehavior } from '../../behaviors/theme';

Page({
  behaviors: [themeBehavior],
  data: {
    page: BUSINESS_PAGE,
  },
});
