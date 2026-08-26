/**
 * ============================================================================
 * 俱乐部主页逻辑
 * ============================================================================
 *
 * 从俱乐部列表点某一行进来。路径带 ?id=club-4，对应 mock/club.ts 里那一家。
 * id 对不上就显示第一家，避免空白页。
 *
 * 两个来源共用这一页，不要复制第二套页面：
 *   默认（俱乐部列表）     草稿 444:36：三列 总战力 / 成员 / 战力榜
 *   ?from=super-cup       V5 287:374：四列 本月积分 / 总战力 / 积分榜 / 战力榜，
 *                         头部换成会所插画
 *
 * 申请加入还没接云开发，按钮只弹提示。已加入只在登录后显示，
 * 未登录看任何一家都是「申请加入」。
 * 波浪头已去掉，occupy 吸顶栏。超级杯版仍保留会所插画，不要删。
 */
import { getClubHome, withViewerJoinState } from '../../mock/club';
import { clubSuperCupStats } from '../../mock/club-ranking';
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

  onLoad(query: Record<string, string | undefined>) {
    const home = getClubHome(query.id ?? '');
    const fromSuperCup = query.from === 'super-cup';
    const isLoggedIn = getApp<IAppOption>().globalData.isLoggedIn;
    this.setData({
      fromSuperCup,
      club: withViewerJoinState(home.club, isLoggedIn),
      members: home.members,
      shownLabel: home.shownLabel,
      stats: fromSuperCup
        ? superCupStats(home.club.id)
        : defaultStats(home.club),
    });
  },

  onShow() {
    const id = this.data.club.id;
    if (!id) {
      return;
    }
    const home = getClubHome(id);
    const isLoggedIn = getApp<IAppOption>().globalData.isLoggedIn;
    this.setData({
      club: withViewerJoinState(home.club, isLoggedIn),
    });
  },

  onJoin() {
    if (!getApp<IAppOption>().globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.showToast({
      title: this.data.club.joined ? '你已经是该俱乐部成员' : '申请流程待接入云开发',
      icon: 'none',
    });
  },
});

function defaultStats(club: ClubItem): ClubStat[] {
  return [
    { value: String(club.power), label: '总战力', lime: true },
    { value: String(club.members), label: '成员' },
    { value: `#${club.powerRank}`, label: '战力榜' },
  ];
}

function superCupStats(id: string): ClubStat[] {
  const stats = clubSuperCupStats(id);
  return [
    { value: String(stats.monthPoints), label: '本月积分', lime: true },
    { value: String(stats.power), label: '总战力', lime: true },
    { value: `#${stats.pointsRank}`, label: '积分榜' },
    { value: `#${stats.powerRank}`, label: '战力榜' },
  ];
}
