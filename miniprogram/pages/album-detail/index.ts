/**
 * ============================================================================
 * 相册详情页逻辑
 * ============================================================================
 *
 * 从相册列表点「查看全部」进来。路径带 ?id=super-cup-1，对应 mock/gallery.ts
 * 里某一组。id 对不上就显示第一组，避免空白页。
 *
 * 点照片走微信原生预览，和相册列表页一样，只在这一组里左右滑。
 *
 * 版式来自草稿 Figma「相册详情 / Prototype Screen / Editable」：
 * 居中标题 + 张数胶囊 + 三列圆角照片墙。波浪头已去掉，occupy 吸顶栏。
 */
import { expandAlbumPhotos, getGallerySection } from '../../mock/gallery';
import { themeBehavior } from '../../behaviors/theme';

Page({
  behaviors: [themeBehavior],
  data: {
    titleParts: [] as { text: string; brand?: boolean }[],
    subtitle: '',
    countLabel: '',
    photos: [] as string[],
  },

  onLoad(query: Record<string, string | undefined>) {
    const section = getGallerySection(query.id ?? '');
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
