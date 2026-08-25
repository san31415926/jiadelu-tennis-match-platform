import {
  GUEST_PROFILE,
  MOCK_PROFILE,
  PROFILE_COVERS,
  PROFILE_THEMES,
} from '../../mock/profile';
import type { ProfileSummary } from '../../mock/profile';
import { navigateToPage } from '../../utils/navigate';
import { syncTabBarSelected } from '../../utils/tabbar';

/**
 * ============================================================================
 * 我的页逻辑 —— 视觉刷新草稿 V5（Figma 302:103）
 * ============================================================================
 *
 * 【两种状态共用一套布局】
 * 未登录用 GUEST_PROFILE，登录后换成 MOCK_PROFILE。登录写在
 * app.globalData.isLoggedIn，首页「我的报名」也读它。
 *
 * 【更换背景是同一页的抽屉，不是新路由】
 * 对应画板 401:359。先选背景色，再选封面图；从相册选会调 wx.chooseMedia。
 *
 * 【战力图】
 * 六个轴的分数在 mock 里。用 canvas 2d 画六边形雷达，标签叠在 canvas 外面。
 * 分数改了要在 applyProfile 之后再调一次 drawRadar。
 *
 * 【分享好友】
 * 设计里没有单独菜单行，放在「更多服务」右侧透明热区不够，所以在生涯卡
 * 下方留了一颗分享按钮，必须用 button open-type="share"。
 */

Page({
  data: {
    statusBarHeight: 0,
    isLoggedIn: false,
    profile: GUEST_PROFILE as ProfileSummary,
    themes: PROFILE_THEMES,
    covers: PROFILE_COVERS,
    showCoverSheet: false,
    tags: [] as string[],
  },

  onLoad() {
    const app = getApp<IAppOption>();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight });
    this.applyProfile(app.globalData.isLoggedIn);
  },

  onReady() {
    this.drawRadar();
  },

  onShow() {
    syncTabBarSelected(this, 2);
    const isLoggedIn = getApp<IAppOption>().globalData.isLoggedIn;
    if (isLoggedIn !== this.data.isLoggedIn) {
      this.applyProfile(isLoggedIn);
    }
  },

  requireLogin(): boolean {
    if (this.data.isLoggedIn) {
      return true;
    }
    wx.showToast({ title: '请先登录', icon: 'none' });
    return false;
  },

  applyProfile(isLoggedIn: boolean) {
    const stored = this.data.profile;
    const next = {
      ...(isLoggedIn ? MOCK_PROFILE : GUEST_PROFILE),
      cover: stored.cover || MOCK_PROFILE.cover,
      theme: stored.theme || 'mint',
    };
    getApp<IAppOption>().globalData.isLoggedIn = isLoggedIn;
    this.setData({ isLoggedIn, profile: next }, () => this.drawRadar());
  },

  onAvatarTap() {
    this.onLogin();
  },

  onLogin() {
    if (this.data.isLoggedIn) {
      navigateToPage('/pages/profile-edit/index');
      return;
    }
    wx.login({
      success: () => {
        this.applyProfile(true);
        wx.showToast({ title: '已载入示例资料，登录待接入云开发', icon: 'none' });
      },
      fail: () => {
        wx.showToast({ title: '微信登录失败，请重试', icon: 'none' });
      },
    });
  },

  onEditBio() {
    if (!this.requireLogin()) {
      return;
    }
    wx.showModal({
      title: '编辑介绍',
      editable: true,
      placeholderText: '写一句球场介绍',
      content: this.data.profile.bio,
      success: (res) => {
        if (res.confirm && typeof res.content === 'string') {
          this.setData({ 'profile.bio': res.content.trim() });
        }
      },
    });
  },

  onAddTag() {
    if (!this.requireLogin()) {
      return;
    }
    wx.showModal({
      title: '添加个性标签',
      editable: true,
      placeholderText: '例如 双手反拍',
      success: (res) => {
        if (!res.confirm || !res.content) {
          return;
        }
        const tag = res.content.trim();
        if (!tag) {
          return;
        }
        this.setData({ tags: this.data.tags.concat(tag) });
      },
    });
  },

  onOpenMembership() {
    navigateToPage('/pages/membership/index');
  },

  onOpenEdit() {
    if (!this.requireLogin()) {
      return;
    }
    navigateToPage('/pages/profile-edit/index');
  },

  onOpenClub() {
    if (!this.requireLogin()) {
      return;
    }
    navigateToPage('/pages/clubs/index');
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

  onOpenCoverSheet() {
    if (!this.requireLogin()) {
      return;
    }
    this.setData({ showCoverSheet: true });
  },

  onCloseCoverSheet() {
    this.setData({ showCoverSheet: false });
  },

  /** 抽屉打开时挡住背后滚动，空函数即可，靠 catchtouchmove 拦住 */
  onPreventMove() {},

  onPickTheme(event: WechatMiniprogram.TouchEvent) {
    this.setData({ 'profile.theme': String(event.currentTarget.dataset.key) });
  },

  onPickCover(event: WechatMiniprogram.TouchEvent) {
    this.setData({ 'profile.cover': String(event.currentTarget.dataset.image) });
  },

  onPickAlbumCover() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const path = res.tempFiles[0] && res.tempFiles[0].tempFilePath;
        if (path) {
          this.setData({ 'profile.cover': path });
        }
      },
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
