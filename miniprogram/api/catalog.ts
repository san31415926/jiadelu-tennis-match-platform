/**
 * ============================================================================
 * 俱乐部 / 榜单 / 相册 / 店铺 / 参赛记录 —— 页面只调这里
 * ============================================================================
 *
 * 【开关】config/env.ts 的 USE_MOCK.clubs / ranking。
 * true：继续读 mock/club.ts、mock/ranking.ts 等。
 * false：读云数据库 clubs / club_members / players / galleries / venues / match_records。
 *
 * 第一次打开会跟赛事一起调 seedMock，空集合才灌入现在的假数据。
 * 「已加入」不写进 clubs，按当前用户的 club_members / users.clubId 算。
 * 主页「成员」人数按 club_members 实数，不读种子里写死的 24。
 * 「我的」生涯卡的俱乐部排名、人数、参赛场次都不写 users，进页时按云库现算。
 * 参赛记录只认当前用户自己的 match_records，没有就空，不要回落演示赛。
 * 球员榜「积分」优先用 match_records.rankPoints 的 52 周滚动合计，
 * 没有巡回赛积分时才退回 players.points。这不是 ATP/ITF 官方分。
 */
import { USE_MOCK } from '../config/env';
import { callCloud, cloudDb } from './cloud';
import { readSession, writeSession } from './auth';
import { dateKeyInRankWindow, rawUid } from '../utils/player-id';

import {
  CLUB_LIST,
  CLUB_MEMBERS,
  clubsForViewer,
  filterClubList,
  getClubHome,
  getJoinedClub,
  withViewerJoinState,
} from '../mock/club';
import type { ClubItem, ClubMember } from '../mock/club';
import {
  RANKED_CLUBS,
  clubSuperCupStatsOf,
  myClubRankingOf,
  rankGivenClubs,
} from '../mock/club-ranking';
import type { RankedClub } from '../mock/club-ranking';
import { PLAYERS } from '../mock/ranking';
import type { RankedPlayer } from '../mock/ranking';
import {
  GALLERY_SECTIONS,
  filterSectionList,
  getGallerySection,
} from '../mock/gallery';
import type { GallerySection } from '../mock/gallery';
import {
  RECORDS,
  RECORDS_SUMMARY,
  buildRecordsSummary,
  filterRecordList,
  toCareerRecordCard,
} from '../mock/records';
import type { MatchRecord, RecordFilter, RecordsSummary } from '../mock/records';
import type { EventItem } from '../mock/home';
import {
  VENUES,
  getVenue,
  getVenueAlbum,
  getVenueEvents,
  getVenueRanking,
  venueAlbumFrom,
  emptyVenueAlbum,
  venueEventsFrom,
  venueRankingFromPlayers,
} from '../mock/venue';
import type { RankingBoard, VenueAlbum, VenueInfo } from '../mock/venue';
import { POSTER_PAGES } from '../mock/posters';
import type { PosterPage } from '../mock/posters';
import type { RankingRow } from '../mock/ranking';

const HOME_MEMBER_LIMIT = 50;

function cloudReady(): boolean {
  return !!getApp<IAppOption>().globalData.cloudReady;
}

function useMockClubs(): boolean {
  return USE_MOCK.clubs || !cloudReady();
}

function useMockRanking(): boolean {
  return USE_MOCK.ranking || !cloudReady();
}

function metaOf(members: number, power: number, founded: string): string {
  return `成员 ${members} 人 · 战力 ${power} · 成立 ${founded}`;
}

