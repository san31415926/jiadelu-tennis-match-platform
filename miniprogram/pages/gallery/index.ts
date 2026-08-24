import {
  GALLERY_FILTERS,
  GALLERY_SECTIONS,
  GALLERY_SUMMARY,
  filterSections,
} from '../../mock/gallery';
import type { GallerySection } from '../../mock/gallery';
import { navigateToPage } from '../../utils/navigate';

/**
 * ============================================================================
 * 赛事相册页逻辑
 * ============================================================================
 *
 * 【照片预览用的是微信原生能力】
 * wx.previewImage 会打开系统级的图片查看器，支持双指缩放、左右滑动切换、
 * 长按保存，不需要我们自己写。传 urls（同组所有照片）和 current（当前点的那张），
 * 用户就能在这一组里滑动浏览。
 *
 * 【为什么传的是同组而不是全部照片】
 * 如果传全部，用户在"超级杯"的照片里往右滑会滑到"评级赛"的照片，
 * 逻辑上很混乱。按分组隔离更符合预期。
 */
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

  onViewAll(event: WechatMiniprogram.TouchEvent) {
    const id = String(event.currentTarget.dataset.id);
    navigateToPage(`/pages/album-detail/index?id=${id}`);
  },
});
