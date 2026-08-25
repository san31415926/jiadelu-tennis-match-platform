/**
 * ============================================================================
 * 报名页逻辑
 * ============================================================================
 *
 * 从赛事详情「立即报名 / 报名参赛」进来。路径 ?id= 对应 mock/event-detail.ts。
 * 五个画板收成这一页的 data 状态，不要各写一页：
 *   369:359 选方式·单人 / 369:559 组队 / 369:770 无队伍
 *   370:359 报名详情 / 371:371 报名详情·组队
 *
 * step = mode | detail，mode = 单人 | 组队，hasTeam 控制有没有搭档。
 * 组队不是约球匹配：没有搭档就去详情页组队 Tab，不生成对阵。
 *
 * 去支付只 toast「待接入云开发」，不要接微信支付。
 */
import {
  getEventDetail,
  SIGNUP_PARTNER,
  SIGNUP_SELF,
} from '../../mock/event-detail';
import type { EventDetail, SignupPerson } from '../../mock/event-detail';

type SignupStep = 'mode' | 'detail';
type SignupMode = '单人' | '组队';

function feeNumber(fee: string): string {
  const hit = fee.match(/\d+/);
  return hit ? hit[0] : '108';
}

Page({
  data: {
    statusBarHeight: 0,
    event: getEventDetail('e-open-1') as EventDetail,
    step: 'mode' as SignupStep,
    mode: '单人' as SignupMode,
    hasTeam: true,
    self: SIGNUP_SELF as SignupPerson,
    partner: SIGNUP_PARTNER as SignupPerson,
    payLabel: '去支付  ¥108',
  },

  onLoad(query: Record<string, string | undefined>) {
    const app = getApp<IAppOption>();
    const event = getEventDetail(query.id ?? '');
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      event,
      payLabel: `去支付  ¥${feeNumber(event.fee)}`,
    });
  },

  onPickMode(event: WechatMiniprogram.TouchEvent) {
    const mode = String(event.currentTarget.dataset.mode) as SignupMode;
    this.setData({
      mode,
      hasTeam: mode === '组队' ? this.data.hasTeam : true,
    });
  },

  onClearTeam() {
    this.setData({ hasTeam: false });
  },

  onRestoreTeam() {
    this.setData({ hasTeam: true });
  },

  onGoTeam() {
    wx.redirectTo({
      url: `/pages/event-detail/index?id=${this.data.event.id}&tab=team`,
    });
  },

  onConfirmMode() {
    if (this.data.mode === '组队' && !this.data.hasTeam) {
      wx.showToast({ title: '请先完成组队招募', icon: 'none' });
      return;
    }
    this.setData({ step: 'detail' });
  },

  onPay() {
    wx.showToast({ title: '待接入云开发', icon: 'none' });
  },
});