/** 从现有 mock 收成种子，给 seedMock 按集合灌库 */
export function collectCatalogSeed(): {
  clubs: Record<string, unknown>[];
  members: Record<string, unknown>[];
  players: Record<string, unknown>[];
  galleries: Record<string, unknown>[];
  venues: Record<string, unknown>[];
  records: Record<string, unknown>[];
  posters: Record<string, unknown>[];
} {
  const clubById: Record<string, Record<string, unknown>> = {};

  CLUB_LIST.forEach((club) => {
    const { joined: _joined, ...rest } = club;
    const roster = CLUB_MEMBERS[club.id];
    const count = roster && roster.length ? roster.length : rest.members;
    clubById[club.id] = {
      ...rest,
      members: count,
      meta: metaOf(count, rest.power, rest.founded),
    };
  });

  RANKED_CLUBS.forEach((ranked, index) => {
    const existing = clubById[ranked.id] || {
      id: ranked.id,
      name: ranked.name,
      logo: ranked.logo,
      members: ranked.members,
      power: ranked.monthPower,
      founded: '2025-01-01',
      meta: metaOf(ranked.members, ranked.monthPower, '2025-01-01'),
      city: ranked.city,
      recruiting: false,
      powerRank: 70 + index,
    };
    clubById[ranked.id] = {
      ...existing,
      monthPoints: ranked.monthPoints,
      monthPower: ranked.monthPower,
      points: ranked.points,
      rankPower: ranked.power,
    };
  });

  const members: Record<string, unknown>[] = [];
  Object.keys(CLUB_MEMBERS).forEach((clubId) => {
    CLUB_MEMBERS[clubId].forEach((member) => {
      members.push({
        id: `${clubId}_${member.id}`,
        clubId,
        memberId: member.id,
        nickname: member.nickname,
        avatar: member.avatar,
        joinedAt: member.joinedAt,
        power: member.power,
        captain: !!member.captain,
      });
    });
  });

  return {
    clubs: Object.keys(clubById).map((id) => clubById[id]),
    members,
    players: PLAYERS.map((player) => ({ ...player })),
    galleries: GALLERY_SECTIONS.map((section) => ({ ...section })),
    venues: VENUES.map((venue) => ({ ...venue })),
    records: RECORDS.map((row) => ({ ...row, demo: true })),
    posters: Object.keys(POSTER_PAGES).map((id) => ({ id, ...POSTER_PAGES[id] })),
  };
}

function asClubItem(row: Record<string, unknown>, joinedId: string): ClubItem {
  const id = String(row.id || row._id || '');
  return {
    id,
    name: String(row.name || ''),
    logo: String(row.logo || '/assets/images/club/logo-1.jpg'),
    meta: String(row.meta || ''),
    members: Number(row.members || 0),
    power: Number(row.power || 0),
    founded: String(row.founded || ''),
    city: String(row.city || ''),
    recruiting: !!row.recruiting,
    powerRank: Number(row.powerRank || 999),
    rankBadge: row.rankBadge ? String(row.rankBadge) : undefined,
    joined: id === joinedId,
  };
}

function asRankedClub(row: Record<string, unknown>): RankedClub {
  return {
    id: String(row.id || row._id || ''),
    name: String(row.name || ''),
    city: String(row.city || ''),
    logo: String(row.logo || '/assets/images/club/logo-1.jpg'),
    members: Number(row.members || 0),
    monthPoints: Number(row.monthPoints || 0),
    monthPower: Number(row.monthPower || 0),
    points: Number(row.points || 0),
    power: Number(row.rankPower || row.power || 0),
  };
}

function asMember(row: Record<string, unknown>): ClubMember {
  return {
    id: String(row.memberId || row.id || ''),
    nickname: String(row.nickname || ''),
    avatar: String(row.avatar || '/assets/images/avatars/anime-01.jpg'),
    joinedAt: String(row.joinedAt || ''),
    power: Number(row.power || 0),
    captain: !!row.captain,
  };
}

function todayJoinedLabel(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `加入 ${y}-${m}-${d}`;
}

function isSelfMember(item: ClubMember, nickname: string, uid: string): boolean {
  if (item.id === 'self') {
    return true;
  }
  if (nickname && item.nickname === nickname) {
    return true;
  }
  return !!(uid && String(item.id).indexOf(uid) >= 0);
}

/** 已加入却不在名单里时补上自己，队长在前、自己其次。 */
function ensureSelfInMembers(members: ClubMember[], joined: boolean): ClubMember[] {
  const list = members.slice();
  if (!joined) {
    return list;
  }
  const session = readSession();
  if (!session) {
    return list;
  }
  const nickname = String(session.nickname || '').trim();
  const uid = rawUid(String(session.uid || ''));
  if (!list.some((item) => isSelfMember(item, nickname, uid))) {
    const power = Number((session as { power?: number }).power || 0);
    list.unshift({
      id: 'self',
      nickname: nickname || '我',
      avatar: session.avatar || '/assets/images/avatars/anime-01.jpg',
      joinedAt: todayJoinedLabel(),
      power,
      captain: !list.some((item) => item.captain),
    });
  }
  list.sort((a, b) => {
    if (!!a.captain !== !!b.captain) {
      return a.captain ? -1 : 1;
    }
    const aSelf = isSelfMember(a, nickname, uid);
    const bSelf = isSelfMember(b, nickname, uid);
    if (aSelf !== bSelf) {
      return aSelf ? -1 : 1;
    }
    return (b.power || 0) - (a.power || 0);
  });
  return list;
}

