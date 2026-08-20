/**
 * ============================================================================
 * 相册页数据 —— 按赛事分组的照片墙
 * ============================================================================
 *
 * 【两种版式】
 * 设计稿里相册分两种排法：
 *   赛程表分组：两张大图（293×184），有额外的行间距
 *   赛事分组：  三张小图（190×126），下方多一条分隔线，还有参赛人数副标题
 * 用 layout 字段区分，页面靠 CSS 修饰类切换，不需要写两套模板。
 *
 * 【关于设计稿的重复分组】
 * Figma 里画了两个内容一模一样的「第一届超级杯」（node 23:300 和 23:314），
 * 应该是复制图层时留下的，这里按实际数据去重了。
 *
 * 【为什么加了新秀杯和评级赛分组】
 * 设计只画了赛程表和超级杯两类，但顶部有五个分类筛选。如果不补数据，
 * 点「新秀杯」「评级赛」会是空白页，看不出筛选有没有生效。
 *
 * 【常见改动】
 * 加一个赛事相册 → 往 GALLERY_SECTIONS 加一项，category 要填五个筛选之一
 * 改分类筛选     → 改 GALLERY_FILTERS，同时要有对应 category 的分组
 * 换照片         → 改 photos 数组，赛事分组建议放 3 张（正好铺满一行）
 */

/** 一个相册分组 */
export interface GallerySection {
  id: string;
  /** 属于哪一类，顶部筛选按它过滤。必须是 GALLERY_FILTERS 里除「全部」外的某一项 */
  category: '超级杯' | '新秀杯' | '评级赛' | '赛程表';
  /**
   * 标题，拆成若干段拼接显示。
   *
   * 【为什么要拆段】
   * 设计里标题是混排的：「第一届 LTJIMMY ™ 网球俱乐部超级杯」，其中
   * 「LTJIMMY」是品牌绿色，其余是深灰。一个字符串做不到局部换色，
   * 所以拆成三段，带 brand: true 的那段用绿色。
   *
   * 只有一段的话就是普通单色标题（比如赛程表分组）。
   */
  titleParts: { text: string; brand?: boolean }[];
  /** 参赛人数与时间，如「参赛人数  128 人 · 2025.10」。赛程表分组没有这一行 */
  subtitle?: string;
  /** 缩略图列表。赛事分组放 3 张刚好一行，多放会溢出被裁掉 */
  photos: string[];
  /** 版式：'bracket' 两张大图，'photo' 三张小图 */
  layout: 'bracket' | 'photo';
  /** 右下角的张数说明，如「324 张」 */
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

/**
 * 按分类筛出要显示的分组。「全部」返回所有。
 *
 * 如果某个分类下没有任何分组，页面会是空白（目前每个分类都有数据）。
 * 想加空状态提示，在 pages/gallery/index.wxml 末尾加一个
 * wx:if="{{sections.length === 0}}" 的提示块即可。
 */
export function filterSections(filter: string): GallerySection[] {
  if (filter === '全部') {
    return GALLERY_SECTIONS;
  }
  return GALLERY_SECTIONS.filter((section) => section.category === filter);
}
