import { createClub, joinClub, listClubs } from '../../api/catalog';
import { readSession } from '../../api/auth';
import { CLUB_FILTERS, CLUB_SUMMARY } from '../../mock/club';
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
 * 列表从 api/catalog.ts 读云库 clubs，筛选仍在本地叠加（同城 / 招新 / 搜索）。
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

  async onLoad() {
    await getApp<IAppOption>().globalData.cloudBoot;
    this.refreshList();
  },

  onShow() {
    this.refreshList();
  },

  async refreshList() {
    const clubs = await listClubs(
      this.data.activeFilter || '全部',
      this.data.keyword || '',
    );
    this.setData({ clubs });
  },

  /** 筛选与关键词叠加生效 */
  apply(filter: string, keyword: string) {
    this.setData({ activeFilter: filter, keyword }, () => this.refreshList());
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

  async onJoinTap(event: WechatMiniprogram.TouchEvent) {
    if (!getApp<IAppOption>().globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    const id = String(event.currentTarget.dataset.id);
    const club = this.data.clubs.find((item) => item.id === id);
    if (club?.joined) {
      wx.showToast({ title: '你已经是该俱乐部成员', icon: 'none' });
      return;
    }
    try {
      wx.showLoading({ title: '提交中', mask: true });
      const res = await joinClub(id);
      wx.hideLoading();
      wx.showToast({
        title: res.already ? '你已经是该俱乐部成员' : '已加入',
        icon: 'none',
      });
      this.refreshList();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error instanceof Error ? error.message : '加入失败',
        icon: 'none',
      });
    }
  },

  onCreateClub() {
    if (!getApp<IAppOption>().globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '创建俱乐部',
      editable: true,
      placeholderText: '俱乐部名称',
      success: (res) => {
        if (!res.confirm) {
          return;
        }
        const name = String(res.content || '').trim();
        if (!name) {
          wx.showToast({ title: '请填写名称', icon: 'none' });
          return;
        }
        const city = readSession()?.city || '';
        wx.showLoading({ title: '创建中', mask: true });
        createClub(name, city)
          .then((created) => {
            wx.hideLoading();
            wx.showToast({ title: '已创建', icon: 'success' });
            navigateToPage(`/pages/club-home/index?id=${created.clubId}`);
          })
          .catch((error: unknown) => {
            wx.hideLoading();
            wx.showToast({
              title: error instanceof Error ? error.message : '创建失败',
              icon: 'none',
            });
          });
      },
    });
  },
});