async function countClubMembers(clubId: string, fallback: number): Promise<number> {
  try {
    const counted = await cloudDb().collection('club_members').where({ clubId }).count();
    if (typeof counted.total === 'number') {
      return counted.total;
    }
  } catch (error) {
    console.warn('数俱乐部成员失败', error);
  }
  return fallback;
}

function withMemberCount(club: ClubItem, total: number): ClubItem {
  return {
    ...club,
    members: total,
    meta: metaOf(total, club.power, club.founded),
  };
}

function asPlayer(row: Record<string, unknown>): RankedPlayer {
  return {
    id: String(row.id || row._id || ''),
    nickname: String(row.nickname || ''),
    club: String(row.club || ''),
    badge: String(row.badge || ''),
    avatar: String(row.avatar || '/assets/images/avatars/anime-01.jpg'),
    city: String(row.city || ''),
    points: Number(row.points || 0),
    marketValue: Number(row.marketValue || 0),
    power: Number(row.power || 0),
  };
}

function asGallery(row: Record<string, unknown>): GallerySection {
  const section = row as unknown as GallerySection;
  const photos = Array.isArray(section.photos) ? section.photos : [];
  return {
    ...section,
    photos,
    count: `${photos.length} 张`,
  };
}

function asVenue(row: Record<string, unknown>): VenueInfo {
  return row as unknown as VenueInfo;
}

function asRecord(row: Record<string, unknown>): MatchRecord {
  return {
    id: String(row.id || row._id || ''),
    eventId: String(row.eventId || ''),
    title: String(row.title || ''),
    date: String(row.date || ''),
    category: String(row.category || ''),
    venue: String(row.venue || ''),
    result: row.result === '负' ? '负' : '胜',
    score: String(row.score || ''),
  };
}

function asEventItem(row: Record<string, unknown>): EventItem {
  return row as unknown as EventItem;
}

function patchClubSession(
  clubId: string,
  clubName: string,
  extra?: { clubRank?: string; clubMembers?: string },
) {
  const session = readSession();
  if (!session) {
    return;
  }
  writeSession({
    ...session,
    club: clubName,
    clubId,
    clubRank: extra && extra.clubRank != null ? extra.clubRank : session.clubRank,
    clubMembers: extra && extra.clubMembers != null ? extra.clubMembers : session.clubMembers,
  });
}

function clearClubSession() {
  const session = readSession();
  if (!session || (!session.clubId && !session.club)) {
    return false;
  }
  writeSession({
    ...session,
    club: '',
    clubId: '',
    clubRank: '--',
    clubMembers: '--',
  });
  return true;
}

/** 用云函数归属覆盖本机 session。资料页保存曾把 club 写成空，这里补回来。 */
export async function syncMyClubSession(): Promise<boolean> {
  if (useMockClubs() || !getApp<IAppOption>().globalData.isLoggedIn) {
    return false;
  }
  try {
    const res = await callCloud<{ clubId?: string; clubName?: string }>('clubAction', {
      action: 'mine',
    });
    const clubId = String(res.clubId || '');
    const clubName = String(res.clubName || '');
    if (!clubId) {
      return clearClubSession();
    }
    const session = readSession();
    if (session && session.clubId === clubId && session.club === clubName) {
      return false;
    }
    patchClubSession(clubId, clubName);
    return true;
  } catch (error) {
    console.warn('同步俱乐部归属失败', error);
    return false;
  }
}

async function queryMyClubId(): Promise<string> {
  const profile = readSession();
  if (profile && profile.clubId) {
    return profile.clubId;
  }
  if (!getApp<IAppOption>().globalData.isLoggedIn) {
    return '';
  }
  await syncMyClubSession();
  return readSession()?.clubId || '';
}

