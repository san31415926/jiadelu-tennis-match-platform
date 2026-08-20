/**
 * 相册页假数据，与 Figma node 23:273 对应。
 * 设计稿画了两个内容完全相同的「第一届超级杯」分组，这里按实际数据去重。
 */

export interface GallerySection {
  id: string;
  /** 对应顶部分类筛选 */
  category: '超级杯' | '新秀杯' | '评级赛' | '赛程表';
  /** 赛程表分组只有标题；赛事分组的标题拆成三段，中间的品牌名用品牌绿 */
  titleParts: { text: string; brand?: boolean }[];
  /** 参赛人数与时间，赛程表分组没有 */
  subtitle?: string;
  photos: string[];
  /** 图片尺寸随分组变化：赛程表两张大图，赛事三张小图 */
  layout: 'bracket' | 'photo';
  count: string;
}

export const GALLERY_FILTERS = ['全部', '超级杯', '新秀杯', '评级赛', '赛程表'];

export const GALLERY_SUMMARY = '记录每一个高光瞬间 · 共 1,286 张';

export const GALLERY_SECTIONS: GallerySection[] = [
  {
    id: 'brackets',
    category: '赛程表',
    titleParts: [{ text: '一球制胜历届赛程表' }],
    photos: [
      '/assets/images/gallery/bracket-1.jpg',
      '/assets/images/gallery/bracket-2.jpg',
    ],
    layout: 'bracket',
    count: '12 张 · 赛程表',
  },
  {
    id: 'super-cup-1',
    category: '超级杯',
    titleParts: [
      { text: '第一届' },
      { text: 'LTJIMMY', brand: true },
      { text: '™ 网球俱乐部超级杯' },
    ],
    subtitle: '参赛人数  128 人 · 2025.10',
    photos: [
      '/assets/images/gallery/photo-1.jpg',
      '/assets/images/gallery/photo-2.jpg',
      '/assets/images/gallery/photo-3.jpg',
    ],
    layout: 'photo',
    count: '324 张',
  },
  {
    id: 'super-cup-2',
    category: '超级杯',
    titleParts: [
      { text: '第二届' },
      { text: 'LTJIMMY', brand: true },
      { text: '™ 网球俱乐部超级杯' },
    ],
    subtitle: '参赛人数  120 人 · 2026.03',
    photos: [
      '/assets/images/gallery/photo-4.jpg',
      '/assets/images/gallery/photo-5.jpg',
      '/assets/images/gallery/photo-6.jpg',
    ],
    layout: 'photo',
    count: '286 张',
  },
  {
    id: 'rookie-cup-2',
    category: '新秀杯',
    titleParts: [
      { text: '第二届' },
      { text: 'LTJIMMY', brand: true },
      { text: '™ 俱乐部新秀杯' },
    ],
    subtitle: '参赛人数  96 人 · 2025.12',
    photos: [
      '/assets/images/gallery/photo-3.jpg',
      '/assets/images/gallery/photo-6.jpg',
      '/assets/images/gallery/photo-1.jpg',
    ],
    layout: 'photo',
    count: '198 张',
  },
  {
    id: 'rating-70',
    category: '评级赛',
    titleParts: [
      { text: '7.0' },
      { text: '混双', brand: true },
      { text: '评级赛 · 佛山站' },
    ],
    subtitle: '参赛人数  16 人 · 2026.08',
    photos: [
      '/assets/images/gallery/photo-5.jpg',
      '/assets/images/gallery/photo-2.jpg',
      '/assets/images/gallery/photo-4.jpg',
    ],
    layout: 'photo',
    count: '74 张',
  },
];

export function filterSections(filter: string): GallerySection[] {
  if (filter === '全部') {
    return GALLERY_SECTIONS;
  }
  return GALLERY_SECTIONS.filter((section) => section.category === filter);
}
