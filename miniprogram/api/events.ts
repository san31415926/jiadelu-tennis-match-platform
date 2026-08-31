/**
 * ============================================================================
 * 赛事读写 —— 列表 / 详情 / 日历 / 报名
 * ============================================================================
 *
 * 【开关】config/env.ts 的 USE_MOCK.events。
 * true：继续读 mock/home.ts、mock/super-cup.ts、mock/calendar.ts。
 * false：读云数据库 events / registrations。
 *
 * 【字段】返回值对齐 EventItem / EventDetail，页面不用改 wxml。
 * 首页和超级杯用 line 区分：personal / super-cup。
 * 「我的报名」不是一种 status，是当前用户在 registrations 里的记录。
 * 报名由云函数写入，客户端直接查库经常是空的，所以列表走
 * createRegistration({ action: 'list' })。退赛走同一云函数 action=withdraw。
 * 巡回赛级别读 events.tourSeries，不要和详情页 series 品牌文案混用。
 *
 * 启动时 seedMock 只在集合为空时灌一次，不要每次用 mock 覆盖已有赛事。
 * 列表 / 热门 / 详情读云库原文，读失败就空着，不要再回落示例表。
 */
import { USE_MOCK } from '../config/env';
import { CALENDAR_EVENTS } from '../mock/calendar';
import { getEventDetail } from '../mock/event-detail';
import type { EventDetail, EventSignupPreview } from '../mock/event-detail';
import { HOME_BANNERS, HOME_HOT_EVENTS, MOCK_EVENTS } from '../mock/home';
import type { EventItem, HomeBanner, HomeHotEvent } from '../mock/home';
import { SUPER_CUP_BANNERS, SUPER_CUP_EVENTS } from '../mock/super-cup';
import type { SuperCupBanner } from '../mock/super-cup';
import { collectCatalogSeed } from './catalog';
import { callCloud, cloudDb } from './cloud';

export type EventLine = 'personal' | 'super-cup';

function useMockEvents(): boolean {
  if (USE_MOCK.events) {
    return true;
  }
  const app = getApp<IAppOption>();
  return !app.globalData.cloudReady;
}

function asEventItem(row: Record<string, unknown>): EventItem {
  const item = row as unknown as EventItem;
  const id = String(item.id || row._id || '').trim();
  return id ? { ...item, id } : item;
}

function asEventDetail(row: Record<string, unknown>): EventDetail {
  return row as unknown as EventDetail;
}

function emptySignupPreview(): EventSignupPreview {
  return {
    signed: '0',
    waitlist: '0',
    deadline: '',
    slotHint: '',
    maxHint: '',
    notice: '',
    format: 'doubles',
    pairs: [],
  };
}

function normalizeDetail(row: EventDetail, id: string): EventDetail {
  const status =
    row.status === '进行中' || row.status === '已结束' ? row.status : '报名中';
  return {
    ...row,
    id: String(row.id || id),
    status,
    photos: Array.isArray(row.photos) ? row.photos : [],
    featuredPhotos: Array.isArray(row.featuredPhotos) ? row.featuredPhotos : [],
    teamRecruits: Array.isArray(row.teamRecruits) ? row.teamRecruits : [],
    files: Array.isArray(row.files) ? row.files : [],
    overview: Array.isArray(row.overview) ? row.overview : [],
    bracketTabs: Array.isArray(row.bracketTabs) ? row.bracketTabs : ['小组赛'],
    bracketGroups: Array.isArray(row.bracketGroups) ? row.bracketGroups : [],
    schedule: Array.isArray(row.schedule) ? row.schedule : [],
    results: Array.isArray(row.results) ? row.results : [],
    signupPreview: row.signupPreview || emptySignupPreview(),
    news: row.news || { title: '', date: '' },
    rewards: row.rewards || {
      headline: '',
      champion: '',
      runnerUp: '',
      gift: '',
      rules: [],
    },
    venueName: row.venueName || row.venue || '',
  };
}

function parseDateKey(time: string, year = 2026): string {
  const hit = time.match(/(\d{1,2})月(\d{1,2})日/);
  if (!hit) {
    return '';
  }
  const month = hit[1].length < 2 ? `0${hit[1]}` : hit[1];
  const day = hit[2].length < 2 ? `0${hit[2]}` : hit[2];
  return `${year}-${month}-${day}`;
}

