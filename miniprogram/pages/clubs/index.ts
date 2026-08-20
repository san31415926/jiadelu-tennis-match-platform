import {
  CLUB_FILTERS,
  CLUB_LIST,
  CLUB_SUMMARY,
  filterClubs,
  type ClubItem,
} from '../../mock/club';

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

  onClubTap() {
    wx.showToast({ title: '俱乐部主页待设计', icon: 'none' });
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

  onBack() {
    wx.navigateBack();
  },
});
