import { EVENT_FILTERS } from '../../mock/home';
import type { EventItem } from '../../mock/home';
import {
  SUPER_CUP_BANNERS,
  SUPER_CUP_CLUB_CENTER,
  SUPER_CUP_EVENT_TYPES,
  SUPER_CUP_EVENTS,
  SUPER_CUP_FEED_TITLES,
  SUPER_CUP_HONORS,
} from '../../mock/super-cup';
import type { SuperCupFeature } from '../../mock/super-cup';
import { headerMetrics } from '../../utils/header';
import { venueIdByEventId } from '../../mock/venue';
import { navigateToEventDetail, navigateToPage } from '../../utils/navigate';
import { syncTabBarSelected } from '../../utils/tabbar';
import { themeBehavior } from '../../behaviors/theme';

const DEFAULT_FILTER = '报名中';
const LOGIN_REQUIRED_FILTER = '我的报名';

/** Cover Flow 默认停在中间那张：超级杯、俱乐部榜单 */
const DEFAULT_EVENT_TYPE_INDEX = 1;
const DEFAULT_HONOR_INDEX = 1;

type CoverRole = 'current' | 'prev' | 'next' | 'side';

interface CoverItem extends SuperCupFeature {
  role: CoverRole;
}

/**
 * 给每张 Cover Flow 卡标上角色，样式才能区分「中间大 / 左侧小 / 右侧小」。
 * 循环 sliders 里，当前项的前一张永远是 prev、后一张永远是 next。
 */
function withCoverRoles(items: SuperCupFeature[], current: number): CoverItem[] {
  const total = items.length;
  return items.map((item, index) => {
    let role: CoverRole = 'side';
    if (index === current) {
      role = 'current';
    } else if (index === (current - 1 + total) % total) {
      role = 'prev';
    } else if (index === (current + 1) % total) {
      role = 'next';
    }
    return { ...item, role };
  });
}

function feedTitleOf(filter: string): string {
  return SUPER_CUP_FEED_TITLES[filter] || '俱乐部赛';
}

/**
 * ============================================================================
 * 超级杯页逻辑 —— 视觉刷新草稿 V5（Figma 230:158）
 * ============================================================================
 *
 * 【这个文件负责什么】
 * 顶栏字标、头图叠字、两组 Cover Flow、俱乐部中心按钮、胶囊筛选、赛事卡。
 * 文案和路径都在 mock/super-cup.ts。顶栏自己画，换色挂 themeBehavior。
 *
 * 【Cover Flow】
 * 横滑切换当前项（中间放大、两侧缩小）。点卡片走 SUPER_CUP_FEATURES 的 path，
 * 和旧宫格同一套跳转（海报 / 榜单 / 俱乐部）。「查看全部」弹出该组全部入口。
 *
 * 【筛选】
 * 仍是 我的报名 / 报名中 / 进行中 / 已结束。「我的报名」的登录判断和首页一致。
 */
Page({
  behaviors: [themeBehavior],
  data: {
    statusBarHeight: 0,
    navBarHeight: 44,
    menuInsetRight: 96,
    banners: SUPER_CUP_BANNERS,
    currentBanner: 0,
    eventTypes: withCoverRoles(SUPER_CUP_EVENT_TYPES, DEFAULT_EVENT_TYPE_INDEX),
    eventTypeIndex: DEFAULT_EVENT_TYPE_INDEX,
    honors: withCoverRoles(SUPER_CUP_HONORS, DEFAULT_HONOR_INDEX),
    honorIndex: DEFAULT_HONOR_INDEX,
    clubCenterPath: SUPER_CUP_CLUB_CENTER.path,
    filters: EVENT_FILTERS,
    activeFilter: DEFAULT_FILTER,
    feedTitle: feedTitleOf(DEFAULT_FILTER),
    events: [] as EventItem[],
    emptyHint: '该分类下暂无赛事',
    /** 离开本页时藏掉 fixed 顶栏，避免挡住下一页左上角「返回」 */
    pageHidden: false,
  },

  onLoad() {
    this.setData(headerMetrics());
    this.applyFilter(DEFAULT_FILTER);
  },

  onShow() {
    this.setData({ pageHidden: false });
    syncTabBarSelected(this, 1);
    if (this.data.activeFilter === LOGIN_REQUIRED_FILTER) {
      this.applyFilter(LOGIN_REQUIRED_FILTER);
    }
  },

  onHide() {
    this.setData({ pageHidden: true });
  },

  /** 「我的报名」依赖登录态，未登录时列表为空并提示登录 */
  applyFilter(filter: string) {
    const isLoggedIn = getApp<IAppOption>().globalData.isLoggedIn;
    const needLogin = filter === LOGIN_REQUIRED_FILTER && !isLoggedIn;

    this.setData({
      activeFilter: filter,
      feedTitle: feedTitleOf(filter),
      events: needLogin ? [] : SUPER_CUP_EVENTS[filter] ?? [],
      emptyHint: needLogin ? '登录后查看你报名的赛事' : '该分类下暂无赛事',
    });
  },

  onSwiperChange(event: WechatMiniprogram.SwiperChange) {
    this.setData({ currentBanner: event.detail.current });
  },

  onBannerTap(event: WechatMiniprogram.TouchEvent) {
    const banner = SUPER_CUP_BANNERS[Number(event.currentTarget.dataset.index)];
    if (banner) {
      navigateToPage(banner.target);
    }
  },

  onEventTypeChange(event: WechatMiniprogram.SwiperChange) {
    const index = event.detail.current;
    this.setData({
      eventTypeIndex: index,
      eventTypes: withCoverRoles(SUPER_CUP_EVENT_TYPES, index),
    });
  },

  onHonorChange(event: WechatMiniprogram.SwiperChange) {
    const index = event.detail.current;
    this.setData({
      honorIndex: index,
      honors: withCoverRoles(SUPER_CUP_HONORS, index),
    });
  },

  onCoverTap(event: WechatMiniprogram.TouchEvent) {
    navigateToPage(String(event.currentTarget.dataset.path));
  },

  /** 「查看全部」列出该组全部入口，点哪项就走哪项的 path */
  onViewAllEventTypes() {
    this.openFeatureSheet(SUPER_CUP_EVENT_TYPES);
  },

  onViewAllHonors() {
    this.openFeatureSheet(SUPER_CUP_HONORS);
  },

  openFeatureSheet(items: SuperCupFeature[]) {
    wx.showActionSheet({
      itemList: items.map((item) => item.label),
      success: (res) => {
        const target = items[res.tapIndex];
        if (target) {
          navigateToPage(target.path);
        }
      },
    });
  },

  onClubCenterTap() {
    navigateToPage(this.data.clubCenterPath);
  },

  onFilterChange(event: WechatMiniprogram.CustomEvent<{ tab: string }>) {
    this.applyFilter(event.detail.tab);
  },

  onEventTap(event: WechatMiniprogram.CustomEvent<{ id?: string }>) {
    navigateToEventDetail(event.detail.id);
  },

  onVenueTap(event: WechatMiniprogram.CustomEvent<{ id?: string }>) {
    navigateToPage(`/pages/venue/index?id=${venueIdByEventId(event.detail.id)}`);
  },
});
