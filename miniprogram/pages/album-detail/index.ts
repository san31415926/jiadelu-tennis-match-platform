/**
 * ============================================================================
 * 相册详情页逻辑
 * ============================================================================
 *
 * 从相册列表点「查看全部」进来。路径带 ?id=。
 * 照片按云库这一组的实数显示，不够 12 张也不再循环复制示例图。
 */
import { loadGallerySection } from '../../api/catalog';
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
    try {
      const section = await loadGallerySection(query.id ?? '');
      const photos = section.photos || [];
      this.setData({
        titleParts: section.titleParts,
        subtitle: section.subtitle ?? '',
        countLabel: `共 ${photos.length} 张`,
        photos,
      });
    } catch (error) {
      console.warn('读相册详情失败', error);
      wx.showToast({ title: '相册加载失败', icon: 'none' });
    }
  },

  onPreview(event: WechatMiniprogram.TouchEvent) {
    const current = String(event.currentTarget.dataset.src);
    wx.previewImage({ current, urls: this.data.photos });
  },
});
