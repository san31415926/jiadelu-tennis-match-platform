/**
 * ============================================================================
 * 海报页逻辑（年会 / 冠军 / 四项杯赛 / 年度最佳 / 积分兑换）
 * ============================================================================
 *
 * 结构都是旧版那一套：黄条提示 + 一张海报。用 onLoad 的 id 参数决定显示哪张。
 * 例如 /pages/poster/index?id=ceremony
 * 不传 id 或 id 不认识，就落到积分兑换，避免空白页。
 *
 * 点海报会用微信预览打开，方便看大图、长按保存。换图去 mock/posters.ts。
 */
import { POSTER_PAGES } from '../../mock/posters';

Page({
  data: {
    title: '',
    notice: '',
    poster: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    const page = POSTER_PAGES[query.id ?? ''] ?? POSTER_PAGES.rewards;
    this.setData({
      title: page.title,
      notice: page.notice,
      poster: page.poster,
    });
  },

  onPreviewPoster() {
    wx.previewImage({
      current: this.data.poster,
      urls: [this.data.poster],
    });
  },
});
