/**
 * ============================================================================
 * 积分兑换页逻辑
 * ============================================================================
 *
 * 点首页宫格「积分兑换」进来。黄条 + 海报从云库 posters.rewards 读。
 */
import { loadPosterPage } from '../../api/catalog';
import { themeBehavior } from '../../behaviors/theme';

Page({
  behaviors: [themeBehavior],
  data: {
    notice: '',
    poster: '',
  },

  async onLoad() {
    await getApp<IAppOption>().globalData.cloudBoot;
    const page = await loadPosterPage('rewards');
    this.setData({
      notice: page.notice,
      poster: page.poster,
    });
  },

  onPreviewPoster() {
    if (!this.data.poster) {
      return;
    }
    wx.previewImage({
      current: this.data.poster,
      urls: [this.data.poster],
    });
  },
});
