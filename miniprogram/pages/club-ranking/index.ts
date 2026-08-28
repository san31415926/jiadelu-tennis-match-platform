import { getMyClub, listRankedClubs, myClubBoard } from '../../api/catalog';
import {
  COLLAPSED_ROW_COUNT,
  CLUB_RANKING_METRICS,
  CLUB_RANKING_PERIODS,
  rankGivenClubs,
  toClubPodium,
  toClubRows,
} from '../../mock/club-ranking';
import type { ClubPodiumPlayer, ClubRankingRow } from '../../mock/club-ranking';
import { navigateToPage } from '../../utils/navigate';
import { themeBehavior } from '../../behaviors/theme';

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
 * 名单从云库 clubs 读，排序仍用 rankGivenClubs()。
 * 波浪头已去掉，occupy 吸顶栏。本月 / 累计选中走主题强调色。
 */
Page({
  behaviors: [themeBehavior],
  data: {
    periods: CLUB_RANKING_PERIODS,
    activePeriod: '本月',
    metrics: CLUB_RANKING_METRICS,
    activeMetric: '积分',
    expanded: false,
    podium: [] as ClubPodiumPlayer[],
    rows: [] as ClubRankingRow[],
    totalRows: 0,
    totalCount: 0,
    myRanking: { summary: '', actionText: '', clubId: '' },
  },

  async onLoad() {
    await getApp<IAppOption>().globalData.cloudBoot;
    this.refresh();
  },

  async refresh() {
    const { activeMetric, activePeriod, expanded } = this.data;
    try {
      const pool = await listRankedClubs();
      const clubs = rankGivenClubs(pool, activeMetric, activePeriod);
      const allRows = toClubRows(clubs, activeMetric, activePeriod);
      const isLoggedIn = getApp<IAppOption>().globalData.isLoggedIn;
      const mine = isLoggedIn ? await getMyClub() : undefined;

      this.setData({
        podium: toClubPodium(clubs, activeMetric, activePeriod),
        rows: expanded ? allRows : allRows.slice(0, COLLAPSED_ROW_COUNT),
        totalRows: allRows.length,
        totalCount: clubs.length,
        myRanking:
          isLoggedIn && mine
            ? myClubBoard(clubs, mine.id, activeMetric, activePeriod)
            : { summary: '', actionText: '', clubId: '' },
      });
    } catch (error) {
      console.warn('读俱乐部榜失败', error);
      this.setData({
        podium: toClubPodium([], activeMetric, activePeriod),
        rows: [],
        totalRows: 0,
        totalCount: 0,
        myRanking: { summary: '', actionText: '', clubId: '' },
      });
    }
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
    if (!id) {
      return;
    }
    navigateToPage(`/pages/club-home/index?id=${id}&from=super-cup`);
  },
});
