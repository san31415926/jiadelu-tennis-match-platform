import { listRankedPlayers } from '../../api/catalog';
import {
  COLLAPSED_ROW_COUNT,
  MY_RANKING,
  RANKING_METRICS,
  RANKING_SCOPES,
  rankGivenPlayers,
  toPodium,
  toRows,
} from '../../mock/ranking';
import type { PodiumPlayer, RankingRow } from '../../mock/ranking';
import { themeBehavior } from '../../behaviors/theme';
import { switchToEvents } from '../../utils/navigate';

/**
 * ============================================================================
 * 球员排行页逻辑
 * ============================================================================
 * 版式来自终稿 15:2。V5 草稿 228:786 几乎同构图，已去掉波浪头，改 occupy 吸顶栏。
 * 筛选选中色走主题强调色，不要再写死青柠。
 *
 * 【三个状态维度会互相影响】
 *   范围（城市榜/全国榜）→ 决定参与排名的人有哪些
 *   指标（积分/身价/战力）→ 决定按什么排序、显示什么数值
 *   展开态（收起/展开）  → 决定列表显示 3 行还是全部
 *
 * 名单从云库 players 读，排序仍用 rankGivenPlayers()。
 */
Page({
  behaviors: [themeBehavior],
  data: {
    scopes: RANKING_SCOPES,
    /** 默认打开全国榜。改成 '城市榜' 就默认显示同城排名 */
    activeScope: '城市榜',
    metrics: RANKING_METRICS,
    activeMetric: '积分',
    expanded: false,
    podium: [] as PodiumPlayer[],
    rows: [] as RankingRow[],
    totalRows: 0,
    totalCount: 0,
    myRanking: MY_RANKING,
  },

  async onLoad() {
    await getApp<IAppOption>().globalData.cloudBoot;
    this.refresh();
  },

  async refresh() {
    const { activeScope, activeMetric, expanded } = this.data;
    const pool = await listRankedPlayers();
    const players = rankGivenPlayers(pool, activeScope, activeMetric);
    const allRows = toRows(players, activeMetric);

    this.setData({
      podium: toPodium(players, activeMetric),
      rows: expanded ? allRows : allRows.slice(0, COLLAPSED_ROW_COUNT),
      totalRows: allRows.length,
      totalCount: players.length,
    });
  },

  onScopeTap(event: WechatMiniprogram.TouchEvent) {
    const scope = String(event.currentTarget.dataset.scope);
    if (scope === this.data.activeScope) {
      return;
    }
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

  /** 底部条「去参赛」：未上榜就去报名，切回赛事首页 */
  onMineTap() {
    switchToEvents();
  },
});
