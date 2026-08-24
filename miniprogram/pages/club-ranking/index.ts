import {
  COLLAPSED_ROW_COUNT,
  CLUB_RANKING_METRICS,
  MY_CLUB_RANKING,
  rankClubs,
  toClubPodium,
  toClubRows,
} from '../../mock/club-ranking';
import type { PodiumPlayer, RankingRow } from '../../mock/ranking';

/**
 * ============================================================================
 * 俱乐部榜单页逻辑
 * ============================================================================
 *
 * 结构和球员排行几乎一样，区别只有：
 *   1. 没有城市榜 / 全国榜，名单就是小程序里已注册的俱乐部
 *   2. 指标只有战力、积分（俱乐部没有身价）
 *
 * 排序在 mock/club-ranking.ts 的 rankClubs()。接云开发后换成查已注册俱乐部即可。
 */
Page({
  data: {
    statusBarHeight: 0,
    metrics: CLUB_RANKING_METRICS,
    activeMetric: '战力',
    expanded: false,
    podium: [] as PodiumPlayer[],
    rows: [] as RankingRow[],
    totalRows: 0,
    totalCount: 0,
    myRanking: MY_CLUB_RANKING,
  },

  onLoad() {
    const app = getApp<IAppOption>();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight });
    this.refresh();
  },

  refresh() {
    const { activeMetric, expanded } = this.data;
    const clubs = rankClubs(activeMetric);
    const allRows = toClubRows(clubs, activeMetric);

    this.setData({
      podium: toClubPodium(clubs, activeMetric),
      rows: expanded ? allRows : allRows.slice(0, COLLAPSED_ROW_COUNT),
      totalRows: allRows.length,
      totalCount: clubs.length,
    });
  },

  onMetricTap(event: WechatMiniprogram.TouchEvent) {
    const metric = String(event.currentTarget.dataset.metric);
    if (metric === this.data.activeMetric) {
      return;
    }
    this.setData({ activeMetric: metric }, () => this.refresh());
  },

  onToggleExpand() {
    this.setData({ expanded: !this.data.expanded }, () => this.refresh());
  },
});
