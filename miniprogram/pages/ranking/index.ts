import {
  MY_RANKING,
  PODIUM,
  RANKING_METRICS,
  RANKING_ROWS,
  RANKING_SCOPES,
} from '../../mock/ranking';

Page({
  data: {
    statusBarHeight: 0,
    scopes: RANKING_SCOPES,
    activeScope: '全国榜',
    metrics: RANKING_METRICS,
    activeMetric: '积分',
    podium: PODIUM,
    rows: RANKING_ROWS,
    myRanking: MY_RANKING,
  },

  onLoad() {
    const app = getApp<IAppOption>();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight });
  },

  onScopeTap(event: WechatMiniprogram.TouchEvent) {
    const scope = String(event.currentTarget.dataset.scope);
    if (scope !== this.data.activeScope) {
      this.setData({ activeScope: scope });
    }
  },

  onMetricTap(event: WechatMiniprogram.TouchEvent) {
    const metric = String(event.currentTarget.dataset.metric);
    if (metric !== this.data.activeMetric) {
      this.setData({ activeMetric: metric });
    }
  },

  onShowMore() {
    wx.showToast({ title: 'TOP50 数据待接入云开发', icon: 'none' });
  },

  onBack() {
    wx.navigateBack();
  },
});
