/**
 * ============================================================================
 * 会员开通页逻辑
 * ============================================================================
 *
 * 从「我的」页金色横幅的「开通会员」进来。权益和套餐在 mock/membership.ts。
 * 这一版是给检查用的页面，支付还没接，点立即开通只弹提示。
 *
 * 想改默认选中的套餐 → 改 data 里的 activePlan（填 PLANS 某一项的 key）
 */
import { BENEFITS, MEMBER_HERO, PLANS } from '../../mock/membership';

Page({
  data: {
    statusBarHeight: 0,
    hero: MEMBER_HERO,
    benefits: BENEFITS,
    plans: PLANS,
    activePlan: 'year',
  },

  onLoad() {
    const app = getApp<IAppOption>();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight });
  },

  onSelectPlan(event: WechatMiniprogram.TouchEvent) {
    const key = String(event.currentTarget.dataset.key);
    if (key === this.data.activePlan) {
      return;
    }
    this.setData({ activePlan: key });
  },

  onCheckout() {
    const plan = PLANS.find((item) => item.key === this.data.activePlan);
    wx.showToast({
      title: plan ? `${plan.name}购买待接入支付` : '购买待接入支付',
      icon: 'none',
    });
  },
});
