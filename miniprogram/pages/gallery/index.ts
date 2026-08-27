import { galleriesOfFilter, listGalleries } from '../../api/catalog';
import { GALLERY_FILTERS, GALLERY_SUMMARY } from '../../mock/gallery';
import type { GallerySection } from '../../mock/gallery';
import { navigateToPage } from '../../utils/navigate';
import { themeBehavior } from '../../behaviors/theme';

/**
 * ============================================================================
 * 赛事相册页逻辑
 * ============================================================================
 * 版式来自终稿 23:272。V5 草稿 228:883 几乎同构图，已去掉波浪头和相机装饰，
 * 改 occupy 吸顶栏。筛选选中走主题强调色。
 *
 * 分组从云库 galleries 读。点照片仍用微信原生 wx.previewImage，只在同组内滑。
 */
Page({
  behaviors: [themeBehavior],
  data: {
    summary: GALLERY_SUMMARY,
    filters: GALLERY_FILTERS,
    activeFilter: '全部',
    allSections: [] as GallerySection[],
    sections: [] as GallerySection[],
  },

  async onLoad() {
    await getApp<IAppOption>().globalData.cloudBoot;
    const allSections = await listGalleries();
    this.setData({
      allSections,
      sections: galleriesOfFilter(allSections, '全部'),
    });
  },

  onFilterTap(event: WechatMiniprogram.TouchEvent) {
    const filter = String(event.currentTarget.dataset.filter);
    if (filter === this.data.activeFilter) {
      return;
    }
    this.setData({
      activeFilter: filter,
      sections: galleriesOfFilter(this.data.allSections, filter),
    });
  },

  /** 在所属分组内预览，可左右滑动切换同组照片 */
  onPreview(event: WechatMiniprogram.TouchEvent) {
    const current = String(event.currentTarget.dataset.src);
    const groupId = String(event.currentTarget.dataset.group);
    const group = this.data.allSections.find((section) => section.id === groupId);
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