async function queryCollection(name: string, limit = 20): Promise<Record<string, unknown>[]> {
  const res = await cloudDb().collection(name).limit(limit).get();
  return (res.data || []) as Record<string, unknown>[];
}

export async function listClubs(filter: string, keyword: string): Promise<ClubItem[]> {
  const isLoggedIn = getApp<IAppOption>().globalData.isLoggedIn;
  if (useMockClubs()) {
    return clubsForViewer(filterClubList(CLUB_LIST, filter, keyword), isLoggedIn);
  }
  try {
    const [rows, joinedId] = await Promise.all([queryCollection('clubs', 50), queryMyClubId()]);
    const clubs = rows.map((row) => asClubItem(row, joinedId));
    return clubsForViewer(filterClubList(clubs, filter, keyword), isLoggedIn);
  } catch (error) {
    console.warn('读俱乐部列表失败', error);
    return [];
  }
}

export async function loadClubHome(id: string): Promise<{
  club: ClubItem;
  members: ClubMember[];
  shownLabel: string;
  ranked: RankedClub[];
}> {
  if (useMockClubs()) {
    const home = getClubHome(id);
    const isLoggedIn = getApp<IAppOption>().globalData.isLoggedIn;
    const club = withViewerJoinState(home.club, isLoggedIn);
    const members = ensureSelfInMembers(home.members, !!club.joined);
    return {
      club: withMemberCount(club, members.length),
      members,
      shownLabel: `${members.length} 人`,
      ranked: RANKED_CLUBS,
    };
  }
  try {
    const joinedId = await queryMyClubId();
    const clubRes = await cloudDb().collection('clubs').doc(id).get();
    const row = clubRes.data as Record<string, unknown> | undefined;
    if (!row) {
      throw new Error('俱乐部不存在');
    }
    const memberRes = await cloudDb()
      .collection('club_members')
      .where({ clubId: id })
      .limit(HOME_MEMBER_LIMIT)
      .get();
    const joined = joinedId === id;
    const listed = ensureSelfInMembers(
      (memberRes.data || []).map((item) => asMember(item as Record<string, unknown>)),
      joined,
    );
    const total = Math.max(listed.length, await countClubMembers(id, listed.length));
    const club = withMemberCount(asClubItem(row, joinedId), total);
    const rankedRows = await queryCollection('clubs', 50);
    return {
      club,
      members: listed,
      shownLabel: `${total} 人`,
      ranked: rankedRows.map((item) => asRankedClub(item)),
    };
  } catch (error) {
    console.warn('读俱乐部主页失败', error);
    if (error instanceof Error && error.message === '俱乐部不存在') {
      throw error;
    }
    throw new Error('俱乐部加载失败');
  }
}

export async function getMyClub(): Promise<ClubItem | undefined> {
  if (useMockClubs()) {
    const isLoggedIn = getApp<IAppOption>().globalData.isLoggedIn;
    return isLoggedIn ? getJoinedClub() : undefined;
  }
  try {
    const joinedId = await queryMyClubId();
    if (!joinedId) {
      return undefined;
    }
    const res = await cloudDb().collection('clubs').doc(joinedId).get();
    const row = res.data
      ? (res.data as Record<string, unknown>)
      : ((await cloudDb().collection('clubs').where({ id: joinedId }).limit(1).get()).data || [])[0];
    if (!row) {
      return undefined;
    }
    const club = asClubItem(row as Record<string, unknown>, joinedId);
    const total = await countClubMembers(club.id, club.members);
    return withMemberCount(club, total);
  } catch (error) {
    console.warn('读我的俱乐部失败', error);
    return undefined;
  }
}

function cardFromClub(club: ClubItem, ranked: RankedClub[]) {
  const has = ranked.some((item) => item.id === club.id);
  const list = has
    ? ranked
    : ranked.concat([
        {
          id: club.id,
          name: club.name,
          city: club.city,
          logo: club.logo,
          members: club.members,
          monthPoints: 0,
          monthPower: 0,
          points: 0,
          power: club.power,
        },
      ]);
  const index = rankGivenClubs(list, '战力', '累计').findIndex((item) => item.id === club.id);
  return {
    clubId: club.id,
    clubName: club.name,
    clubRank: index >= 0 ? `第${index + 1}` : '--',
    clubMembers: `${club.members}人`,
  };
}

