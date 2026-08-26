/**
 * ============================================================================
 * 店铺页数据
 * ============================================================================
 * 三个 V5 画板收成一页三个 Tab：赛事 325:359、球员榜 326:359、品牌相册 326:463。
 *
 * 【id 怎么来】
 * 赛事卡场馆行带 ?id=chancheng（默认禅城店）。广州润盈 / 松山湖也能对上，
 * 对不上就退回禅城店，避免空白页。
 *
 * 【赛事从哪来】
 * 不另写一份赛事表，按 venue 名字去筛首页和超级杯已有的卡，再去掉 venueLink
 * （已经在店铺里，底部再跳店铺会绕圈）。
 *
 * 【球员榜】
 * 复用 mock/ranking.ts 的 rankPlayers。嘉得路积分榜 = 积分，参赛活跃榜没有
 * 单独字段，暂用战力顶上，接云开发后换成出场次数。
 *
 * 【相册】
 * 照片全部复用 mock/gallery.ts 已有路径，不新增图。头图 / 店徽来自 Figma 导出。
 */
import { GALLERY_SECTIONS } from './gallery';
import { MOCK_EVENTS } from './home';
import type { EventItem } from './home';
import { formatMetric, rankPlayers } from './ranking';
import type { RankingRow } from './ranking';
import { SUPER_CUP_EVENTS } from './super-cup';

export type VenueTab = 'events' | 'ranking' | 'album';
export type HeroPill = 'cover' | 'featured' | 'events';
export type RankingBoard = 'points' | 'activity';

export interface VenueTabItem {
  key: VenueTab;
  label: string;
}

export interface HeroPillItem {
  key: HeroPill;
  label: string;
}

export interface VenueInfo {
  id: string;
  name: string;
  slogan: string;
  bio: string;
  avatar: string;
  hero: Record<HeroPill, string>;
  eventCount: number;
  playerCount: number;
  /** 用来匹配赛事卡上的 venue 文案，包含别名 */
  venueNames: string[];
}

export interface VenueAlbumGroup {
  id: string;
  title: string;
  date?: string;
  photos: string[];
  albumId?: string;
}

export interface VenueAlbum {
  cover: string;
  coverUrls: string[];
  featured: string[];
  events: VenueAlbumGroup[];
}

export const VENUE_TABS: VenueTabItem[] = [
  { key: 'events', label: '赛事' },
  { key: 'ranking', label: '球员榜' },
  { key: 'album', label: '品牌相册' },
];

export const HERO_PILLS: HeroPillItem[] = [
  { key: 'cover', label: '品牌封面' },
  { key: 'featured', label: '精选合辑' },
  { key: 'events', label: '赛事相册' },
];

export const RANKING_BOARDS: { key: RankingBoard; label: string }[] = [
  { key: 'points', label: '嘉得路积分榜' },
  { key: 'activity', label: '参赛活跃榜' },
];

export const YEAR_OPTIONS = ['26年榜', '25年榜', '生涯榜'];
export const CATEGORY_OPTIONS = ['全部项目', '混双', '男双', '团体'];

const HERO = '/assets/images/venue/hero.jpg';
const AVATAR = '/assets/images/venue/avatar.jpg';
const FEATURED_HERO = '/assets/images/banners/banner-06-mixed-doubles-photo.jpg';
const EVENTS_HERO = '/assets/images/gallery/photo-1.jpg';

const GALLERY_PHOTOS = GALLERY_SECTIONS.flatMap((section) => section.photos);

export const VENUES: VenueInfo[] = [
  {
    id: 'chancheng',
    name: '佛山球球热网球禅城店',
    slogan: '禅城室内外硬地灯光场，常年承办嘉得路评级赛。',
    bio: '硬地灯光场室内外均可赛，夜场常开到 22:00。评级赛、混双公开赛和俱乐部活动都在这里办。',
    avatar: AVATAR,
    hero: { cover: HERO, featured: FEATURED_HERO, events: EVENTS_HERO },
    eventCount: 12,
    playerCount: 86,
    venueNames: ['佛山球球热网球禅城店', '球球热网球禅城店', '佛山禅城店', '佛山 · 球球热'],
  },
  {
    id: 'runying',
    name: '广州润盈网球中心',
    slogan: '广州室内外硬地灯光场，常年承办嘉得路俱乐部赛。',
    bio: '润盈是广州站主场馆之一，超级杯和新秀杯团体赛常在这里打。',
    avatar: AVATAR,
    hero: { cover: HERO, featured: FEATURED_HERO, events: EVENTS_HERO },
    eventCount: 8,
    playerCount: 64,
    venueNames: ['广州润盈网球中心', '广州润盈', '润盈网球'],
  },
  {
    id: 'songshan',
    name: '东莞松山湖 TC',
    slogan: '松山湖室外硬地场，常青杯团体赛主场。',
    bio: '东莞站主场馆，常青杯和部分积分赛在这里办。',
    avatar: AVATAR,
    hero: { cover: HERO, featured: FEATURED_HERO, events: EVENTS_HERO },
    eventCount: 6,
    playerCount: 48,
    venueNames: ['东莞松山湖 TC', '松山湖', '东莞松山湖'],
  },
];

