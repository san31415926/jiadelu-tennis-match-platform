import {
  GALLERY_FILTERS,
  GALLERY_SECTIONS,
  GALLERY_SUMMARY,
  filterSections,
  type GallerySection,
} from '../../mock/gallery';

Page({
  data: {
    statusBarHeight: 0,
    summary: GALLERY_SUMMARY,
    filters: GALLERY_FILTERS,
    activeFilter: '全部',
    sections: [] as GallerySection[],
  },

  onLoad() {
    const app = getApp<IAppOption>();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      sections: filterSections('全部'),
    });
  },

  onFilterTap(event: WechatMiniprogram.TouchEvent) {
    const filter = String(event.currentTarget.dataset.filter);
    if (filter === this.data.activeFilter) {
      return;
    }
    this.setData({ activeFilter: filter, sections: filterSections(filter) });
  },

  /** 在所属分组内预览，可左右滑动切换同组照片 */
  onPreview(event: WechatMiniprogram.TouchEvent) {
    const current = String(event.currentTarget.dataset.src);
    const groupId = String(event.currentTarget.dataset.group);
    const group = GALLERY_SECTIONS.find((section) => section.id === groupId);
    if (!group) {
      wx.previewImage({ urls: [current] });
      return;
    }
    wx.previewImage({ current, urls: group.photos });
  },

  onViewAll() {
    wx.showToast({ title: '相册全集页待设计', icon: 'none' });
  },

  onBack() {
    wx.navigateBack();
  },
});
