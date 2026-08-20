import { CLUB_FILTERS, CLUB_LIST, CLUB_SUMMARY, type ClubItem } from '../../mock/club';

Page({
  data: {
    statusBarHeight: 0,
    summary: CLUB_SUMMARY,
    filters: CLUB_FILTERS,
    activeFilter: '全部',
    keyword: '',
    clubs: CLUB_LIST as ClubItem[],
  },

  onLoad() {
    const app = getApp<IAppOption>();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight });
  },

  /** 关键词在本地过滤；接入云开发后改为服务端搜索 */
  applyFilters(keyword: string) {
    const trimmed = keyword.trim();
    const clubs = trimmed
      ? CLUB_LIST.filter((club) => club.name.includes(trimmed))
      : CLUB_LIST;
    this.setData({ keyword, clubs });
  },

  onKeywordInput(event: WechatMiniprogram.Input) {
    this.applyFilters(event.detail.value);
  },

  onFilterTap(event: WechatMiniprogram.TouchEvent) {
    const filter = String(event.currentTarget.dataset.filter);
    if (filter === this.data.activeFilter) {
      return;
    }
    this.setData({ activeFilter: filter });
    wx.showToast({ title: `${filter} 筛选待接入云开发`, icon: 'none' });
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
