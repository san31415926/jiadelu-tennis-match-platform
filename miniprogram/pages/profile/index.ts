import { MOCK_PROFILE, PROFILE_MENU } from '../../mock/profile';
import { navigateToPage } from '../../utils/navigate';
import { syncTabBarSelected } from '../../utils/tabbar';

/** XP 轨道在设计中宽 690rpx，小球直径 28rpx */
const XP_TRACK_WIDTH = 690;
const XP_TRACK_LEFT = 32;
const XP_BALL_SIZE = 28;

Page({
  data: {
    statusBarHeight: 0,
    profile: MOCK_PROFILE,
    menu: PROFILE_MENU,
    xpFillWidth: 0,
    xpBallLeft: 0,
  },

  onLoad() {
    const app = getApp<IAppOption>();
    const fillWidth = Math.round((XP_TRACK_WIDTH * MOCK_PROFILE.xpPercent) / 100);

    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      xpFillWidth: fillWidth,
      // 小球骑在填充末端上
      xpBallLeft: XP_TRACK_LEFT + fillWidth - XP_BALL_SIZE / 2,
    });
  },

  onShow() {
    syncTabBarSelected(this, 2);
  },

  onMenuTap(event: WechatMiniprogram.TouchEvent) {
    navigateToPage(String(event.currentTarget.dataset.path));
  },
});