function lineOf(id: string): EventLine {
  return id.indexOf('sc-') === 0 ? 'super-cup' : 'personal';
}

function statusOfFilter(filter: string): string {
  if (filter === '进行中' || filter === '已结束' || filter === '报名中') {
    return filter;
  }
  return '报名中';
}

/** 从三份 mock 收成不重复的赛事，带上 line / status / dateKey 给种子函数 */
export function collectSeedEvents(): Record<string, unknown>[] {
  const byId: Record<string, Record<string, unknown>> = {};

  const ingest = (
    table: Record<string, EventItem[]>,
    line: EventLine,
    calendarKey?: string,
  ) => {
    Object.keys(table).forEach((filter) => {
      if (filter === '我的报名') {
        return;
      }
      table[filter].forEach((item) => {
        const detail = getEventDetail(item.id) as unknown as Record<string, unknown>;
        byId[item.id] = {
          ...detail,
          id: item.id,
          line,
          status: statusOfFilter(filter),
          dateKey: calendarKey || parseDateKey(item.time || String(detail.time || '')),
        };
      });
    });
  };

  ingest(MOCK_EVENTS, 'personal');
  ingest(SUPER_CUP_EVENTS, 'super-cup');
  Object.keys(CALENDAR_EVENTS).forEach((dateKey) => {
    CALENDAR_EVENTS[dateKey].forEach((item) => {
      const detail = getEventDetail(item.id) as unknown as Record<string, unknown>;
      const status =
        item.actionText === '查看成绩'
          ? '已结束'
          : item.actionText === '查看对阵'
            ? '进行中'
            : '报名中';
      byId[item.id] = {
        ...detail,
        ...item,
        id: item.id,
        line: lineOf(item.id),
        status,
        dateKey,
      };
    });
  });

  return Object.keys(byId).map((id) => byId[id]);
}

let seedPromise: Promise<void> | null = null;
/** 本次启动灌数已经失败过，不要每次切筛选再卡 20 秒。 */
let seedGaveUp = false;

function shouldSkipSeed(): boolean {
  if (!getApp<IAppOption>().globalData.cloudReady) {
    return true;
  }
  return USE_MOCK.events && USE_MOCK.clubs && USE_MOCK.ranking;
}

/** 空集合才灌；启动时按 mock 覆盖写赛事和俱乐部/榜单/相册等示例，报名和用户资料不清。 */
export function ensureEventsSeeded(): Promise<void> {
  if (shouldSkipSeed() || seedGaveUp) {
    return Promise.resolve();
  }
  if (!seedPromise) {
    seedPromise = callCloud<{ skipped?: boolean }>(
      'seedMock',
      {
        upsertEvents: false,
        upsertCatalog: false,
        events: collectSeedEvents(),
        ...collectCatalogSeed(),
      },
      60000,
    )
      .then(() => undefined)
      .catch((error) => {
        seedGaveUp = true;
        seedPromise = null;
        console.warn('灌示例数据失败，继续读云库', error);
      });
  }
  return seedPromise;
}

function mockList(filter: string, line: EventLine): EventItem[] {
  const table = line === 'super-cup' ? SUPER_CUP_EVENTS : MOCK_EVENTS;
  return (table[filter] || []).slice();
}

async function queryEvents(where: Record<string, unknown>): Promise<EventItem[]> {
  await ensureEventsSeeded();
  const db = cloudDb();
  const res = await db.collection('events').where(where).limit(50).get();
  let rows = (res.data || []).map((row) => asEventItem(row as Record<string, unknown>));
  const line = where.line as EventLine | undefined;
  if (rows.length === 0 && line) {
    const rest = { ...where };
    delete rest.line;
    const fallback = await db.collection('events').where(rest).limit(50).get();
    rows = (fallback.data || [])
      .map((row) => asEventItem(row as Record<string, unknown>))
      .filter((item) => lineOf(item.id) === line);
  }
  return rows;
}

async function queryMyEvents(line: EventLine): Promise<EventItem[]> {
  await ensureEventsSeeded();
  const res = await callCloud<{ events?: Record<string, unknown>[] }>('createRegistration', {
    action: 'list',
  });
  return (res.events || [])
    .map((row) => asEventItem(row))
    .filter((item) => {
      const rec = item as EventItem & { line?: EventLine };
      return (rec.line || lineOf(item.id)) === line;
    });
}

