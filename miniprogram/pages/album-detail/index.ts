/**
 * ============================================================================
 * 相册详情页逻辑
 * ============================================================================
 *
 * 从相册列表点「查看全部」进来。路径带 ?id=super-cup-1。
 * id 对不上就显示第一组，避免空白页。
 *
 * 点照片走微信原生预览，和相册列表页一样，只在这一组里左右滑。
 */
import { loadGallerySection } from '../../api/catalog';
import { expandAlbumPhotos } from '../../mock/gallery';
import { themeBehavior } from '../../behaviors/theme';

Page({
  behaviors: [themeBehavior],
  data: {
    titleParts: [] as { text: string; brand?: boolean }[],
    subtitle: '',
    countLabel: '',
    photos: [] as string[],
  },

  async onLoad(query: Record<string, string | undefined>) {
    await getApp<IAppOption>().globalData.cloudBoot;
    const section = await loadGallerySection(query.id ?? '');
    const countText = section.count.split('·')[0].trim();
    this.setData({
      titleParts: section.titleParts,
      subtitle: section.subtitle ?? '',
      countLabel: `共 ${countText}`,
      photos: expandAlbumPhotos(section.photos),
    });
  },

  onPreview(event: WechatMiniprogram.TouchEvent) {
    const current = String(event.currentTarget.dataset.src);
    wx.previewImage({ current, urls: this.data.photos });
  },
});
