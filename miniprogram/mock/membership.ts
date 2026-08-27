/**
 * ============================================================================
 * 会员页数据 —— 「我的」点开通会员后看到的套餐
 * ============================================================================
 *
 * 版式来自视觉刷新草稿「会员开通 / V5 / 选套餐」(355:361) 底部结算抽屉。
 * 支付还没接，点「立即支付」只弹提示。
 *
 * 【常见改动】
 * 改套餐名字/价格  → 改 PLANS
 * 改默认选中套餐  → pages/profile/index.ts 的 activePlan
 * 改支付方式文案  → 改 PAY_METHODS
 * 微信支付左侧图标按官方绿底白气泡来画，不要绿线空心泡
 */
export interface MemberPlan {
  key: string;
  name: string;
  /** 角标，如 推荐 / 首月。没有就留空 */
  badge: string;
  price: string;
  /** 划线原价。没有就留空 */
  origin: string;
  recommended?: boolean;
}

export const PLANS: MemberPlan[] = [
  {
    key: 'month',
    name: '连续包月',
    badge: '首月',
    price: '29',
    origin: '39',
  },
  {
    key: 'quarter',
    name: '连续包季',
    badge: '首季',
    price: '79',
    origin: '99',
  },
  {
    key: 'year',
    name: '连续包年',
    badge: '超值',
    price: '199',
    origin: '299',
    recommended: true,
  },
  {
    key: 'yearOnce',
    name: '12个月',
    badge: '一次付清',
    price: '259',
    origin: '299',
  },
];

export const PAY_METHODS = [
  { key: 'wechat', label: '微信支付', mark: '微' },
  { key: 'alipay', label: '支付宝', mark: '支' },
];
