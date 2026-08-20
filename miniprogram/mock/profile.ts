/**
 * ============================================================================
 * 我的页数据 —— 球员卡与功能菜单
 * ============================================================================
 *
 * 【两套数据的作用】
 * MOCK_PROFILE  = 已登录的示例资料，用来预览设计稿的完整效果
 * GUEST_PROFILE = 未登录/未评级状态，所有数值是占位符
 *
 * 设计稿只画了已登录的样子，但功能清单要求「未评级显示 --」「默认昵称微信用户」，
 * 所以补了 GUEST_PROFILE。两套数据字段完全一样，页面布局不用改，只是换数据。
 *
 * 【常见改动】
 * 想改菜单项名字/顺序 → 改 PROFILE_MENU，数组顺序就是显示顺序
 * 想加菜单项           → 往 PROFILE_MENU 里加，列表会自动变长（不是固定高度）
 * 想改示例资料         → 改 MOCK_PROFILE
 * 想改未登录时的文案   → 改 GUEST_PROFILE
 */

/** 我的页功能菜单的一项 */
export interface ProfileMenuItem {
  key: string;
  /** 菜单文字，36rpx */
  label: string;
  /** 左侧的 3D 图标，显示为 88×88 */
  icon: string;
  /** 点击跳转的页面。这些页面都还没做，所以点了会弹提示 */
  path: string;
  /**
   * 是否需要水平翻转图标。
   *
   * 设计稿里「商务合作」的握手图标和「关于我们」的头像图标做了水平镜像
   * （Figma 里叫 scale-y -100 + rotate 180，效果等于左右翻转）。
   * 导出的图片是翻转前的原图，所以要靠 CSS 的 transform: scaleX(-1) 补回来。
   *
   * 想看翻转前后的区别，把这个字段改成 false 对比一下就知道了。
   */
  mirrored?: boolean;
}

/** 球员卡上的各项数值。注意都是字符串，因为要能显示 -- 这种占位符 */
export interface ProfileSummary {
  /** 昵称。设计只给了 99rpx 宽（示例昵称是一个字「帆」），过长会截断成省略号 */
  nickname: string;
  /** 评分胶囊里的文字，如「评分 5.0」或「未评级」 */
  rating: string;
  /** 等级胶囊，如「Lv.18」或「Lv.--」 */
  level: string;
  /** 身价，如「¥12,800」或「--」 */
  marketValue: string;
  /** 身价涨幅，如「↑ 6.7%」。留空字符串则整个涨幅文字不显示 */
  marketValueTrend: string;
  /** 积分 */
  points: string;
  /** 进度条上方的提示，如「距 Lv.19 还差 320 XP」 */
  xpHint: string;
  /**
   * 经验进度百分比，0~100。
   *
   * 设计稿里进度条填充 377rpx、总长 690rpx，换算出来约 54.6%。
   * 页面会用它算出填充宽度，并把那个小网球放在填充的末端。
   * 改成 0 → 进度条全空，小球贴在最左边
   * 改成 100 → 进度条全满，小球到最右边
   */
  xpPercent: number;
}

/**
 * 未登录 / 未评级状态。设计稿只画了已登录态，这里沿用同一套布局，
 * 只把数值换成占位符，符合功能清单「未评级显示 --」「默认昵称微信用户」的要求。
 */
export const GUEST_PROFILE: ProfileSummary = {
  nickname: '微信用户',
  rating: '未评级',
  level: 'Lv.--',
  marketValue: '--',
  marketValueTrend: '',
  points: '--',
  xpHint: '完成首场比赛后开启等级',
  xpPercent: 0,
};

export const MOCK_PROFILE: ProfileSummary = {
  nickname: '帆',
  rating: '评分 5.0',
  level: 'Lv.18',
  marketValue: '¥12,800',
  marketValueTrend: '↑ 6.7%',
  points: '1650',
  xpHint: '距 Lv.19 还差 320 XP',
  xpPercent: 54.6,
};

export const PROFILE_MENU: ProfileMenuItem[] = [
  {
    key: 'profile',
    label: '我的资料',
    icon: '/assets/icons/profile/profile-info.png',
    path: '/pages/profile-edit/index',
  },
  {
    key: 'business',
    label: '商务合作',
    icon: '/assets/icons/profile/business-handshake.png',
    path: '/pages/business/index',
    mirrored: true,
  },
  {
    key: 'about',
    label: '关于我们',
    icon: '/assets/icons/profile/about-us.png',
    path: '/pages/about/index',
    mirrored: true,
  },
  {
    key: 'club',
    label: '我的俱乐部',
    icon: '/assets/icons/profile/my-club-flag.png',
    path: '/pages/clubs/index',
  },
  {
    key: 'records',
    label: '参赛记录',
    icon: '/assets/icons/profile/records-trophy.png',
    path: '/pages/records/index',
  },
  {
    key: 'service',
    label: '联系客服',
    icon: '/assets/icons/profile/customer-service.png',
    path: '/pages/service/index',
  },
];