function toHotCard(item: EventItem, index: number): HomeHotEvent {
  const title = item.grade ? `${item.grade}${item.title}` : item.title;
  const subtitle =
    [item.time, item.area || item.district].filter(Boolean).join(' · ') ||
    item.slotCaption ||
    item.venue ||
    '';
  return {
    id: `hot-${item.id}`,
    rank: String(index + 1),
    title,
    subtitle,
    image: item.poster,
    eventId: item.id,
  };
}

async function pickEventCards(line: EventLine, max: number): Promise<HomeHotEvent[]> {
  const open = await queryEvents({ line, status: '报名中' });
  const extra = open.length >= max ? [] : await queryEvents({ line, status: '进行中' });
  const seen: Record<string, true> = {};
  const picked: EventItem[] = [];
  const push = (item: EventItem) => {
    if (!item.id || seen[item.id] || picked.length >= max) {
      return;
    }
    seen[item.id] = true;
    picked.push(item);
  };
  open.concat(extra).forEach(push);
  if (picked.length < Math.min(3, max)) {
    (await queryEvents({ line, status: '已结束' })).forEach(push);
  }
  return picked.map(toHotCard);
}

function toBanners(cards: HomeHotEvent[]): HomeBanner[] {
  return cards.map((card) => ({
    id: card.id,
    title: card.title,
    subtitle: card.subtitle,
    image: card.image,
    target: `/pages/event-detail/index?id=${card.eventId}`,
  }));
}

/** 首页热门横滑：报名中优先，不够再补进行中，最多 4 张，和列表同一批云库赛事。 */
export async function listHotEvents(): Promise<HomeHotEvent[]> {
  if (useMockEvents()) {
    return HOME_HOT_EVENTS.slice();
  }
  try {
    return await pickEventCards('personal', 4);
  } catch (error) {
    console.warn('读热门赛事失败', error);
    return [];
  }
}

/** 首页顶部轮播：用同一批云库赛事，点进去是这场详情，不是写死的宣传卡。 */
export async function listHomeBanners(): Promise<HomeBanner[]> {
  if (useMockEvents()) {
    return HOME_BANNERS.slice();
  }
  try {
    return toBanners(await pickEventCards('personal', 5));
  } catch (error) {
    console.warn('读首页轮播失败', error);
    return [];
  }
}

/** 超级杯头图：俱乐部线赛事，点进去是这场详情。 */
export async function listSuperCupBanners(): Promise<SuperCupBanner[]> {
  if (useMockEvents()) {
    return SUPER_CUP_BANNERS.slice();
  }
  try {
    return toBanners(await pickEventCards('super-cup', 5)).map((item) => ({
      ...item,
      eyebrow: '俱乐部联赛',
    }));
  } catch (error) {
    console.warn('读超级杯轮播失败', error);
    return [];
  }
}

export async function listEventsByFilter(
  filter: string,
  line: EventLine,
): Promise<EventItem[]> {
  if (useMockEvents()) {
    return mockList(filter, line);
  }
  try {
    if (filter === '我的报名') {
      return await queryMyEvents(line);
    }
    return await queryEvents({
      line,
      status: statusOfFilter(filter),
    });
  } catch (error) {
    console.warn('读赛事列表失败', error);
    return [];
  }
}

export async function loadEventDetail(id: string): Promise<EventDetail> {
  const trimmed = String(id || '').trim();
  if (useMockEvents()) {
    return getEventDetail(trimmed);
  }
  await ensureEventsSeeded();
  try {
    const byDoc = await cloudDb().collection('events').doc(trimmed).get();
    if (byDoc.data) {
      return normalizeDetail(asEventDetail(byDoc.data as Record<string, unknown>), trimmed);
    }
  } catch (error) {
    console.warn('按 _id 读赛事详情失败，改查 id 字段', error);
  }
  try {
    const found = await cloudDb().collection('events').where({ id: trimmed }).limit(1).get();
    const row = found.data && found.data[0];
    if (row) {
      return normalizeDetail(asEventDetail(row as Record<string, unknown>), trimmed);
    }
  } catch (error) {
    console.warn('读赛事详情失败', error);
  }
  throw new Error('找不到这场赛事');
}

