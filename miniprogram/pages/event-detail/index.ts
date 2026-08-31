/**
 * ============================================================================
 * 赛事详情页逻辑
 * ============================================================================
 *
 * 从赛事卡点进来。路径带 ?id=，读云库 events（开关关上后）。
 * 版式来自视觉刷新草稿 V5（首页 228:514 等）：occupy 吸顶栏 + 八宫格切同一页状态。
 * 旧稿 447:103 的高波浪头、网球、大海报已经拿掉。八宫格选中走主题强调色。
 *
 * 【Tab 怎么切】
 * 八个入口都在本页切 activeTab，不新开页面。
 *
 * 【报名 Tab】
 * 只预览名单。单打一人一行，双打两人一组（signupPreview.format）。
 * 不要「查看按积分报名」，球员卡也不要积分组标签。
 * 「立即报名 / 报名参赛」才跳 /pages/signup/index?id=。
 * 已经报名的人底部改成「申请退赛」，退赛走 createRegistration 的 withdraw，
 * 不要让运营在后台直接删报名（迟退次数要记在用户档案里）。
 *
 * 【组队不是约球】
 * 单打：空状态「单打无需组队」，底部不显示发布组队。
 * 双打：招募中 / 发布招募。申请加入、发布招募写入云库 events / team_applies，
 * 不要做成匹配、不要 VS / H2H。
 *
 * 想改默认打开的 Tab → onLoad 读 ?tab=，或改 data.activeTab。
 */
import {
  EVENT_NAV,
} from '../../mock/event-detail';
import type {
  EventDetail,
  EventDetailTab,
} from '../../mock/event-detail';
import { applyTeamRecruit, loadEventDetail, listMyRegistrations, publishTeamRecruit, withdrawRegistration } from '../../api/events';
import { isSinglesEvent } from '../../mock/home';
import { resolveVenueId } from '../../mock/venue';
import { navigateToPage } from '../../utils/navigate';
import { themeBehavior } from '../../behaviors/theme';

const TABS: EventDetailTab[] = [
  'home',
  'info',
  'signup',
  'team',
  'photos',
  'bracket',
  'schedule',
  'results',
];

function isTab(value: string): value is EventDetailTab {
  return TABS.indexOf(value as EventDetailTab) >= 0;
}

