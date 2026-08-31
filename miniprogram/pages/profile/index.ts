import {
  guestProfile,
  loginWithWeChat,
  logout,
  readSession,
  saveProfile,
  writeSession,
} from '../../api/auth';
import type { CloudProfile } from '../../api/auth';
import { parseTags, joinTags, buildTagView, appendDraftTag, MAX_PROFILE_TAGS } from '../../mock/profile-edit';
import { TERMS_TITLE, PRIVACY_TITLE, TERMS_TEXT, PRIVACY_TEXT, MEMBER_TITLE, MEMBER_TEXT } from '../../mock/legal';
import { PAY_METHODS, PLANS } from '../../mock/membership';
import { PROFILE_THEMES } from '../../mock/profile';
import type { ProfileSummary } from '../../mock/profile';
import { headerMetrics } from '../../utils/header';
import { navigateToPage, openMyClub } from '../../utils/navigate';
import { syncTabBarSelected, setTabBarHidden } from '../../utils/tabbar';
import { getAppTheme, setAppTheme } from '../../utils/theme';
import { themeBehavior } from '../../behaviors/theme';
import { listMatchRecords, loadMyClubCard, syncMyClubSession, toCareerRecordCard } from '../../api/catalog';

/**
 * ============================================================================
 * 我的页逻辑 —— 视觉刷新草稿 V5（Figma 302:103）
 * ============================================================================
 *
 * 【两种状态共用一套布局】
 * 未登录用游客占位，登录后换成云函数返回的资料（开关仍开 mock 时用示例「帆」）。
 * 登录写在 app.globalData.isLoggedIn，首页「我的报名」也读它。
 *
 * 【更换背景是同一页的抽屉，不是新路由】
 * 对应画板 401:359。选中的色会写入 utils/theme.ts，全站顶栏和页底一起换，
 * 不是只改这一页的霜化罩。封面默认空，头图只显示主题纯色；相册上传后才铺图。
 *
 * 【我的俱乐部】
 * 卡片上的排名和人数不写在 users 里，onShow 按 club_members 现算。
 * 点进去：已加入直接进那家主页，还没入会去俱乐部中心。
 *
 * 【参赛记录】
 * 生涯卡场次/胜负/最近一场和记录页同一批 match_records 现算。
 * 没有自己的记录就写「暂无参赛记录」，不要拿演示赛当自己的。
 *
 * 【战力图】
 * 六个轴的分数在 mock 里。用 canvas 2d 画六边形雷达，标签叠在 canvas 外面。
 * 分数改了要在 applyProfile 之后再调一次 drawRadar。
 * canvas 是原生层，更换背景抽屉或裁剪器打开时要卸掉，关了再画，否则雷达会盖住。
 *
 * 【相册封面要先裁】
 * 选完图会按当前头图窗口的宽高比打开通用裁剪器，框里就是头图会铺到的那一块。
 * 取消不改封面；完成才写入 profile.cover，并走相册轻糊。
 *
 * 【开通选手会员】
 * 同一页底部抽屉（Figma 355:361），不要 navigateTo 会员页。点蒙层关掉。
 * 只留 198 元/年一档，换掉原来的包月包季。支付未接：运营填 memberUntil。
 * 抽屉打开时卸掉雷达 canvas。
 *
 * 【登录】
 * 未登录点头像/「登录」先出本页底部抽屉（协议勾选 + 按钮），这层是我们自己画的。
 * 勾了协议再点按钮，才会弹出微信自带的「申请获取并验证你的手机号」（button getPhoneNumber）。
 * wx.login 没有界面，不能拿来当登录弹窗。
 * 抽屉打开时要卸掉雷达 canvas。
 *
 * 【个性标签 / 介绍】
 * 点介绍或「+ 添加个性标签」打开本页底部抽屉，不要用系统 wx.showModal。
 * 那套深色框和本页白卡 / 28 圆角对不上。标签备选和上限跟资料页同一套 PRESET_TAGS。
 * 抽屉打开时要卸掉雷达 canvas，否则原生层会盖住抽屉。
 *
 * 【分享好友 / 退出登录】
 * 「更多服务」四格 2×2：商务合作、关于我们、联系客服、分享好友。
 * 两行写死，不要用 calc 半宽（模拟器会把格子撑成通栏）。
 * 分享必须用 button open-type="share"，叠在第四格上。
 * 退出登录单独通栏，设计稿没有。点退出只清本机会话，云端 users 还在。
 * 退出图标是线框 SVG，不要再生成 3D 图去硬配素材板。
 */

