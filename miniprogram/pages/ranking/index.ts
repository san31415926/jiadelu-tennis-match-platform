import {
  COLLAPSED_ROW_COUNT,
  MY_RANKING,
  RANKING_METRICS,
  RANKING_SCOPES,
  rankPlayers,
  toPodium,
  toRows,
  type PodiumPlayer,
  type RankingRow,
} from '../../mock/ranking';

Page({
  data: {
    statusBarHeight: 0,
    scopes: RANKING_SCOPES,
    activeScope: '全国榜',
    metrics: RANKING_METRICS,
    activeMetric: '积分',
    expanded: false,
    podium: [] as PodiumPlayer[],
    rows: [] as RankingRow[],
    totalRows: 0,
    myRanking: MY_RANKING,
  },

  onLoad() {
    const app = getApp<IAppOption>();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight });
    this.refresh();
  },

  /** 榜单随「范围 × 指标 × 展开态」三个维度重算 */
  refresh() {
    const { activeScope, activeMetric, expanded } = this.data;
    const players = rankPlayers(activeScope, activeMetric);
    const allRows = toRows(players, activeMetric);

    this.setData({
      podium: toPodium(players, activeMetric),
      rows: expanded ? allRows : allRows.slice(0, COLLAPSED_ROW_COUNT),
      totalRows: allRows.length,
    });
  },

  onScopeTap(event: WechatMiniprogram.TouchEvent) {
    const scope = String(event.currentTarget.dataset.scope);
    if (scope === this.data.activeScope) {
      return;
    }
    // 换榜单时收起列表，避免停留在上一个榜单的展开位置
    this.setData({ activeScope: scope, expanded: false }, () => this.refresh());
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

  onBack() {
    wx.navigateBack();
  },
});
