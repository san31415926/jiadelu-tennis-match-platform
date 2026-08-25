/**
 * ============================================================================
 * 赛事详情页逻辑
 * ============================================================================
 *
 * 从赛事卡点进来。路径带 ?id=e-open-1，对应 mock/event-detail.ts。
 * 版式来自视觉刷新草稿 V5（首页 228:514 等）：矮青柠头 + 八宫格切同一页状态。
 * 旧稿 447:103 的高波浪头、网球、大海报已经拿掉。
 *
 * 【Tab 怎么切】
 * 八个入口都在本页切 activeTab，不新开页面。报名 Tab 只是预览名单，
 * 「立即报名 / 报名参赛」才跳 /pages/signup/index?id=。
 *
 * 【组队不是约球】
 * 空状态 / 招募中 / 发布招募三套 UI。申请加入、发布招募只改本页 mock 或 toast，
 * 不要做成匹配、不要 VS / H2H。
 *
 * 想改默认打开的 Tab → onLoad 读 ?tab=，或改 data.activeTab。
 */
import {
  EVENT_NAV,
  getEventDetail,
  SIGNUP_SELF,
} from '../../mock/event-detail';
import type {
  EventDetail,
  EventDetailTab,
  EventTeamRecruit,
} from '../../mock/event-detail';
import { venueIdByEventId } from '../../mock/venue';
import { navigateToPage } from '../../utils/navigate';

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
  data: {
    statusBarHeight: 0,
    event: getEventDetail('e-open-1') as EventDetail,
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
    recruitNote: '',
    emptyAvatars: [SIGNUP_SELF.avatar, '/assets/images/ranking/avatar-4.jpg'],
  },

  onLoad(query: Record<string, string | undefined>) {
    const app = getApp<IAppOption>();
    const event = getEventDetail(query.id ?? '');
    const tab = query.tab && isTab(query.tab) ? query.tab : 'home';
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      event,
      displayTitle: event.grade ? `${event.grade}${event.title}` : event.title,
    });
    this.applyTab(tab, event);
  },

  applyTab(tab: EventDetailTab, source?: EventDetail) {
    const event = source ?? this.data.event;
    let showCta = true;
    let ctaLabel = event.actionText;
    let ctaHint = event.ctaHint;
    let ctaLime = true;
    let ctaHintGray = false;
    if (tab === 'signup') {
      ctaLabel = '报名参赛';
      ctaHint = event.status === '报名中' ? '报名需先登录成为赛事球员' : '';
    } else if (tab === 'team') {
      ctaLabel = '发布组队';
      ctaHint = '发布后，其他球员可以申请加入';
      ctaHintGray = true;
    } else if (tab === 'photos') {
      ctaLabel = '查看全部相册';
      ctaHint = '';
    } else if (tab === 'bracket' || tab === 'schedule' || tab === 'results') {
      showCta = false;
      ctaHint = '';
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

  onNewsTap() {
    this.applyTab('info');
  },

  onToggleRewards() {
    this.setData({ rewardsOpen: !this.data.rewardsOpen });
  },

  onToggleFiles() {
    this.setData({ filesOpen: !this.data.filesOpen });
  },

  onFileTap() {
    wx.showToast({ title: '文件待接入云开发', icon: 'none' });
  },

  onVenueTap() {
    navigateToPage(`/pages/venue/index?id=${venueIdByEventId(this.data.event.id)}`);
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
    const name = String(event.currentTarget.dataset.name);
    if (name !== '小组赛') {
      wx.showToast({ title: `${name}签表待接入云开发`, icon: 'none' });
      return;
    }
    this.setData({ bracketTab: name });
  },

  onFullscreen() {
    wx.showToast({ title: '全屏签表待接入', icon: 'none' });
  },

  onJoinTeam(event: WechatMiniprogram.TouchEvent) {
    const name = String(event.currentTarget.dataset.name);
    wx.showToast({ title: `已申请加入${name}的招募`, icon: 'none' });
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

  onPickDeadline() {
    wx.showToast({ title: '日期选择待接入', icon: 'none' });
  },

  onNoteInput(event: WechatMiniprogram.Input) {
    this.setData({ recruitNote: event.detail.value });
  },

  onPublishRecruit() {
    const event = this.data.event;
    const needMap: Record<string, string> = {
      女搭档: `缺女搭档 · ${event.grade}${event.category}`,
      男搭档: `缺男搭档 · ${event.grade}${event.category}`,
      不限: `不限性别 · ${this.data.recruitDeadline}前组好`,
    };
    const row: EventTeamRecruit = {
      id: `t-self-${Date.now()}`,
      name: SIGNUP_SELF.name,
      avatar: SIGNUP_SELF.avatar,
      need: needMap[this.data.recruitNeed] || needMap['不限'],
      points: 1650,
    };
    const teamRecruits = [row, ...event.teamRecruits];
    this.setData({
      'event.teamRecruits': teamRecruits,
      showRecruitSheet: false,
      recruitNote: '',
    });
    wx.showToast({ title: '已发布招募（示例）', icon: 'none' });
  },

  onCta() {
    const tab = this.data.activeTab;
    const action = this.data.event.actionText;
    if (tab === 'team') {
      this.onOpenRecruit();
      return;
    }
    if (tab === 'photos') {
      this.onOpenGallery();
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
});
