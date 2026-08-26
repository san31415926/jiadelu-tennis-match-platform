/**
 * ============================================================================
 * 联系客服页
 * ============================================================================
 * 终稿 Figma node 68:655。大按钮用 button + open-type="contact"，
 * 才能打开微信客服会话。公众平台还没开通客服时，点了会失败，文案先按设计放着。
 *
 * 吸顶栏 occupy 打开，状态栏高度由 page-nav 自己量。客服按钮底色走 {{accent}}。
 */
import { SERVICE_PAGE } from '../../mock/info-pages';
import { themeBehavior } from '../../behaviors/theme';

Page({
  behaviors: [themeBehavior],
  data: {
    page: SERVICE_PAGE,
  },
});
