import {
  GUEST_PROFILE,
  MOCK_PROFILE,
  PROFILE_THEMES,
} from '../../mock/profile';
import type { ProfileSummary } from '../../mock/profile';
import { headerMetrics } from '../../utils/header';
import { navigateToPage, openMyClub } from '../../utils/navigate';
import { syncTabBarSelected, setTabBarHidden } from '../../utils/tabbar';
import { getAppTheme, setAppTheme } from '../../utils/theme';
import { themeBehavior } from '../../behaviors/theme';

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
 * 对应画板 401:359。选中的色会写入 utils/theme.ts，全站顶栏和页底一起换，
 * 不是只改这一页的霜化罩。封面默认空，头图只显示主题纯色；相册上传后才铺图。
 *
 * 【我的俱乐部】
 * 未登录进俱乐部中心，列表不显示「已加入」。
 * 已登录且 mock 里有 joined 的俱乐部，直接进那家主页；还没入会也去俱乐部中心。
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
 * 【分享好友】
 * 设计里没有单独菜单行，放在「更多服务」右侧透明热区不够，所以在生涯卡
 * 下方留了一颗分享按钮，必须用 button open-type="share"。
 */

Page({
  behaviors: [themeBehavior],
  data: {
    statusBarHeight: 0,
    isLoggedIn: false,
    profile: GUEST_PROFILE as ProfileSummary,
    themes: PROFILE_THEMES,
    showCoverSheet: false,
    showCropper: false,
    cropSrc: '',
    cropRatio: 1.5,
    /** 封面来自相册时为 true，头图要糊得更厉害 */
    coverFromAlbum: false,
    tags: [] as string[],
  },

  onLoad() {
    this.setData(headerMetrics());
    this.applyProfile(getApp<IAppOption>().globalData.isLoggedIn);
  },

  onReady() {
    this.drawRadar();
  },

  onShow() {
    syncTabBarSelected(this, 2);
    if (this.data.showCropper) {
      setTabBarHidden(this, true);
    }
    const isLoggedIn = getApp<IAppOption>().globalData.isLoggedIn;
    if (isLoggedIn !== this.data.isLoggedIn) {
      this.applyProfile(isLoggedIn);
    }
    const theme = getAppTheme();
    if (this.data.profile.theme !== theme) {
      this.setData({ 'profile.theme': theme });
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
      cover: stored.cover,
      theme: getAppTheme(),
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
