import {
  CLUB_FILTERS,
  CLUB_LIST,
  CLUB_SUMMARY,
  filterClubs,
} from '../../mock/club';
import type { ClubItem } from '../../mock/club';
import { navigateToPage } from '../../utils/navigate';

/**
 * ============================================================================
 * 俱乐部页逻辑
 * ============================================================================
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
  data: {
    statusBarHeight: 0,
    summary: CLUB_SUMMARY,
    filters: CLUB_FILTERS,
    activeFilter: '全部',
    keyword: '',
    clubs: [] as ClubItem[],
  },

  onLoad() {
    const app = getApp<IAppOption>();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      clubs: filterClubs('全部', ''),
    });
  },

  /** 筛选与关键词叠加生效；接入云开发后改为服务端查询 */
  apply(filter: string, keyword: string) {
    this.setData({
      activeFilter: filter,
      keyword,
      clubs: filterClubs(filter, keyword),
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
    const id = String(event.currentTarget.dataset.id);
    const club = CLUB_LIST.find((item) => item.id === id);
    wx.showToast({
      title: club?.joined ? '你已经是该俱乐部成员' : '申请流程待接入云开发',
      icon: 'none',
    });
  },

  onCreateClub() {
    wx.showToast({ title: '创建俱乐部待接入云开发', icon: 'none' });
  },
});
