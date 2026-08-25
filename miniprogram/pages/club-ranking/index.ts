import {
  COLLAPSED_ROW_COUNT,
  CLUB_RANKING_METRICS,
  CLUB_RANKING_PERIODS,
  myClubRanking,
  rankClubs,
  toClubPodium,
  toClubRows,
} from '../../mock/club-ranking';
import type { ClubPodiumPlayer, ClubRankingRow } from '../../mock/club-ranking';
import { navigateToPage } from '../../utils/navigate';

/**
 * ============================================================================
 * 俱乐部榜单页逻辑 —— 视觉刷新草稿 V5（Figma 287:292）
 * ============================================================================
 *
 * 结构和球员排行几乎一样，区别只有：
 *   1. 范围是「本月 / 累计」，不是城市榜 / 全国榜
 *   2. 指标只有积分、战力（俱乐部没有身价）
 *   3. 点领奖台 / 列表行 / 底部条，进俱乐部主页并带 from=super-cup
 *
 * 排序在 mock/club-ranking.ts 的 rankClubs()。接云开发后换成查已注册俱乐部即可。
 */
Page({
  data: {
    statusBarHeight: 0,
    periods: CLUB_RANKING_PERIODS,
    activePeriod: '本月',
    metrics: CLUB_RANKING_METRICS,
    activeMetric: '积分',
    expanded: false,
    podium: [] as ClubPodiumPlayer[],
    rows: [] as ClubRankingRow[],
    totalRows: 0,
    totalCount: 0,
    myRanking: myClubRanking('积分', '本月'),
  },

  onLoad() {
    const app = getApp<IAppOption>();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight });
    this.refresh();
  },

  refresh() {
    const { activeMetric, activePeriod, expanded } = this.data;
    const clubs = rankClubs(activeMetric, activePeriod);
    const allRows = toClubRows(clubs, activeMetric, activePeriod);

    this.setData({
      podium: toClubPodium(clubs, activeMetric, activePeriod),
      rows: expanded ? allRows : allRows.slice(0, COLLAPSED_ROW_COUNT),
      totalRows: allRows.length,
      totalCount: clubs.length,
      myRanking: myClubRanking(activeMetric, activePeriod),
    });
  },

  onPeriodTap(event: WechatMiniprogram.TouchEvent) {
    const period = String(event.currentTarget.dataset.period);
    if (period === this.data.activePeriod) {
      return;
    }
    this.setData({ activePeriod: period, expanded: false }, () => this.refresh());
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

  onClubTap(event: WechatMiniprogram.TouchEvent) {
    const id = String(event.currentTarget.dataset.id || '');
    if (!id) {
      return;
    }
    navigateToPage(`/pages/club-home/index?id=${id}&from=super-cup`);
  },

  onMineTap() {
    const id = this.data.myRanking.clubId;
    navigateToPage(`/pages/club-home/index?id=${id}&from=super-cup`);
  },
});
