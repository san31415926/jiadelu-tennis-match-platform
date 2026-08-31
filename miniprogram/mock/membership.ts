/**
 * ============================================================================
 * 会员页数据 —— 「我的」点开通选手会员后看到的套餐
 * ============================================================================
 *
 * 版式来自视觉刷新草稿「会员开通 / V5 / 选套餐」(355:361) 底部结算抽屉。
 * 支付还没接：点「立即支付」只弹提示。运营可在后台把 users.memberUntil
 * 写成日期，小程序就会按年度选手会员放行 L-15 / L-25。
 *
 * 豆包方案用 198 元/年选手会员换掉原来的包月/包季/包年 VIP。
 * 年费买的是参赛资格，不是免单站报名费，也不是 L-ID 本身（号登录就发）。
 *
 * 【常见改动】
 * 改价格          → 改 PLANS 里 year 的 price
 * 改抽屉副文案    → pages/profile/index.wxml 开通选手会员那一段
 * 改支付方式文案  → 改 PAY_METHODS
 * 微信支付左侧图标用 Figma 导出的绿底双气泡（assets/icons/pay/wechat.png）
 */
export interface MemberPlan {
  key: string;
  name: string;
  /** 角标，如 推荐。没有就留空 */
  badge: string;
  price: string;
  /** 划线原价。没有就留空 */
  origin: string;
  recommended?: boolean;
}

export const PLANS: MemberPlan[] = [
  {
    key: 'year',
    name: '选手年费',
    badge: 'L-15',
    price: '198',
    origin: '',
    recommended: true,
  },
];

export const PAY_METHODS = [
  { key: 'wechat', label: '微信支付', mark: '微' },
  { key: 'alipay', label: '支付宝', mark: '支' },
];
