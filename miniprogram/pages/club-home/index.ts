/**
 * ============================================================================
 * 俱乐部主页逻辑
 * ============================================================================
 *
 * 从俱乐部列表点某一行进来。路径带 ?id=club-4，对应 mock/club.ts 里那一家。
 * id 对不上就显示第一家，避免空白页。
 *
 * 版式来自草稿 Figma「俱乐部主页 / Prototype Screen / Editable」(444:36)：
 * 青柠头 + 金圈 logo + 总战力卡片 + 成员列表 + 底部申请加入。
 *
 * 申请加入还没接云开发，按钮只弹提示。已加入的俱乐部（joined: true）
 * 按钮会变成描边「已加入」。
 */
import { getClubHome } from '../../mock/club';
import type { ClubItem, ClubMember } from '../../mock/club';

Page({
  data: {
    statusBarHeight: 0,
    club: {} as ClubItem,
    members: [] as ClubMember[],
    shownLabel: '',
    rankLabel: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    const app = getApp<IAppOption>();
    const home = getClubHome(query.id ?? '');
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      club: home.club,
      members: home.members,
      shownLabel: home.shownLabel,
      rankLabel: `#${home.club.powerRank}`,
    });
  },

  onJoin() {
    wx.showToast({
      title: this.data.club.joined ? '你已经是该俱乐部成员' : '申请流程待接入云开发',
      icon: 'none',
    });
  },
});
