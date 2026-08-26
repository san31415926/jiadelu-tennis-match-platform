/**
 * ============================================================================
 * 积分兑换页逻辑
 * ============================================================================
 *
 * 点首页宫格「积分兑换」进来。结构就是旧版那一套：黄条提示 + 一张海报。
 * 点海报会用微信自带预览打开，方便把兑换表看大、长按存图。
 *
 * 想改提示文案或换海报 → mock/rewards.ts
 * 吸顶栏 occupy 打开，variant 用 plain（页底色，不走顶栏实色）。
 */
import { REWARDS_NOTICE, REWARDS_POSTER } from '../../mock/rewards';
import { themeBehavior } from '../../behaviors/theme';

Page({
  behaviors: [themeBehavior],
  data: {
    notice: REWARDS_NOTICE,
    poster: REWARDS_POSTER,
  },

  onPreviewPoster() {
    wx.previewImage({
      current: this.data.poster,
      urls: [this.data.poster],
    });
  },
});
