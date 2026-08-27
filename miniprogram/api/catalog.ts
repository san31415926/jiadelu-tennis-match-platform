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
 */
import { USE_MOCK } from '../config/env';
import { callCloud, cloudDb } from './cloud';
import { readSession, writeSession } from './auth';

import {
  CLUB_LIST,
  CLUB_MEMBERS,
  clubsForViewer,
  filterClubList,
  getClubHome,
  getJoinedClub,
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
} from '../mock/records';
import type { MatchRecord, RecordFilter, RecordsSummary } from '../mock/records';
import {
  VENUES,
  getVenue,
  getVenueAlbum,
  getVenueEvents,
  getVenueRanking,
  venueAlbumFrom,
  venueEventsFrom,
  venueRankingFromPlayers,
} from '../mock/venue';
import type { RankingBoard, VenueAlbum, VenueInfo } from '../mock/venue';
import type { EventItem } from '../mock/home';
import type { RankingRow } from '../mock/ranking';

const HOME_MEMBER_PREVIEW = 6;

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
} {
  const clubById: Record<string, Record<string, unknown>> = {};

  CLUB_LIST.forEach((club) => {
    const { joined: _joined, ...rest } = club;
    clubById[club.id] = { ...rest };
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
  };
}

function asClubItem(row: Record<string, unknown>, joinedId: string): ClubItem {
  return {
    id: String(row.id || ''),
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
    joined: String(row.id || '') === joinedId,
  };
}

function asRankedClub(row: Record<string, unknown>): RankedClub {
  return {
    id: String(row.id || ''),
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

function asPlayer(row: Record<string, unknown>): RankedPlayer {
  return {
    id: String(row.id || ''),
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
  return row as unknown as GallerySection;
}

function asVenue(row: Record<string, unknown>): VenueInfo {
  return row as unknown as VenueInfo;
}

function asRecord(row: Record<string, unknown>): MatchRecord {
  return {
    id: String(row.id || ''),
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

async function queryMyClubId(): Promise<string> {
  const profile = readSession();
  if (profile && profile.clubId) {
    return profile.clubId;
  }
  if (!getApp<IAppOption>().globalData.isLoggedIn) {
    return '';
  }
  try {
    const res = await callCloud<{ clubId?: string }>('clubAction', { action: 'mine' });
    if (res.clubId) {
      return res.clubId;
    }
  } catch (error) {
    console.warn('读我的俱乐部归属失败', error);
  }
  return '';
}

function patchClubSession(clubId: string, clubName: string) {
  const session = readSession();
  if (!session) {
    return;
  }
  writeSession({
    ...session,
    club: clubName,
    clubId,
  });
}

async function queryCollection(name: string): Promise<Record<string, unknown>[]> {
  const res = await cloudDb().collection(name).limit(20).get();
  return (res.data || []) as Record<string, unknown>[];
}

export async function listClubs(filter: string, keyword: string): Promise<ClubItem[]> {
  const isLoggedIn = getApp<IAppOption>().globalData.isLoggedIn;
  if (useMockClubs()) {
    return clubsForViewer(filterClubList(CLUB_LIST, filter, keyword), isLoggedIn);
  }
  try {
    const [rows, joinedId] = await Promise.all([queryCollection('clubs'), queryMyClubId()]);
    if (rows.length === 0) {
      return clubsForViewer(filterClubList(CLUB_LIST, filter, keyword), isLoggedIn);
    }
    const clubs = rows.map((row) => asClubItem(row, joinedId));
    return clubsForViewer(filterClubList(clubs, filter, keyword), isLoggedIn);
  } catch (error) {
    console.warn('读俱乐部列表失败，回落到 mock', error);
    return clubsForViewer(filterClubList(CLUB_LIST, filter, keyword), isLoggedIn);
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
    return { ...home, ranked: RANKED_CLUBS };
  }
  try {
    const joinedId = await queryMyClubId();
    const clubRes = await cloudDb().collection('clubs').doc(id).get();
    const row = clubRes.data as Record<string, unknown> | undefined;
    if (!row) {
      const home = getClubHome(id);
      return { ...home, ranked: RANKED_CLUBS };
    }
    const memberRes = await cloudDb()
      .collection('club_members')
      .where({ clubId: id })
      .limit(20)
      .get();
    const members = (memberRes.data || [])
      .map((item) => asMember(item as Record<string, unknown>))
      .slice(0, HOME_MEMBER_PREVIEW);
    const club = asClubItem(row, joinedId);
    const rankedRows = await queryCollection('clubs');
    const ranked = rankedRows.length
      ? rankedRows.map((item) => asRankedClub(item))
      : RANKED_CLUBS;
    return {
      club,
      members,
      shownLabel: `${members.length} / ${club.members} 人`,
      ranked,
    };
  } catch (error) {
    console.warn('读俱乐部主页失败，回落到 mock', error);
    const home = getClubHome(id);
    return { ...home, ranked: RANKED_CLUBS };
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
    if (!res.data) {
      return undefined;
    }
    return asClubItem(res.data as Record<string, unknown>, joinedId);
  } catch (error) {
    console.warn('读我的俱乐部失败', error);
    return undefined;
  }
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
  const stats = clubSuperCupStatsOf(ranked.length ? ranked : RANKED_CLUBS, club.id);
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
    const rows = await queryCollection('players');
    if (rows.length === 0) {
      return PLAYERS.slice();
    }
    return rows.map((row) => asPlayer(row));
  } catch (error) {
    console.warn('读球员榜失败，回落到 mock', error);
    return PLAYERS.slice();
  }
}

export async function listRankedClubs(): Promise<RankedClub[]> {
  if (useMockRanking() && useMockClubs()) {
    return RANKED_CLUBS.slice();
  }
  try {
    const rows = await queryCollection('clubs');
    if (rows.length === 0) {
      return RANKED_CLUBS.slice();
    }
    return rows.map((row) => asRankedClub(row));
  } catch (error) {
    console.warn('读俱乐部榜失败，回落到 mock', error);
    return RANKED_CLUBS.slice();
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
    const rows = await queryCollection('galleries');
    if (rows.length === 0) {
      return GALLERY_SECTIONS.slice();
    }
    return rows.map((row) => asGallery(row));
  } catch (error) {
    console.warn('读相册失败，回落到 mock', error);
    return GALLERY_SECTIONS.slice();
  }
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
  } catch (error) {
    console.warn('读相册详情失败，回落到 mock', error);
  }
  return getGallerySection(id);
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
      .limit(20)
      .get();
    let rows = (mine.data || []) as Record<string, unknown>[];
    if (rows.length === 0) {
      const demo = await cloudDb()
        .collection('match_records')
        .where({ demo: true })
        .limit(20)
        .get();
      rows = (demo.data || []) as Record<string, unknown>[];
    }
    if (rows.length === 0) {
      return { records: RECORDS.slice(), summary: RECORDS_SUMMARY };
    }
    const records = rows.map((row) => asRecord(row));
    return { records, summary: buildRecordsSummary(records) };
  } catch (error) {
    console.warn('读参赛记录失败，回落到 mock', error);
    return { records: RECORDS.slice(), summary: RECORDS_SUMMARY };
  }
}

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
      queryCollection('events'),
      listRankedPlayers(),
      listGalleries(),
    ]);
    const venues = venueRows.length ? venueRows.map((row) => asVenue(row)) : VENUES;
    const venue = venues.find((item) => item.id === id) ?? venues[0];
    const events = eventRows.length
      ? venueEventsFrom(
          eventRows.map((row) => asEventItem(row)),
          venue,
        )
      : getVenueEvents(venue.id);
    return {
      venue,
      events,
      ranking: venueRankingFromPlayers(players, board),
      album: venueAlbumFrom(venue, galleries),
    };
  } catch (error) {
    console.warn('读店铺失败，回落到 mock', error);
    const venue = getVenue(id);
    return {
      venue,
      events: getVenueEvents(venue.id),
      ranking: getVenueRanking(board),
      album: getVenueAlbum(venue.id),
    };
  }
}