Page({
  behaviors: [themeBehavior],
  data: {
    event: {} as EventDetail,
    displayTitle: '赛事详情',
    nav: EVENT_NAV,
    activeTab: 'home' as EventDetailTab,
    rewardsOpen: true,
    filesOpen: true,
    bracketTab: '小组赛',
    showCta: true,
    ctaLabel: '立即报名',
    ctaHint: '',
    ctaLime: true,
    ctaHintGray: false,
    showRecruitSheet: false,
    recruitNeed: '女搭档',
    recruitLevel: '同级优先',
    recruitDeadline: '2026年8月25日',
    recruitDeadlineValue: '2026-08-25',
    recruitNote: '',
    emptyAvatars: ['/assets/images/avatars/anime-01.jpg', '/assets/images/avatars/anime-02.jpg'],
    /** 单打场组队 Tab / CTA 用。跟 isSinglesEvent(category) 走，不要看标题。 */
    singles: false,
    myRegStatus: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    const tab = query.tab && isTab(query.tab) ? query.tab : 'home';
    const boot = getApp<IAppOption>().globalData.cloudBoot || Promise.resolve();
    boot
      .then(() => loadEventDetail(query.id ?? ''))
      .then((event) => {
        this.setData({
          event,
          singles: isSinglesEvent(event),
          displayTitle: event.grade ? `${event.grade}${event.title}` : event.title,
          recruitNeed: isSinglesEvent(event) ? '女搭档' : '男搭档',
        });
        return this.refreshMyReg(event.id).then(() => this.applyTab(tab, event));
      })
      .catch(() => {
        wx.showToast({ title: '赛事详情加载失败', icon: 'none' });
      });
  },

  applyTab(tab: EventDetailTab, source?: EventDetail) {
    const event = source ?? this.data.event;
    let showCta = true;
    let ctaLabel = event.actionText;
    let ctaHint = event.ctaHint;
    let ctaLime = true;
    let ctaHintGray = false;
    if (tab === 'signup') {
      if (this.data.myRegStatus && this.data.myRegStatus !== 'withdrawn') {
        ctaLabel = '申请退赛';
        ctaHint = this.data.myRegStatus === 'waitlist'
          ? '候补中。退赛须走小程序，不要让后台直接删'
          : '退赛须走小程序。免费截止后算迟退，每年 3 次豁免';
      } else {
        ctaLabel = '报名参赛';
        ctaHint = event.status === '报名中' ? '报名需先登录成为赛事球员' : '';
      }
    } else if (tab === 'team') {
      if (isSinglesEvent(event)) {
        showCta = false;
        ctaHint = '';
      } else {
        ctaLabel = '发布组队';
        ctaHint = '发布后，其他球员可以申请加入';
        ctaHintGray = true;
      }
    } else if (tab === 'photos') {
      ctaLabel = '查看全部相册';
      ctaHint = '';
    } else if (tab === 'bracket' || tab === 'schedule' || tab === 'results') {
      showCta = false;
      ctaHint = '';
    } else if (this.data.myRegStatus && this.data.myRegStatus !== 'withdrawn') {
      ctaLabel = '申请退赛';
      ctaHint = '退赛须走小程序。免费截止后算迟退，每年 3 次豁免';
    } else if (event.status !== '报名中') {
      ctaHint = '';
    }
    this.setData({
      activeTab: tab,
      showCta,
      ctaLabel,
      ctaHint,
      ctaLime,
      ctaHintGray,
    });
  },

  onNavTap(event: WechatMiniprogram.TouchEvent) {
    const key = String(event.currentTarget.dataset.key);
    if (!isTab(key)) {
      return;
    }
    this.applyTab(key);
  },

  async refreshMyReg(eventId?: string) {
    const id = eventId || this.data.event.id;
    if (!id || !getApp<IAppOption>().globalData.isLoggedIn) {
      this.setData({ myRegStatus: '' });
      return;
    }
    try {
      const rows = await listMyRegistrations();
      const mine = rows.find((row) => row.eventId === id);
      this.setData({ myRegStatus: mine && mine.status !== 'withdrawn' ? mine.status : '' });
    } catch (error) {
      this.setData({ myRegStatus: '' });
    }
  },

  onNewsTap() {
    this.applyTab('info');
  },

  onToggleRewards() {
    this.setData({ rewardsOpen: !this.data.rewardsOpen });
  },

  onToggleFiles() {
    this.setData({ filesOpen: !this.data.filesOpen });
  },

  onFileTap(event: WechatMiniprogram.TouchEvent) {
    const name = String(event.currentTarget.dataset.name || '赛事文件');
    wx.showToast({ title: name, icon: 'none' });
  },

  onVenueTap() {
    navigateToPage(`/pages/venue/index?id=${resolveVenueId(this.data.event)}`);
  },

  onPreviewPhoto(event: WechatMiniprogram.TouchEvent) {
    const current = String(event.currentTarget.dataset.src);
    const urls = this.data.event.photos;
    wx.previewImage({ current, urls });
  },

  onOpenGallery() {
    navigateToPage('/pages/gallery/index');
  },

  onBracketTab(event: WechatMiniprogram.TouchEvent) {
    this.setData({ bracketTab: String(event.currentTarget.dataset.name) });
  },

  onFullscreen() {
    wx.showToast({ title: '全屏签表待接入', icon: 'none' });
  },

  onJoinTeam(event: WechatMiniprogram.TouchEvent) {
    const name = String(event.currentTarget.dataset.name);
    const recruitId = String(event.currentTarget.dataset.id || '');
    applyTeamRecruit({
      eventId: this.data.event.id,
      recruitId,
      recruitName: name,
    })
      .then(() => {
        wx.showToast({ title: `已申请加入${name}的招募`, icon: 'none' });
      })
      .catch((error: { message?: string }) => {
        wx.showToast({
          title: (error && error.message) || '申请失败',
          icon: 'none',
        });
      });
  },

  onOpenRecruit() {
    this.setData({ showRecruitSheet: true });
  },

  onCloseRecruit() {
    this.setData({ showRecruitSheet: false });
  },

  onPickNeed(event: WechatMiniprogram.TouchEvent) {
    this.setData({ recruitNeed: String(event.currentTarget.dataset.value) });
  },

  onPickLevel(event: WechatMiniprogram.TouchEvent) {
    this.setData({ recruitLevel: String(event.currentTarget.dataset.value) });
  },

  onDeadlineChange(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const value = String(event.detail.value || '');
    const parts = value.split('-');
    if (parts.length < 3) {
      return;
    }
    this.setData({
      recruitDeadlineValue: value,
      recruitDeadline: `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`,
    });
  },

  onNoteInput(event: WechatMiniprogram.Input) {
    this.setData({ recruitNote: event.detail.value });
  },

  onPublishRecruit() {
    publishTeamRecruit({
      eventId: this.data.event.id,
      need: this.data.recruitNeed,
      deadline: this.data.recruitDeadline,
      note: this.data.recruitNote,
    })
      .then((res) => {
        this.setData({
          'event.teamRecruits': res.teamRecruits,
          showRecruitSheet: false,
          recruitNote: '',
        });
        wx.showToast({ title: '已发布招募', icon: 'none' });
      })
      .catch((error: { message?: string }) => {
        wx.showToast({
          title: (error && error.message) || '发布失败',
          icon: 'none',
        });
      });
  },

  onCta() {
    const tab = this.data.activeTab;
    const action = this.data.event.actionText;
    if (tab === 'team') {
      if (this.data.singles) {
        return;
      }
      this.onOpenRecruit();
      return;
    }
    if (tab === 'photos') {
      this.onOpenGallery();
      return;
    }
    if (this.data.ctaLabel === '申请退赛') {
      this.onWithdraw();
      return;
    }
    if (tab === 'signup' || action === '立即报名' || action.indexOf('报名') >= 0) {
      navigateToPage(`/pages/signup/index?id=${this.data.event.id}`);
      return;
    }
    if (action === '查看成绩') {
      this.applyTab('results');
      return;
    }
    if (action === '查看对阵') {
      this.applyTab('schedule');
      return;
    }
    navigateToPage(`/pages/signup/index?id=${this.data.event.id}`);
  },

  onWithdraw() {
    wx.showModal({
      title: '申请退赛',
      content: '免费退赛截止后算迟退。每年 3 次豁免，超出后报名会进候补。退赛必须走这里。',
      confirmText: '确认退赛',
      success: (res) => {
        if (!res.confirm) {
          return;
        }
        withdrawRegistration(this.data.event.id)
          .then((result) => {
            const extra = result.late
              ? result.usedExemption
                ? `已记迟退，本年度还剩 ${result.remainingExempt} 次豁免`
                : '迟退次数已满，之后报名将进入候补'
              : '已退出本场';
            wx.showToast({ title: extra, icon: 'none', duration: 2500 });
            return this.refreshMyReg().then(() => this.applyTab(this.data.activeTab));
          })
          .catch((error: { message?: string }) => {
            wx.showToast({
              title: (error && error.message) || '退赛失败',
              icon: 'none',
            });
          });
      },
    });
  },
});
