/**
 * ============================================================================
 * 海报页逻辑（年会 / 冠军 / 四项杯赛 / 年度最佳 / 积分兑换）
 * ============================================================================
 *
 * 结构都是旧版那一套：黄条提示 + 一张海报。用 onLoad 的 id 参数决定显示哪张。
 * 文案和图片从云库 posters 读，空集合时 seedMock 会灌入现有海报资产。
 */
import { loadPosterPage } from '../../api/catalog';
import { themeBehavior } from '../../behaviors/theme';

Page({
  behaviors: [themeBehavior],
  data: {
    title: '',
    notice: '',
    poster: '',
  },

  async onLoad(query: Record<string, string | undefined>) {
    await getApp<IAppOption>().globalData.cloudBoot;
    const page = await loadPosterPage(query.id ?? '');
    this.setData({
      title: page.title,
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