Page({
  behaviors: [themeBehavior],
  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
    isLoggedIn: false,
    profile: guestProfile() as ProfileSummary,
    themes: PROFILE_THEMES,
    showCoverSheet: false,
    showCropper: false,
    cropSrc: '',
    cropRatio: 1.5,
    /** 封面来自相册时为 true，头图要糊得更厉害 */
    coverFromAlbum: false,
    tags: [] as string[],
    showEditSheet: '' as '' | 'bio' | 'tags',
    bioDraft: '',
    selectedTags: [] as string[],
    tagChoices: [] as { label: string; on: boolean }[],
    customTags: [] as string[],
    tagDraft: '',
    maxTags: MAX_PROFILE_TAGS,
    showLoginSheet: false,
    loginAgreed: false,
    loginDoc: '' as '' | 'terms' | 'privacy',
    loginDocTitle: '',
    loginDocText: '',
    showMemberSheet: false,
    memberPlans: PLANS,
    memberPays: PAY_METHODS,
    activePlan: 'year',
    activePay: 'wechat',
    payLabel: '立即支付 ¥198',
    saveHint: '',
    memberActive: false,
    memberUntil: '',
  },

  async onLoad() {
    this.setData(headerMetrics());
    await getApp<IAppOption>().globalData.cloudBoot;
    const session = readSession();
    this.applyProfile(!!session, session);
  },

  onReady() {
    this.drawRadar();
  },

  onShow() {
    syncTabBarSelected(this, 2);
    if (this.data.showCropper) {
      setTabBarHidden(this, true);
    }
    if (this.data.showEditSheet || this.data.showLoginSheet || this.data.showMemberSheet) {
      return;
    }
    // Tab 页不会重新 onLoad。从「我的资料」保存头像/昵称回来，
    // 登录态没变，只比对 isLoggedIn 会继续显示旧图。每次 onShow 都按 session 刷一遍。
    const isLoggedIn = getApp<IAppOption>().globalData.isLoggedIn;
    this.applyProfile(isLoggedIn, readSession());
    if (isLoggedIn) {
      void this.pullCareerCards();
    }
    const theme = getAppTheme();
    if (this.data.profile.theme !== theme) {
      this.setData({ 'profile.theme': theme });
    }
  },

  async pullCareerCards() {
    await this.pullClubIntoProfile();
    await this.pullRecordsIntoProfile();
  },

  async pullClubIntoProfile() {
    await syncMyClubSession();
    const card = await loadMyClubCard();
    const session = readSession();
    if (!session) {
      return;
    }
    if (!card) {
      // 云函数已确认没加入时 session.clubId 会是空的。读库失败不要把已有俱乐部抹掉。
      return;
    }
    writeSession({
      ...session,
      club: card.clubName,
      clubId: card.clubId,
      clubRank: card.clubRank,
      clubMembers: card.clubMembers,
    });
    this.applyProfile(true, readSession());
  },

  async pullRecordsIntoProfile() {
    const { records } = await listMatchRecords();
    const session = readSession();
    if (!session) {
      return;
    }
    const card = toCareerRecordCard(records);
    writeSession({
      ...session,
      recordSummary: card.recordSummary,
      lastEvent: card.lastEvent,
      wins: card.wins,
    });
    this.applyProfile(true, readSession());
  },

  requireLogin(): boolean {
    if (this.data.isLoggedIn) {
      return true;
    }
    wx.showToast({ title: '请先登录', icon: 'none' });
    return false;
  },

  applyProfile(isLoggedIn: boolean, profile?: CloudProfile | null) {
    const stored = this.data.profile;
    const loggedInProfile = profile || readSession();
    const next = isLoggedIn && loggedInProfile
      ? {
          ...loggedInProfile,
          cover: loggedInProfile.cover || stored.cover,
          theme: getAppTheme(),
        }
      : {
          ...guestProfile(),
          cover: stored.cover,
          theme: getAppTheme(),
        };
    if (isLoggedIn && loggedInProfile) {
      writeSession({ ...loggedInProfile, ...next });
    }
    const memberUntil = isLoggedIn && loggedInProfile
      ? String(loggedInProfile.memberUntil || '').slice(0, 10)
      : '';
    const memberActive = !!(isLoggedIn && loggedInProfile && loggedInProfile.memberActive);
    const shown = (isLoggedIn && readSession()) || next;
    const tags = isLoggedIn && shown ? parseTags(shown.tags) : [];
    this.setData({
      isLoggedIn,
      profile: shown,
      tags,
      memberActive,
      memberUntil,
      ...buildTagView(tags),
    }, () => this.drawRadar());
  },

  onAvatarTap() {
    this.onLogin();
  },

  onLogin() {
    if (this.data.isLoggedIn) {
      navigateToPage('/pages/profile-edit/index');
      return;
    }
    this.setData({
      showLoginSheet: true,
      loginAgreed: false,
      loginDoc: '',
    });
  },

  onToggleLoginAgree() {
    this.setData({ loginAgreed: !this.data.loginAgreed });
  },

  onNeedAgree() {
    wx.showToast({ title: '请先勾选协议', icon: 'none' });
  },

  onOpenLoginDoc(event: WechatMiniprogram.TouchEvent) {
    const kind = String(event.currentTarget.dataset.doc || '');
    if (kind === 'privacy') {
      this.setData({
        loginDoc: 'privacy',
        loginDocTitle: PRIVACY_TITLE,
        loginDocText: PRIVACY_TEXT,
      });
      return;
    }
    this.setData({
      loginDoc: 'terms',
      loginDocTitle: TERMS_TITLE,
      loginDocText: TERMS_TEXT,
    });
  },

  onCloseLoginDoc() {
    this.setData({ loginDoc: '', loginDocTitle: '', loginDocText: '' });
  },

  onCloseLoginSheet() {
    this.setData({
      showLoginSheet: false,
      loginDoc: '',
    }, () => {
      wx.nextTick(() => this.drawRadar());
    });
  },

  /**
   * 微信自带选号层点完会走到这里。detail.code 交给云函数换手机号。
   * 用户点「不允许」就停在抽屉。模拟器没有选号能力时退回纯微信身份登录。
   */
  onGetPhoneNumber(event: { detail?: { code?: string; errMsg?: string } }) {
    const detail = event.detail || {};
    if (detail.code) {
      this.finishLogin(detail.code);
      return;
    }
    const msg = String(detail.errMsg || '');
    if (msg.indexOf('deny') >= 0 || msg.indexOf('cancel') >= 0) {
      wx.showToast({ title: '未授权手机号', icon: 'none' });
      return;
    }
    this.finishLogin();
  },

  finishLogin(phoneCode?: string) {
    wx.showLoading({ title: '登录中', mask: true });
    const run = () => {
      loginWithWeChat(phoneCode ? { phoneCode } : undefined)
        .then((profile) => {
          wx.hideLoading();
          writeSession(profile);
          this.setData({ showLoginSheet: false, loginDoc: '' });
          this.applyProfile(true, profile);
          wx.showToast({ title: '登录成功', icon: 'none' });
        })
        .catch((error: { message?: string }) => {
          wx.hideLoading();
          wx.showToast({
            title: (error && error.message) || '登录失败，请确认已上传 login 云函数',
            icon: 'none',
          });
        });
    };
    wx.login({
      success: run,
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '微信登录失败，请重试', icon: 'none' });
      },
    });
  },

  onEditBio() {
    if (!this.requireLogin()) {
      return;
    }
    this.setData({
      showEditSheet: 'bio',
      bioDraft: this.data.profile.bio || '',
    });
  },

  onAddTag() {
    if (!this.requireLogin()) {
      return;
    }
    this.setData({
      showEditSheet: 'tags',
      tagDraft: '',
      ...buildTagView(this.data.tags),
    });
  },

  onBioDraftInput(event: WechatMiniprogram.Input) {
    this.setData({ bioDraft: event.detail.value });
  },

  onTagDraftInput(event: WechatMiniprogram.Input) {
    this.setData({ tagDraft: event.detail.value });
  },

  onSheetTagTap(event: WechatMiniprogram.TouchEvent) {
    const value = String(event.currentTarget.dataset.value || '');
    if (!value) {
      return;
    }
    const selected = this.data.selectedTags.slice();
    const index = selected.indexOf(value);
    if (index >= 0) {
      selected.splice(index, 1);
      this.setData(buildTagView(selected));
      return;
    }
    if (selected.length >= MAX_PROFILE_TAGS) {
      wx.showToast({ title: '最多选 5 个', icon: 'none' });
      return;
    }
    selected.push(value);
    this.setData(buildTagView(selected));
  },

  onSheetTagConfirm() {
    const next = appendDraftTag(this.data.selectedTags, this.data.tagDraft);
    if (next.blocked) {
      wx.showToast({ title: '最多选 5 个', icon: 'none' });
      return;
    }
    this.setData({
      ...buildTagView(next.selected),
      tagDraft: '',
    });
  },

  onCloseEditSheet() {
    this.setData({
      showEditSheet: '',
      tagDraft: '',
    }, () => {
      wx.nextTick(() => this.drawRadar());
    });
  },

  onConfirmEditSheet() {
    if (this.data.showEditSheet === 'bio') {
      this.saveBioDraft();
      return;
    }
    this.saveTagDraft();
  },

  saveBioDraft() {
    const bio = String(this.data.bioDraft || '').trim();
    const session = readSession();
    if (session) {
      writeSession({ ...session, bio });
      saveProfile({ bio }).catch(() => {
        wx.showToast({ title: '介绍已改，云端保存失败', icon: 'none' });
      });
    }
    const complete = (readSession() && readSession().profileComplete) || this.data.profile.profileComplete;
    this.setData({
      'profile.bio': bio,
      'profile.profileComplete': complete,
      showEditSheet: '',
    }, () => {
      wx.nextTick(() => this.drawRadar());
    });
  },

  saveTagDraft() {
    const next = appendDraftTag(this.data.selectedTags, this.data.tagDraft);
    const selected = next.selected;
    const tagsText = joinTags(selected);
    const session = readSession();
    if (session) {
      writeSession({ ...session, tags: tagsText });
      saveProfile({ tags: tagsText }).catch(() => {
        wx.showToast({ title: '标签已改，云端保存失败', icon: 'none' });
      });
    }
    const complete = (readSession() && readSession().profileComplete) || this.data.profile.profileComplete;
    this.setData({
      ...buildTagView(selected),
      tags: selected,
      tagDraft: '',
      showEditSheet: '',
      'profile.profileComplete': complete,
    }, () => {
      wx.nextTick(() => this.drawRadar());
    });
  },

  onOpenMembership() {
    if (!this.requireLogin()) {
      return;
    }
    this.syncMemberPay('year');
    this.setData({
      showMemberSheet: true,
      activePlan: 'year',
      activePay: 'wechat',
    });
  },

  onCloseMemberSheet() {
    this.setData({ showMemberSheet: false }, () => {
      wx.nextTick(() => this.drawRadar());
    });
  },

  syncMemberPay(planKey: string) {
    const plan = PLANS.find((item) => item.key === planKey);
    const origin = plan ? Number(plan.origin) : 0;
    const price = plan ? Number(plan.price) : 0;
    const saved = origin > price ? origin - price : 0;
    this.setData({
      payLabel: plan ? `立即支付 ¥${plan.price}` : '立即支付',
      saveHint: saved > 0 ? `立省 ${saved} 元` : '',
    });
  },

  onSelectPlan(event: WechatMiniprogram.TouchEvent) {
    const key = String(event.currentTarget.dataset.key);
    if (key === this.data.activePlan) {
      return;
    }
    this.setData({ activePlan: key });
    this.syncMemberPay(key);
  },

  onSelectPay(event: WechatMiniprogram.TouchEvent) {
    this.setData({ activePay: String(event.currentTarget.dataset.key) });
  },

  onMemberCheckout() {
    wx.showToast({
      title: '支付未开通，请让运营在后台填写会员有效至',
      icon: 'none',
      duration: 2500,
    });
  },

  onShowMemberAgree() {
    wx.showModal({
      title: MEMBER_TITLE,
      content: MEMBER_TEXT,
      showCancel: false,
    });
  },

  onOpenEdit() {
    if (!this.requireLogin()) {
      return;
    }
    navigateToPage('/pages/profile-edit/index');
  },

  onOpenClub() {
    openMyClub();
  },

  onOpenRecords() {
    if (!this.requireLogin()) {
      return;
    }
    navigateToPage('/pages/records/index');
  },

  onOpenBusiness() {
    if (!this.requireLogin()) {
      return;
    }
    navigateToPage('/pages/business/index');
  },

  onOpenAbout() {
    if (!this.requireLogin()) {
      return;
    }
    navigateToPage('/pages/about/index');
  },

  onOpenService() {
    if (!this.requireLogin()) {
      return;
    }
    navigateToPage('/pages/service/index');
  },

  onNeedLogin() {
    this.requireLogin();
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '退出后本机回到游客。云端资料还在，再登录会接上。',
      confirmText: '退出',
      success: (res) => {
        if (!res.confirm) {
          return;
        }
        logout();
        this.applyProfile(false);
        wx.showToast({ title: '已退出', icon: 'none' });
      },
    });
  },

  onOpenCoverSheet() {
    if (!this.requireLogin()) {
      return;
    }
    // canvas 是原生层，抽屉 z-index 压不住，打开时先卸掉雷达
    this.setData({ showCoverSheet: true });
  },

  onCloseCoverSheet() {
    this.setData({ showCoverSheet: false }, () => {
      wx.nextTick(() => this.drawRadar());
    });
  },

  /** 抽屉打开时挡住背后滚动，空函数即可，靠 catchtouchmove 拦住 */
  onPreventMove() {},

  onPickTheme(event: WechatMiniprogram.TouchEvent) {
    const theme = setAppTheme(String(event.currentTarget.dataset.key));
    this.setData({ 'profile.theme': theme });
    const session = readSession();
    if (session) {
      writeSession({ ...session, theme });
      saveProfile({ theme }).catch(() => undefined);
    }
  },

  onClearCover() {
    this.setData({
      'profile.cover': '',
      coverFromAlbum: false,
    });
  },

  onPickAlbumCover() {
    this.createSelectorQuery()
      .select('.hero')
      .boundingClientRect()
      .exec((res) => {
        const rect = res && res[0];
        const ratio =
          rect && rect.width && rect.height ? rect.width / rect.height : 1.5;
        wx.chooseMedia({
          count: 1,
          mediaType: ['image'],
          success: (pick) => {
            const path = pick.tempFiles[0] && pick.tempFiles[0].tempFilePath;
            if (!path) {
              return;
            }
            setTabBarHidden(this, true);
            this.setData({
              showCoverSheet: false,
              showCropper: true,
              cropSrc: path,
              cropRatio: ratio,
            });
          },
        });
      });
  },

  onCropConfirm(event: WechatMiniprogram.CustomEvent<{ path: string }>) {
    const path = event.detail && event.detail.path;
    setTabBarHidden(this, false);
    this.setData(
      {
        showCropper: false,
        cropSrc: '',
        showCoverSheet: false,
        coverFromAlbum: true,
        'profile.cover': path || this.data.profile.cover,
      },
      () => {
        wx.nextTick(() => this.drawRadar());
      },
    );
  },

  onCropCancel() {
    setTabBarHidden(this, false);
    this.setData({
      showCropper: false,
      cropSrc: '',
      showCoverSheet: true,
    });
  },

  /**
   * 战力图。轴从正上方开始顺时针：发球 / 正手 / 反手 / 网前 / 步伐 / 体能。
   * 半径按 0~100 映射到最外圈。改 mock 分数这里不用改。
   */
  drawRadar() {
    const query = this.createSelectorQuery();
    query
      .select('#radarCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const target = res && res[0];
        if (!target || !target.node) {
          return;
        }
        const canvas = target.node as WechatMiniprogram.Canvas;
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        const dpr = wx.getSystemInfoSync().pixelRatio || 2;
        const width = target.width as number;
        const height = target.height as number;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(width, height) * 0.32;
        const axes = this.data.profile.radar.axes;
        const count = axes.length;

        const pointAt = (index: number, ratio: number) => {
          const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
          return {
            x: cx + Math.cos(angle) * radius * ratio,
            y: cy + Math.sin(angle) * radius * ratio,
          };
        };

        [0.25, 0.5, 0.75, 1].forEach((ring) => {
          ctx.beginPath();
          axes.forEach((_, index) => {
            const p = pointAt(index, ring);
            if (index === 0) {
              ctx.moveTo(p.x, p.y);
            } else {
              ctx.lineTo(p.x, p.y);
            }
          });
          ctx.closePath();
          ctx.strokeStyle = 'rgba(71, 133, 15, 0.22)';
          ctx.lineWidth = 1;
          ctx.stroke();
        });

        ctx.beginPath();
        axes.forEach((_, index) => {
          const p = pointAt(index, 1);
          ctx.moveTo(cx, cy);
          ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = 'rgba(71, 133, 15, 0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        axes.forEach((axis, index) => {
          const p = pointAt(index, Math.max(0.08, axis.value / 100));
          if (index === 0) {
            ctx.moveTo(p.x, p.y);
          } else {
            ctx.lineTo(p.x, p.y);
          }
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(131, 212, 20, 0.35)';
        ctx.strokeStyle = '#47850f';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        axes.forEach((axis, index) => {
          const p = pointAt(index, Math.max(0.08, axis.value / 100));
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#47850f';
          ctx.fill();
        });
      });
  },

  onShareAppMessage() {
    return {
      title: 'LTJIMMY赛事',
      path: '/pages/events/index',
    };
  },
});