const DEFAULT_VENUE = VENUES[0];

export function getVenue(id?: string): VenueInfo {
  return VENUES.find((item) => item.id === id) ?? DEFAULT_VENUE;
}

function matchesVenue(venue: string, info: VenueInfo): boolean {
  return info.venueNames.some((name) => venue.includes(name) || name.includes(venue));
}

export function venueIdByName(venue: string): string {
  const hit = VENUES.find((item) => matchesVenue(venue, item));
  return hit?.id ?? DEFAULT_VENUE.id;
}

function collectEvents(): EventItem[] {
  const seen = new Set<string>();
  const out: EventItem[] = [];
  const push = (item: EventItem) => {
    if (seen.has(item.id)) {
      return;
    }
    seen.add(item.id);
    out.push(item);
  };
  Object.values(MOCK_EVENTS).forEach((list) => list.forEach(push));
  Object.values(SUPER_CUP_EVENTS).forEach((list) => list.forEach(push));
  return out;
}

/** 点赛事卡场馆行时，用赛事 id 反查该跳哪家店 */
export function venueIdByEventId(eventId?: string): string {
  if (!eventId) {
    return DEFAULT_VENUE.id;
  }
  const hit = collectEvents().find((item) => item.id === eventId);
  return hit ? venueIdByName(hit.venue) : DEFAULT_VENUE.id;
}

/**
 * 这家店的赛事列表。venueLink 去掉，避免在店铺页再点场馆行绕回来。
 * 缺 grade / tags 的卡（日历那种旧结构）不收，event-card 会缺一块。
 */
export function getVenueEvents(id: string): EventItem[] {
  const venue = getVenue(id);
  return collectEvents()
    .filter((item) => matchesVenue(item.venue, venue) && item.grade)
    .map((item) => ({ ...item, venueLink: false }));
}

function metricOf(board: RankingBoard): string {
  return board === 'activity' ? '战力' : '积分';
}

export function scoreHeaderOf(board: RankingBoard): string {
  return board === 'activity' ? '活跃值' : '嘉得路积分';
}

/** 店铺球员榜不拆领奖台，前几名也走列表。默认取前 8 行，和稿上 5 行同量级 */
export function getVenueRanking(board: RankingBoard): RankingRow[] {
  const metric = metricOf(board);
  return rankPlayers('全国榜', metric)
    .slice(0, 8)
    .map((player, index) => ({
      rank: index + 1,
      nickname: player.nickname,
      club: player.club,
      score: formatMetric(board === 'activity' ? player.power : player.points, metric),
      badge: player.badge,
      avatar: player.avatar,
    }));
}

function photosAt(start: number, count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(GALLERY_PHOTOS[(start + i) % GALLERY_PHOTOS.length]);
  }
  return out;
}

export function getVenueAlbum(id: string): VenueAlbum {
  const venue = getVenue(id);
  const rating = GALLERY_SECTIONS.find((section) => section.id === 'rating-70');
  const superCup = GALLERY_SECTIONS.find((section) => section.id === 'super-cup-1');
  return {
    cover: venue.hero.cover,
    coverUrls: [venue.hero.cover],
    featured: photosAt(0, 6),
    events: [
      {
        id: 'album-rating',
        title: '7.0混双评级赛',
        date: '08/24',
        photos: rating?.photos ?? photosAt(2, 3),
        albumId: rating?.id,
      },
      {
        id: 'album-night',
        title: '夜间混双公开赛',
        date: '08/19',
        photos: superCup?.photos ?? photosAt(5, 3),
        albumId: superCup?.id,
      },
    ],
  };
}
