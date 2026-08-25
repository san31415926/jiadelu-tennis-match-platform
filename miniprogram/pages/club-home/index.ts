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
 * 申请加入还没接云开发，按钮只弹提示。已加入的俱乐部（joined: true）
 * 按钮会变成描边「已加入」。
 */
import { getClubHome } from '../../mock/club';
import { clubSuperCupStats } from '../../mock/club-ranking';
import type { ClubItem, ClubMember } from '../../mock/club';

interface ClubStat {
  value: string;
  label: string;
  lime?: boolean;
}

Page({
  data: {
    statusBarHeight: 0,
    fromSuperCup: false,
    club: {} as ClubItem,
    members: [] as ClubMember[],
    shownLabel: '',
    stats: [] as ClubStat[],
  },

  onLoad(query: Record<string, string | undefined>) {
    const app = getApp<IAppOption>();
    const home = getClubHome(query.id ?? '');
    const fromSuperCup = query.from === 'super-cup';
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      fromSuperCup,
      club: home.club,
      members: home.members,
      shownLabel: home.shownLabel,
      stats: fromSuperCup
        ? superCupStats(home.club.id)
        : defaultStats(home.club),
    });
  },

  onJoin() {
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
