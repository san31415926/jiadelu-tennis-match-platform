/**
 * ============================================================================
 * 会员页数据 —— 「我的」页金色横幅点进去看到的权益和套餐
 * ============================================================================
 *
 * 这一页没有终稿设计稿，是按功能清单 3.2 和品牌绿/金自己排的一版，
 * 给你检查用。文案、价格、权益条数都可以改。
 *
 * 【常见改动】
 * 改横幅上的字     → mock/profile.ts 里没有，横幅写在 pages/profile/index.wxml
 * 改权益列表       → 改 BENEFITS
 * 改套餐名字/价格  → 改 PLANS
 * 购买还没接支付，点「立即开通」只弹提示，逻辑在 pages/membership/index.ts
 */
export interface MemberBenefit {
  key: string;
  title: string;
  desc: string;
}

export interface MemberPlan {
  key: string;
  name: string;
  price: string;
  unit: string;
  hint: string;
  recommended?: boolean;
}

export const MEMBER_HERO = {
  kicker: 'LTJIMMY VIP',
  title: '开通会员，解锁超值权益',
  subtitle: '优先报名、积分加速、专属赛事与年会礼遇',
};

export const BENEFITS: MemberBenefit[] = [
  {
    key: 'signup',
    title: '赛事优先报名',
    desc: '热门场次先人一步锁定签位，减少满员遗憾',
  },
  {
    key: 'points',
    title: '积分加速',
    desc: '参赛积分按 1.2 倍计入兑换，兑奖更快到账',
  },
  {
    key: 'events',
    title: '专属赛事',
    desc: '不定期 VIP 内部赛与训练营，仅会员可报',
  },
  {
    key: 'gala',
    title: '年会礼遇',
    desc: '典礼席位预留，抽奖额外增加一次机会',
  },
  {
    key: 'service',
    title: '客服优先',
    desc: '报名、积分、合作问题走加急通道处理',
  },
];

export const PLANS: MemberPlan[] = [
  {
    key: 'quarter',
    name: '季卡',
    price: '99',
    unit: '元 / 90 天',
    hint: '先体验一季',
  },
  {
    key: 'year',
    name: '年卡',
    price: '299',
    unit: '元 / 365 天',
    hint: '相当于每月 25 元',
    recommended: true,
  },
];
