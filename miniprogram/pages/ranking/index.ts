import { listRankedPlayers } from '../../api/catalog';
import { readSession } from '../../api/auth';
import {
  COLLAPSED_ROW_COUNT,
  CURRENT_CITY,
  RANKING_METRICS,
  RANKING_SCOPES,
  myRankingOf,
  rankGivenPlayers,
  toPodium,
  toRows,
} from '../../mock/ranking';
import type { PodiumPlayer, RankedPlayer, RankingRow } from '../../mock/ranking';
import { themeBehavior } from '../../behaviors/theme';
import { switchToEvents } from '../../utils/navigate';
import { rawUid } from '../../utils/player-id';

/**
 * ============================================================================
 * 球员排行页逻辑
 * ============================================================================
 * 版式来自终稿 15:2。V5 草稿 228:786 几乎同构图，已去掉波浪头，改 occupy 吸顶栏。
 * 筛选选中色走主题强调色，不要再写死青柠。
 *
 * 名单从云库 players 读，底部「我的排名」按当前登录用户现算。
 * 城市榜用资料里的城市，没有才退回广州。
 */

function viewerPlayer(): RankedPlayer | null {
  const session = readSession();
  if (!session) {
    return null;
  }
  const uid = rawUid(String(session.uid || ''));
  const digits = (value: string) => Number(String(value || '').replace(/[^\d]/g, '')) || 0;
  return {
    id: uid,
    nickname: session.nickname,
    club: session.club || '个人',
    badge: session.level && session.level !== '--' ? session.level : '',
    avatar: session.avatar,
    city: session.city || CURRENT_CITY,
    points: digits(session.points),
    marketValue: digits(session.marketValue),
    power: Number((session as { power?: number }).power || 0),
  };
}

function withViewer(pool: RankedPlayer[]): RankedPlayer[] {
  const me = viewerPlayer();
  if (!me) {
    return pool;
  }
  if (pool.some((player) => player.nickname === me.nickname || player.id === me.id)) {
    return pool;
  }
  return pool.concat([me]);
}

Page({
  behaviors: [themeBehavior],
  data: {
    scopes: RANKING_SCOPES,
    activeScope: '城市榜',
    metrics: RANKING_METRICS,
    activeMetric: '积分',
    expanded: false,
    podium: [] as PodiumPlayer[],
    rows: [] as RankingRow[],
    totalRows: 0,
    totalCount: 0,
    myRanking: myRankingOf([], '积分'),
  },

  async onLoad() {
    await getApp<IAppOption>().globalData.cloudBoot;
    this.refresh();
  },

  async refresh() {
    const { activeScope, activeMetric, expanded } = this.data;
    const me = viewerPlayer();
    const pool = withViewer(await listRankedPlayers());
    const players = rankGivenPlayers(pool, activeScope, activeMetric, me ? me.city : CURRENT_CITY);
    const allRows = toRows(players, activeMetric);

    this.setData({
      podium: toPodium(players, activeMetric),
      rows: expanded ? allRows : allRows.slice(0, COLLAPSED_ROW_COUNT),
      totalRows: allRows.length,
      totalCount: players.length,
      myRanking: myRankingOf(players, activeMetric, me),
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

  onMineTap() {
    switchToEvents();
  },
});