export async function listCalendarMonth(
  year: number,
  month: number,
): Promise<{ dateKeys: string[]; eventsByDay: Record<string, EventItem[]> }> {
  if (useMockEvents()) {
    return {
      dateKeys: Object.keys(CALENDAR_EVENTS),
      eventsByDay: CALENDAR_EVENTS,
    };
  }

  try {
    await ensureEventsSeeded();
    const mm = month < 10 ? `0${month}` : String(month);
    const start = `${year}-${mm}-01`;
    const end = `${year}-${mm}-31`;
    const db = cloudDb();
    const _ = db.command;
    const res = await db
      .collection('events')
      .where({
        dateKey: _.and(_.gte(start), _.lte(end)),
      })
      .limit(50)
      .get();

    const eventsByDay: Record<string, EventItem[]> = {};
    (res.data || []).forEach((row) => {
      const item = asEventItem(row as Record<string, unknown>);
      const key = String((row as { dateKey?: string }).dateKey || '');
      if (!key) {
        return;
      }
      if (!eventsByDay[key]) {
        eventsByDay[key] = [];
      }
      eventsByDay[key].push(item);
    });

    return {
      dateKeys: Object.keys(eventsByDay),
      eventsByDay,
    };
  } catch (error) {
    console.warn('读日历失败', error);
    return {
      dateKeys: [],
      eventsByDay: {},
    };
  }
}

export async function submitRegistration(payload: {
  eventId: string;
  mode: '单人' | '组队';
  partnerUid?: string;
}): Promise<{ duplicated: boolean; status?: string }> {
  if (useMockEvents()) {
    return { duplicated: false, status: 'pending' };
  }
  const res = await callCloud<{ duplicated?: boolean; status?: string }>('createRegistration', {
    eventId: payload.eventId,
    mode: payload.mode,
    partnerUid: payload.partnerUid || '',
  });
  return { duplicated: !!res.duplicated, status: res.status || 'pending' };
}
  return { duplicated: !!res.duplicated };
}

export async function listMyRegistrations(): Promise<
  { id: string; eventId: string; status: string }[]
> {
  if (useMockEvents()) {
    return [];
  }
  const res = await callCloud<{
    registrations?: { _id?: string; eventId?: string; status?: string }[];
  }>('createRegistration', { action: 'list' });
  return (res.registrations || []).map((row) => ({
    id: String(row._id || ''),
    eventId: String(row.eventId || ''),
    status: String(row.status || 'pending'),
  }));
}

/**
 * 退赛必须走云函数，不要让运营在后台直接删报名。
 * 免费退赛截止后算迟退，每年 3 次豁免。
 */
export async function withdrawRegistration(eventId: string): Promise<{
  late: boolean;
  usedExemption: boolean;
  remainingExempt: number;
}> {
  if (useMockEvents()) {
    return { late: false, usedExemption: false, remainingExempt: 3 };
  }
  const res = await callCloud<{
    late?: boolean;
    usedExemption?: boolean;
    remainingExempt?: number;
  }>('createRegistration', {
    action: 'withdraw',
    eventId,
  });
  return {
    late: !!res.late,
    usedExemption: !!res.usedExemption,
    remainingExempt: Number(res.remainingExempt || 0),
  };
}

/** 发布组队招募，写入这场 events.teamRecruits */
export async function publishTeamRecruit(payload: {
  eventId: string;
  need: string;
  deadline: string;
  note: string;
}): Promise<{ teamRecruits: EventDetail['teamRecruits'] }> {
  if (useMockEvents()) {
    return { teamRecruits: [] };
  }
  const res = await callCloud<{ teamRecruits?: EventDetail['teamRecruits'] }>('eventAction', {
    action: 'publishRecruit',
    eventId: payload.eventId,
    need: payload.need,
    deadline: payload.deadline,
    note: payload.note,
  });
  return { teamRecruits: res.teamRecruits || [] };
}

/** 申请加入某条招募，写入 team_applies */
export async function applyTeamRecruit(payload: {
  eventId: string;
  recruitId: string;
  recruitName: string;
}): Promise<void> {
  if (useMockEvents()) {
    return;
  }
  await callCloud('eventAction', {
    action: 'applyRecruit',
    eventId: payload.eventId,
    recruitId: payload.recruitId,
    recruitName: payload.recruitName,
  });
}
