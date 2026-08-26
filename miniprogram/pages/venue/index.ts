/**
 * ============================================================================
 * 店铺页逻辑
 * ============================================================================
 * 视觉刷新草稿三个画板收成一页：
 *   赛事     325:359
 *   球员榜   326:359
 *   品牌相册 326:463
 *
 * 【三个 Tab 为什么能收成一页】
 * 前两块共用头图 + 店铺资料卡，只是下面列表不同；相册稿是独立白底页。
 * 切到「品牌相册」时藏掉头图，改用 page-nav，和稿上两套版式对齐。
 *
 * 【头图那一排胶囊】
 * 品牌封面 / 精选合辑 只换头图。点「赛事相册」或右侧 › 直接切到相册 Tab。
 *
 * 【query】
 * ?id=chancheng 默认禅城店。?tab=album 可直接落到相册。
 * 赛事 / 球员榜 Tab 自己量 statusBarHeight 垫头图上的返回；相册 Tab 改用 page-nav occupy。
 */
import type { EventItem } from '../../mock/home';
import type { RankingRow } from '../../mock/ranking';
import {
  CATEGORY_OPTIONS,
  HERO_PILLS,
  RANKING_BOARDS,
  VENUE_TABS,
  YEAR_OPTIONS,
  getVenue,
  getVenueAlbum,
  getVenueEvents,
  getVenueRanking,
  scoreHeaderOf,
} from '../../mock/venue';
import type {
  HeroPill,
  RankingBoard,
  VenueAlbum,
  VenueInfo,
  VenueTab,
} from '../../mock/venue';
import { headerMetrics } from '../../utils/header';
import { navigateBackOrHome, navigateToEventDetail, navigateToPage } from '../../utils/navigate';
import { themeBehavior } from '../../behaviors/theme';

function asTab(value?: string): VenueTab {
  if (value === 'ranking' || value === 'album' || value === 'events') {
    return value;
  }
  return 'events';
}

Page({
  behaviors: [themeBehavior],
  data: {
    statusBarHeight: 0,
    tabs: VENUE_TABS,
    pills: HERO_PILLS,
    boards: RANKING_BOARDS,
    activeTab: 'events' as VenueTab,
    activePill: 'featured' as HeroPill,
    activeBoard: 'points' as RankingBoard,
    yearLabel: YEAR_OPTIONS[0],
    categoryLabel: '项目',
    expanded: false,
    heroSrc: '',
    venue: {} as VenueInfo,
    events: [] as EventItem[],
    ranking: [] as RankingRow[],
    scoreHeader: scoreHeaderOf('points'),
    album: {} as VenueAlbum,
  },

  onLoad(query: Record<string, string | undefined>) {
    const venue = getVenue(query.id);
    const activeTab = asTab(query.tab);
    this.setData({
      ...headerMetrics(),
      venue,
      activeTab,
      heroSrc: venue.hero.featured,
      events: getVenueEvents(venue.id),
      ranking: getVenueRanking('points'),
      album: getVenueAlbum(venue.id),
    });
  },

  onBack() {
    navigateBackOrHome();
  },

  onPillTap(event: WechatMiniprogram.TouchEvent) {
    const key = String(event.currentTarget.dataset.key) as HeroPill;
    if (key === 'events') {
      this.setData({ activeTab: 'album', activePill: key });
      return;
    }
    this.setData({
      activePill: key,
      heroSrc: this.data.venue.hero[key],
    });
  },

  onOpenAlbum() {
    this.setData({ activeTab: 'album', activePill: 'events' });
  },

  onTabTap(event: WechatMiniprogram.TouchEvent) {
    const key = String(event.currentTarget.dataset.key) as VenueTab;
    this.setData({ activeTab: key });
  },

  onToggleBio() {
    this.setData({ expanded: !this.data.expanded });
  },

  onBoardTap(event: WechatMiniprogram.TouchEvent) {
    const key = String(event.currentTarget.dataset.key) as RankingBoard;
    if (key === this.data.activeBoard) {
      return;
    }
    this.setData({
      activeBoard: key,
      ranking: getVenueRanking(key),
      scoreHeader: scoreHeaderOf(key),
    });
  },

  onYearTap() {
    wx.showActionSheet({
      itemList: YEAR_OPTIONS,
      success: (res) => {
        const label = YEAR_OPTIONS[res.tapIndex];
        if (label) {
          this.setData({ yearLabel: label });
        }
      },
    });
  },

  onCategoryTap() {
    wx.showActionSheet({
      itemList: CATEGORY_OPTIONS,
      success: (res) => {
        const label = CATEGORY_OPTIONS[res.tapIndex];
        if (label) {
          this.setData({ categoryLabel: label === '全部项目' ? '项目' : label });
        }
      },
    });
  },

  onEventTap(event: WechatMiniprogram.CustomEvent<{ id?: string }>) {
    navigateToEventDetail(event.detail.id);
  },

  onPreview(event: WechatMiniprogram.TouchEvent) {
    const current = String(event.currentTarget.dataset.src);
    const urls = event.currentTarget.dataset.urls as string[] | undefined;
    wx.previewImage({ current, urls: urls && urls.length ? urls : [current] });
  },

  onViewGallery() {
    navigateToPage('/pages/gallery/index');
  },

  onAlbumGroup(event: WechatMiniprogram.TouchEvent) {
    const albumId = String(
      event.currentTarget.dataset.albumId || event.currentTarget.dataset.albumid || ''
    );
    if (albumId) {
      navigateToPage(`/pages/album-detail/index?id=${albumId}`);
      return;
    }
    this.onViewGallery();
  },
});
