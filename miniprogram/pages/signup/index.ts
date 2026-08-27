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
 * 单打场（isSinglesEvent）跳过「选择参赛方式」，直接进报名详情，没有组队选项。
 * 双打场才出现单人 / 组队两颗按钮。组队不是约球匹配：没有搭档就去详情页组队 Tab。
 *
 * 去支付会写入 registrations，不接微信支付。
 * 吸顶栏 occupy 打开，不要再垫波浪头。
 */
import { SIGNUP_PARTNER, SIGNUP_SELF } from '../../mock/event-detail';
import type { EventDetail, SignupPerson } from '../../mock/event-detail';
import { loadEventDetail, submitRegistration } from '../../api/events';
import { readSession } from '../../api/auth';
import { isSinglesEvent } from '../../mock/home';
import { themeBehavior } from '../../behaviors/theme';

type SignupStep = 'mode' | 'detail';
type SignupMode = '单人' | '组队';

function selfFromSession(): SignupPerson {
  const session = readSession();
  if (!session) {
    return SIGNUP_SELF;
  }
  return {
    name: session.nickname || SIGNUP_SELF.name,
    avatar: session.avatar || SIGNUP_SELF.avatar,
    uid: session.uid.replace(/^UID\s*/, '') || SIGNUP_SELF.uid,
    hand: session.hand && session.hand !== '--' ? session.hand : SIGNUP_SELF.hand,
    rating: session.rating && session.rating !== '--' ? session.rating : SIGNUP_SELF.rating,
  };
}

function feeNumber(fee: string): string {
  const hit = fee.match(/\d+/);
  return hit ? hit[0] : '108';
}

Page({
  behaviors: [themeBehavior],
  data: {
    event: {} as EventDetail,
    step: 'mode' as SignupStep,
    mode: '单人' as SignupMode,
    hasTeam: true,
    self: SIGNUP_SELF as SignupPerson,
    partner: SIGNUP_PARTNER as SignupPerson,
    payLabel: '去支付  ¥108',
    /** 双打才显示「选择参赛方式」。单打直接进报名详情。 */
    allowTeam: true,
  },

  onLoad(query: Record<string, string | undefined>) {
    const boot = getApp<IAppOption>().globalData.cloudBoot || Promise.resolve();
    boot.then(() =>
      loadEventDetail(query.id ?? '').then((event) => {
        const allowTeam = !isSinglesEvent(event);
        this.setData({
          event,
          allowTeam,
          step: allowTeam ? 'mode' : 'detail',
          mode: '单人',
          self: selfFromSession(),
          payLabel: `去支付  ¥${feeNumber(event.fee)}`,
        });
      }),
    );
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
    const app = getApp<IAppOption>();
    if (!app.globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    submitRegistration({
      eventId: this.data.event.id,
      mode: this.data.mode,
      partnerUid: this.data.mode === '组队' ? this.data.partner.uid : '',
    })
      .then((res) => {
        wx.showToast({
          title: res.duplicated ? '已经报名过这场' : '报名已提交（支付待开通）',
          icon: 'none',
        });
      })
      .catch((error: { message?: string }) => {
        wx.showToast({
          title: (error && error.message) || '报名失败',
          icon: 'none',
        });
      });
  },
});
