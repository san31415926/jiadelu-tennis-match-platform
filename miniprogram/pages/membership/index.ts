/**
 * ============================================================================
 * 会员开通页逻辑
 * ============================================================================
 *
 * 从「我的」页「开通会员」进来。套餐在 mock/membership.ts。
 * 版式是视觉刷新草稿 355:361 那张底部结算抽屉，支付还没接。
 *
 * 想改默认选中的套餐 → 改 data 里的 activePlan（填 PLANS 某一项的 key）
 */
import { PAY_METHODS, PLANS } from '../../mock/membership';

Page({
  data: {
    plans: PLANS,
    payMethods: PAY_METHODS,
    activePlan: 'year',
    activePay: 'wechat',
    payLabel: '立即支付 ¥199',
    saveHint: '立省 100 元',
  },

  onLoad() {
    this.syncPayCopy('year');
  },

  syncPayCopy(planKey: string) {
    const plan = PLANS.find((item) => item.key === planKey);
    const origin = plan ? Number(plan.origin) : 0;
    const price = plan ? Number(plan.price) : 0;
    const saved = origin > price ? origin - price : 0;
    this.setData({
      payLabel: plan ? `立即支付 ¥${plan.price}` : '立即支付',
      saveHint: saved > 0 ? `立省 ${saved} 元` : '',
    });
  },

  onSelectPlan(event: WechatMiniprogram.TouchEvent) {
    const key = String(event.currentTarget.dataset.key);
    if (key === this.data.activePlan) {
      return;
    }
    this.setData({ activePlan: key });
    this.syncPayCopy(key);
  },

  onSelectPay(event: WechatMiniprogram.TouchEvent) {
    const key = String(event.currentTarget.dataset.key);
    this.setData({ activePay: key });
  },

  onCheckout() {
    const plan = PLANS.find((item) => item.key === this.data.activePlan);
    wx.showToast({
      title: plan ? `${plan.name}购买待接入支付` : '购买待接入支付',
      icon: 'none',
    });
  },
});
