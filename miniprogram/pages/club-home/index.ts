/**
 * ============================================================================
 * 俱乐部主页逻辑
 * ============================================================================
 *
 * 从俱乐部列表点某一行进来。路径带 ?id=club-4。
 * id 对不上就 toast，不要落到示例第一家。
 *
 * 两个来源共用这一页，不要复制第二套页面：
 *   默认（俱乐部列表）     草稿 444:36：三列 总战力 / 成员 / 战力榜
 *   ?from=super-cup       V5 287:374：四列 本月积分 / 总战力 / 积分榜 / 战力榜，
 *                         头部换成会所插画
 *
 * 申请加入走 clubAction 云函数，写入 club_members。
 * 成员人数按名单实数，已加入的自己会排进列表，不要再用种子里的 24。
 * 未登录看任何一家都是「申请加入」。
 */
import { clubHomeStats, joinClub, loadClubHome } from '../../api/catalog';
import { withViewerJoinState } from '../../mock/club';
import type { ClubItem, ClubMember } from '../../mock/club';
import { themeBehavior } from '../../behaviors/theme';

interface ClubStat {
  value: string;
  label: string;
  lime?: boolean;
}

Page({
  behaviors: [themeBehavior],
  data: {
    fromSuperCup: false,
    club: {} as ClubItem,
    members: [] as ClubMember[],
    shownLabel: '',
    stats: [] as ClubStat[],
  },

  async onLoad(query: Record<string, string | undefined>) {
    await getApp<IAppOption>().globalData.cloudBoot;
    this.setData({ fromSuperCup: query.from === 'super-cup' });
    await this.hydrate(query.id ?? '');
  },

  onShow() {
    const id = this.data.club.id;
    if (!id) {
      return;
    }
    this.hydrate(id);
  },

  async hydrate(id: string) {
    if (!id) {
      wx.showToast({ title: '俱乐部不存在', icon: 'none' });
      return;
    }
    try {
      const isLoggedIn = getApp<IAppOption>().globalData.isLoggedIn;
      const home = await loadClubHome(id);
      const club = withViewerJoinState(home.club, isLoggedIn);
      this.setData({
        club,
        members: home.members,
        shownLabel: home.shownLabel,
        stats: clubHomeStats(club, home.ranked, this.data.fromSuperCup),
      });
    } catch (error) {
      console.warn('读俱乐部主页失败', error);
      wx.showToast({
        title: error instanceof Error ? error.message : '俱乐部加载失败',
        icon: 'none',
      });
    }
  },

  async onJoin() {
    if (!getApp<IAppOption>().globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    if (this.data.club.joined) {
      wx.showToast({ title: '你已经是该俱乐部成员', icon: 'none' });
      return;
    }
    try {
      wx.showLoading({ title: '提交中', mask: true });
      const res = await joinClub(this.data.club.id);
      wx.hideLoading();
      wx.showToast({
        title: res.already ? '你已经是该俱乐部成员' : '已加入',
        icon: 'none',
      });
      this.hydrate(this.data.club.id);
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error instanceof Error ? error.message : '加入失败',
        icon: 'none',
      });
    }
  },
});
