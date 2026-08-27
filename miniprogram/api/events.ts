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
 * createRegistration({ action: 'list' })。
 *
 * 启动时 seedMock 带 upsertEvents，按 mock 覆盖写 events，标题 / 单打双打
 * 和卡片一致。俱乐部等其它表仍是空才灌。报名记录不会被清掉。
 */
import { USE_MOCK } from '../config/env';
import { CALENDAR_EVENTS } from '../mock/calendar';
import { getEventDetail } from '../mock/event-detail';
import type { EventDetail } from '../mock/event-detail';
import { MOCK_EVENTS, findMockEvent } from '../mock/home';
import type { EventItem } from '../mock/home';
import { SUPER_CUP_EVENTS } from '../mock/super-cup';
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
  return row as unknown as EventItem;
}

function asEventDetail(row: Record<string, unknown>): EventDetail {
  return row as unknown as EventDetail;
}

/**
 * 云库文档可能只有 _id、业务 id 在 id 字段。点卡片、读详情都要对上 mock。
 */
function bizIdOf(row: EventItem & { _id?: string }): string {
  return String(row.id || row._id || '').trim();
}

/**
 * 云库灌过后改 mock 不会立刻写回。列表遇到 mock 里有的 id，用 mock 盖一层，
 * 和详情页同一套标题。启动 upsert 之后两边本应已经一致。
 */
function overlayFromMock(item: EventItem): EventItem {
  const id = bizIdOf(item as EventItem & { _id?: string });
  const mock = findMockEvent(id);
  if (!mock) {
    return item.id ? item : { ...item, id };
  }
  return { ...item, ...mock, id: mock.id };
}

/** mock 里有这场，详情直接走 getEventDetail，不要读云库里灌进去的旧概览。 */
function mockDetailIfPresent(id: string) {
  const trimmed = String(id || '').trim();
  return findMockEvent(trimmed) ? getEventDetail(trimmed) : null;
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

function shouldSkipSeed(): boolean {
  if (!getApp<IAppOption>().globalData.cloudReady) {
    return true;
  }
  return USE_MOCK.events && USE_MOCK.clubs && USE_MOCK.ranking;
}

/** 空集合才灌；启动时按 mock 覆盖写赛事和俱乐部/榜单/相册等示例，报名和用户资料不清。 */
export function ensureEventsSeeded(): Promise<void> {
  if (shouldSkipSeed()) {
    return Promise.resolve();
  }
  if (!seedPromise) {
    seedPromise = callCloud<{ skipped?: boolean }>('seedMock', {
      upsertEvents: true,
      upsertCatalog: true,
      events: collectSeedEvents(),
      ...collectCatalogSeed(),
    })
      .then(() => undefined)
      .catch((error) => {
        seedPromise = null;
        throw error;
      });
  }
  return seedPromise;
}

async function queryEvents(where: Record<string, unknown>): Promise<EventItem[]> {
  await ensureEventsSeeded();
  const db = cloudDb();
  const res = await db.collection('events').where(where).limit(20).get();
  return (res.data || []).map((row) => overlayFromMock(asEventItem(row as Record<string, unknown>)));
}

async function queryMyEvents(line: EventLine): Promise<EventItem[]> {
  await ensureEventsSeeded();
  const res = await callCloud<{ events?: Record<string, unknown>[] }>('createRegistration', {
    action: 'list',
  });
  return (res.events || [])
    .map((row) => overlayFromMock(asEventItem(row)))
    .filter((item) => {
      const rec = item as EventItem & { line?: EventLine };
      return (rec.line || lineOf(item.id)) === line;
    });
}

export async function listEventsByFilter(
  filter: string,
  line: EventLine,
): Promise<EventItem[]> {
  if (useMockEvents()) {
    const table = line === 'super-cup' ? SUPER_CUP_EVENTS : MOCK_EVENTS;
    return (table[filter] || []).slice();
  }
  if (filter === '我的报名') {
    return queryMyEvents(line);
  }
  return queryEvents({
    line,
    status: statusOfFilter(filter),
  });
}

export async function loadEventDetail(id: string): Promise<EventDetail> {
  const trimmed = String(id || '').trim();
  if (useMockEvents()) {
    return getEventDetail(trimmed);
  }
  await ensureEventsSeeded();
  try {
    const res = await cloudDb().collection('events').doc(trimmed).get();
    if (res.data) {
      const row = asEventDetail(res.data as Record<string, unknown>);
      const mockId = String(row.id || row._id || trimmed);
      const mock = mockDetailIfPresent(mockId);
      if (!mock) {
        return { ...row, id: mockId };
      }
      return {
        ...mock,
        ...row,
        id: mockId,
        teamRecruits: Array.isArray(row.teamRecruits) ? row.teamRecruits : mock.teamRecruits,
      };
    }
  } catch (error) {
    console.warn('读赛事详情失败，回落到 mock', error);
  }
  return getEventDetail(trimmed);
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
    .limit(20)
    .get();

  const eventsByDay: Record<string, EventItem[]> = {};
  (res.data || []).forEach((row) => {
    const item = overlayFromMock(asEventItem(row as Record<string, unknown>));
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
}

export async function submitRegistration(payload: {
  eventId: string;
  mode: '单人' | '组队';
  partnerUid?: string;
}): Promise<{ duplicated: boolean }> {
  if (useMockEvents()) {
    return { duplicated: false };
  }
  const res = await callCloud<{ duplicated?: boolean }>('createRegistration', {
    eventId: payload.eventId,
    mode: payload.mode,
    partnerUid: payload.partnerUid || '',
  });
  return { duplicated: !!res.duplicated };
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