/** 「我的」生涯卡：俱乐部名 / 战力榜名次 / 人数，按当前加入的那一家现算。 */
export async function loadMyClubCard(): Promise<{
  clubId: string;
  clubName: string;
  clubRank: string;
  clubMembers: string;
} | null> {
  const mine = await getMyClub();
  if (!mine) {
    return null;
  }
  const ranked = useMockClubs() ? RANKED_CLUBS.slice() : await listRankedClubs();
  return cardFromClub(mine, ranked);
}

export function clubHomeStats(
  club: ClubItem,
  ranked: RankedClub[],
  fromSuperCup: boolean,
): { value: string; label: string; lime?: boolean }[] {
  if (!fromSuperCup) {
    return [
      { value: String(club.power), label: '总战力', lime: true },
      { value: String(club.members), label: '成员' },
      { value: `#${club.powerRank}`, label: '战力榜' },
    ];
  }
  if (!ranked.length) {
    return [
      { value: '0', label: '本月积分', lime: true },
      { value: String(club.power), label: '总战力', lime: true },
      { value: '--', label: '积分榜' },
      { value: club.powerRank ? `#${club.powerRank}` : '--', label: '战力榜' },
    ];
  }
  const stats = clubSuperCupStatsOf(ranked, club.id);
  return [
    { value: String(stats.monthPoints), label: '本月积分', lime: true },
    { value: String(stats.power), label: '总战力', lime: true },
    { value: `#${stats.pointsRank}`, label: '积分榜' },
    { value: `#${stats.powerRank}`, label: '战力榜' },
  ];
}

export async function joinClub(
  clubId: string,
): Promise<{ already: boolean; clubId: string; clubName: string }> {
  if (useMockClubs()) {
    throw new Error('俱乐部还在走假数据');
  }
  const res = await callCloud<{ already?: boolean; clubId: string; clubName: string }>(
    'clubAction',
    { action: 'join', clubId },
  );
  patchClubSession(res.clubId, res.clubName);
  return { already: !!res.already, clubId: res.clubId, clubName: res.clubName };
}

export async function createClub(
  name: string,
  city?: string,
): Promise<{ clubId: string; clubName: string }> {
  if (useMockClubs()) {
    throw new Error('俱乐部还在走假数据');
  }
  const res = await callCloud<{ clubId: string; clubName: string }>('clubAction', {
    action: 'create',
    name,
    city: city || '',
  });
  patchClubSession(res.clubId, res.clubName);
  return { clubId: res.clubId, clubName: res.clubName };
}

export async function listRankedPlayers(): Promise<RankedPlayer[]> {
  if (useMockRanking()) {
    return PLAYERS.slice();
  }
  try {
    const rows = await queryCollection('players', 50);
    const players = rows.map((row) => asPlayer(row));
    const records = await queryCollection('match_records', 100);
    const sums: Record<string, number> = {};
    records.forEach((row) => {
      if (row.demo) {
        return;
      }
      const pts = Number(row.rankPoints || 0);
      if (!pts) {
        return;
      }
      const key = String(row.dateKey || '').slice(0, 10);
      if (key && !dateKeyInRankWindow(key)) {
        return;
      }
      const pid = String(row.playerId || row._openid || row.id || '');
      if (!pid) {
        return;
      }
      sums[pid] = (sums[pid] || 0) + pts;
    });
    if (!Object.keys(sums).length) {
      return players;
    }
    return players.map((player) => {
      const extra = sums[player.id];
      return extra ? { ...player, points: extra } : player;
    });
  } catch (error) {
    console.warn('读球员榜失败', error);
    return [];
  }
}

export async function listRankedClubs(): Promise<RankedClub[]> {
  if (useMockRanking() && useMockClubs()) {
    return RANKED_CLUBS.slice();
  }
  try {
    const rows = await queryCollection('clubs', 50);
    return rows.map((row) => asRankedClub(row));
  } catch (error) {
    console.warn('读俱乐部榜失败', error);
    return [];
  }
}

export function myClubBoard(
  clubs: RankedClub[],
  clubId: string,
  metric: string,
  period: string,
) {
  return myClubRankingOf(clubs, clubId, metric, period);
}

export { rankGivenClubs };

