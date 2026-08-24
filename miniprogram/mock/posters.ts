/**
 * ============================================================================
 * 海报页数据 —— 年会 / 历届冠军 / 四项杯赛 / 年度最佳 / 积分兑换
 * ============================================================================
 *
 * 这些入口和旧版一样：黄条文字 + 一张长图。共用 pages/poster/index，
 * 用 ?id= 区分是哪一张。积分兑换那张是从旧版截图裁的；其余是占位海报，
 * 你有正式图后覆盖 miniprogram/assets/images/posters/ 同名 jpg 即可。
 *
 * 【常见改动】
 * 改黄条上的字 → 改对应项的 notice
 * 换海报       → 覆盖 poster 指向的 jpg
 * 加一个入口   → 在 POSTER_PAGES 加一项，宫格 path 写成 /pages/poster/index?id=新id
 */
export interface PosterPage {
  title: string;
  notice: string;
  poster: string;
}

export const POSTER_PAGES: Record<string, PosterPage> = {
  rewards: {
    title: '积分兑换',
    notice: '积分兑换 💥、后续更新最新赛事积分',
    poster: '/assets/images/rewards/poster.jpg',
  },
  ceremony: {
    title: '年会典礼',
    notice: '年会典礼 💥、时间地点奖项见下方海报',
    poster: '/assets/images/posters/ceremony.jpg',
  },
  champions: {
    title: '历届冠军',
    notice: '历届冠军 💥、各项目冠军持续更新',
    poster: '/assets/images/posters/champions.jpg',
  },
  'super-cup': {
    title: '超级杯赛事',
    notice: '超级杯赛事 💥、赛程与规则见下方海报',
    poster: '/assets/images/posters/super-cup.jpg',
  },
  'rookie-cup': {
    title: '新秀杯赛事',
    notice: '新秀杯赛事 💥、赛程与规则见下方海报',
    poster: '/assets/images/posters/rookie-cup.jpg',
  },
  'women-cup': {
    title: '女俱乐部赛',
    notice: '女俱乐部赛 💥、赛程与规则见下方海报',
    poster: '/assets/images/posters/women-cup.jpg',
  },
  'evergreen-cup': {
    title: '常青杯赛事',
    notice: '常青杯赛事 💥、赛程与规则见下方海报',
    poster: '/assets/images/posters/evergreen-cup.jpg',
  },
  'annual-best': {
    title: '年度最佳',
    notice: '年度最佳 💥、评选结果见下方海报',
    poster: '/assets/images/posters/annual-best.jpg',
  },
};
