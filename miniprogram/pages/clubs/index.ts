import {
  CLUB_FILTERS,
  CLUB_LIST,
  CLUB_SUMMARY,
  clubsForViewer,
  filterClubs,
} from '../../mock/club';
import type { ClubItem } from '../../mock/club';
import { navigateToPage } from '../../utils/navigate';
import { themeBehavior } from '../../behaviors/theme';

/**
 * ============================================================================
 * 俱乐部页逻辑
 * ============================================================================
 *
 * 版式来自终稿俱乐部列表。V5 草稿 228:310 几乎同构图，已去掉波浪头、旗子、椭圆，
 * 改 occupy 吸顶栏。申请加入 / 创建俱乐部 / 筛选选中走主题强调色。
 * 「已加入」只在登录后出现；未登录当俱乐部中心逛，不会显示已经加入任何一家。
 *
 * 【筛选和搜索是叠加的】
 * 所以两个交互都调同一个 apply(filter, keyword) 方法，把两个条件一起传给
 * filterClubs()。如果分开处理，会出现"选了同城再搜索，同城条件被冲掉"的 bug。
 *
 * 【搜索是实时的】
 * 用的是 bindinput（每输入一个字就触发），不是 confirm（按回车才触发）。
 * 数据量大时可能需要加防抖，但本地过滤六条数据不用担心性能。
 */
Page({
  behaviors: [themeBehavior],
  data: {
    summary: CLUB_SUMMARY,
    filters: CLUB_FILTERS,
    activeFilter: '全部',
    keyword: '',
    clubs: [] as ClubItem[],
  },

  onLoad() {
    this.refreshList();
  },

  onShow() {
    this.refreshList();
  },

  refreshList() {
    const isLoggedIn = getApp<IAppOption>().globalData.isLoggedIn;
    this.setData({
      clubs: clubsForViewer(
        filterClubs(this.data.activeFilter || '全部', this.data.keyword || ''),
        isLoggedIn,
      ),
    });
  },

  /** 筛选与关键词叠加生效；接入云开发后改为服务端查询 */
  apply(filter: string, keyword: string) {
    const isLoggedIn = getApp<IAppOption>().globalData.isLoggedIn;
    this.setData({
      activeFilter: filter,
      keyword,
      clubs: clubsForViewer(filterClubs(filter, keyword), isLoggedIn),
    });
  },

  onKeywordInput(event: WechatMiniprogram.Input) {
    this.apply(this.data.activeFilter, event.detail.value);
  },

  onFilterTap(event: WechatMiniprogram.TouchEvent) {
    const filter = String(event.currentTarget.dataset.filter);
    if (filter === this.data.activeFilter) {
      return;
    }
    this.apply(filter, this.data.keyword);
  },

  onClubTap(event: WechatMiniprogram.TouchEvent) {
    const id = String(event.currentTarget.dataset.id);
    navigateToPage(`/pages/club-home/index?id=${id}`);
  },

  onJoinTap(event: WechatMiniprogram.TouchEvent) {
    if (!getApp<IAppOption>().globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    const id = String(event.currentTarget.dataset.id);
    const club = CLUB_LIST.find((item) => item.id === id);
    wx.showToast({
      title: club?.joined ? '你已经是该俱乐部成员' : '申请流程待接入云开发',
      icon: 'none',
    });
  },

  onCreateClub() {
    if (!getApp<IAppOption>().globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.showToast({ title: '创建俱乐部待接入云开发', icon: 'none' });
  },
});