export async function listGalleries(): Promise<GallerySection[]> {
  if (useMockClubs()) {
    return GALLERY_SECTIONS.slice();
  }
  try {
    const rows = await queryCollection('galleries', 50);
    return rows.map((row) => asGallery(row));
  } catch (error) {
    console.warn('读相册失败', error);
    return [];
  }
}

export function gallerySummaryOf(sections: GallerySection[]): string {
  const total = sections.reduce((sum, section) => sum + (section.photos || []).length, 0);
  return total > 0 ? `记录每一个高光瞬间 · 共 ${total} 张` : '还没有赛事照片';
}

export function galleriesOfFilter(
  sections: GallerySection[],
  filter: string,
): GallerySection[] {
  return filterSectionList(sections, filter);
}

export async function loadGallerySection(id: string): Promise<GallerySection> {
  if (useMockClubs()) {
    return getGallerySection(id);
  }
  try {
    const res = await cloudDb().collection('galleries').doc(id).get();
    if (res.data) {
      return asGallery(res.data as Record<string, unknown>);
    }
    const found = await cloudDb().collection('galleries').where({ id }).limit(1).get();
    const row = found.data && found.data[0];
    if (row) {
      return asGallery(row as Record<string, unknown>);
    }
  } catch (error) {
    console.warn('读相册详情失败', error);
  }
  throw new Error('找不到这个相册');
}

export async function loadPosterPage(id: string): Promise<PosterPage> {
  const key = String(id || '').trim() || 'rewards';
  if (useMockClubs()) {
    return POSTER_PAGES[key] || POSTER_PAGES.rewards;
  }
  try {
    const res = await cloudDb().collection('posters').doc(key).get();
    if (res.data) {
      const row = res.data as Record<string, unknown>;
      return {
        title: String(row.title || ''),
        notice: String(row.notice || ''),
        poster: String(row.poster || ''),
      };
    }
  } catch (error) {
    console.warn('读海报失败', error);
  }
  const local = POSTER_PAGES[key] || POSTER_PAGES.rewards;
  return local;
}

export async function listMatchRecords(): Promise<{
  records: MatchRecord[];
  summary: RecordsSummary;
}> {
  if (useMockClubs()) {
    return { records: RECORDS.slice(), summary: RECORDS_SUMMARY };
  }
  try {
    const mine = await cloudDb()
      .collection('match_records')
      .where({ _openid: '{openid}' })
      .limit(50)
      .get();
    const records = ((mine.data || []) as Record<string, unknown>[]).map((row) => asRecord(row));
    return { records, summary: buildRecordsSummary(records) };
  } catch (error) {
    console.warn('读参赛记录失败', error);
    return { records: [], summary: buildRecordsSummary([]) };
  }
}

export { toCareerRecordCard };

export function recordsOfFilter(
  records: MatchRecord[],
  filter: RecordFilter,
): MatchRecord[] {
  return filterRecordList(records, filter);
}

export async function loadVenuePage(
  id: string | undefined,
  board: RankingBoard,
): Promise<{
  venue: VenueInfo;
  events: EventItem[];
  ranking: RankingRow[];
  album: VenueAlbum;
}> {
  if (useMockClubs() && useMockRanking()) {
    const venue = getVenue(id);
    return {
      venue,
      events: getVenueEvents(venue.id),
      ranking: getVenueRanking(board),
      album: getVenueAlbum(venue.id),
    };
  }
  try {
    const [venueRows, eventRows, players, galleries] = await Promise.all([
      queryCollection('venues'),
      queryCollection('events', 50),
      listRankedPlayers(),
      listGalleries(),
    ]);
    const venues = venueRows.map((row) => asVenue(row));
    const venue = venues.find((item) => item.id === id) ?? venues[0];
    if (!venue) {
      throw new Error('没有店铺');
    }
    const events = venueEventsFrom(
      eventRows.map((row) => asEventItem(row)),
      venue,
    );
    return {
      venue: {
        ...venue,
        eventCount: events.length,
        playerCount: players.length,
      },
      events,
      ranking: venueRankingFromPlayers(players, board),
      album: venueAlbumFrom(venue, galleries),
    };
  } catch (error) {
    console.warn('读店铺失败', error);
    const venue = getVenue(id);
    return {
      venue: { ...venue, eventCount: 0, playerCount: 0 },
      events: [],
      ranking: [],
      album: emptyVenueAlbum(venue),
    };
  }
}
