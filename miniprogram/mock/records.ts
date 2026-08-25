/**
 * ============================================================================
 * 参赛记录数据 —— 「我的」点参赛记录进来看到的列表
 * ============================================================================
 *
 * 【这个文件是干什么的】
 * 生涯汇总（几场、几胜几负）和每一场的结果都在这里。页面只负责渲染和筛选，
 * 不含任何文案。
 *
 * 【这不是对战页】
 * 功能是「我打过哪些赛事、胜负如何」，点一行进已有的赛事详情。
 * 不要在这里加对手、约战、H2H。功能清单里那句「升级为含 H2H 的战绩页」本期不做。
 *
 * 【数字要对得上】
 * RECORDS_SUMMARY 的 matches / wins / losses 必须等于 RECORDS 的条数和胜负合计，
 * 否则顶上「12 场 8 胜 4 负」和列表对不上。改列表时顺手改汇总，或用下面
 * 的 buildSummary 重算一遍再贴回去。
 *
 * 【点进去的赛事】
 * eventId 对应 mock/home.ts、calendar.ts、super-cup.ts 里已有的赛事 id，
 * 详情页找不到会落到报名中的第一场。想让某一行进特定详情，就填真实存在的 id。
 *
 * 【常见改动】
 * 想改场次/胜负     → 改 RECORDS，并同步 RECORDS_SUMMARY
 * 想改筛选项名字   → 改 RECORD_FILTERS，同时改 RecordResult（'胜'/'负'）
 * 想改最近那场文案 → 改 RECORDS_SUMMARY.recent（「我的」生涯卡也读这个）
 */

export type RecordResult = '胜' | '负';

export interface MatchRecord {
  /** wx:for 的 key，不要重复 */
  id: string;
  /** 点进去用的赛事 id，对应 mock/event-detail.ts 的查找 */
  eventId: string;
  /** 赛事名，建议控制在 12 个字内，太长卡片上会单行省略 */
  title: string;
  /** 比赛日期，如 08月16日 */
  date: string;
  /** 项目，如 混双 / 男双 / 团体 */
  category: string;
  /** 场地短名，写在日期后面 */
  venue: string;
  result: RecordResult;
  /** 比分，如 6-3 6-4；团体可用 2-1 */
  score: string;
}

export interface RecordsSummary {
  matches: number;
  wins: number;
  losses: number;
  /** 生涯卡和本页顶卡都会显示，格式「最近：7.0混双评级赛」 */
  recent: string;
}

export const RECORD_FILTERS = ['全部', '胜', '负'] as const;

export type RecordFilter = (typeof RECORD_FILTERS)[number];

export const RECORDS: MatchRecord[] = [
  {
    id: 'r-12',
    eventId: 'e-done-1',
    title: '7.0混双评级赛',
    date: '08月16日',
    category: '混双',
    venue: '佛山禅城店',
    result: '胜',
    score: '6-3  6-4',
  },
  {
    id: 'r-11',
    eventId: 'e-open-2',
    title: '6.5男双积分赛',
    date: '08月09日',
    category: '男双',
    venue: '广州润盈',
    result: '胜',
    score: '7-5  6-2',
  },
  {
    id: 'r-10',
    eventId: 'e-live-1',
    title: '常青杯团体赛',
    date: '07月26日',
    category: '团体',
    venue: '东莞松山湖',
    result: '负',
    score: '1-2',
  },
  {
    id: 'r-09',
    eventId: 'e-mine-1',
    title: '混双评级赛',
    date: '07月19日',
    category: '混双',
    venue: '佛山禅城店',
    result: '胜',
    score: '6-4  6-3',
  },
  {
    id: 'r-08',
    eventId: 'e-done-1',
    title: '7.0混双评级赛',
    date: '07月12日',
    category: '混双',
    venue: '佛山禅城店',
    result: '负',
    score: '4-6  5-7',
  },
  {
    id: 'r-07',
    eventId: 'e-open-1',
    title: '女单挑战赛',
    date: '06月28日',
    category: '女单',
    venue: '广州润盈',
    result: '胜',
    score: '6-1  6-2',
  },
  {
    id: 'r-06',
    eventId: 'e-open-2',
    title: '6.5男双积分赛',
    date: '06月21日',
    category: '男双',
    venue: '广州润盈',
    result: '胜',
    score: '6-4  3-6  10-8',
  },
  {
    id: 'r-05',
    eventId: 'e-mine-1',
    title: '混双评级赛',
    date: '06月14日',
    category: '混双',
    venue: '佛山禅城店',
    result: '负',
    score: '3-6  4-6',
  },
  {
    id: 'r-04',
    eventId: 'e-live-1',
    title: '常青杯团体赛',
    date: '05月31日',
    category: '团体',
    venue: '东莞松山湖',
    result: '胜',
    score: '2-1',
  },
  {
    id: 'r-03',
    eventId: 'e-done-1',
    title: '7.0混双评级赛',
    date: '05月17日',
    category: '混双',
    venue: '佛山禅城店',
    result: '胜',
    score: '6-2  6-3',
  },
  {
    id: 'r-02',
    eventId: 'e-mine-1',
    title: '混双评级赛',
    date: '05月03日',
    category: '混双',
    venue: '佛山禅城店',
    result: '负',
    score: '2-6  6-4  8-10',
  },
  {
    id: 'r-01',
    eventId: 'e-open-2',
    title: '6.5男双积分赛',
    date: '04月19日',
    category: '男双',
    venue: '广州润盈',
    result: '胜',
    score: '6-3  6-4',
  },
];

export const RECORDS_SUMMARY: RecordsSummary = {
  matches: 12,
  wins: 8,
  losses: 4,
  recent: '最近：7.0混双评级赛',
};

/** 顶上三个筛选项，切「胜 / 负」只看 result 字段 */
export function filterRecords(filter: RecordFilter): MatchRecord[] {
  if (filter === '全部') {
    return RECORDS;
  }
  return RECORDS.filter((row) => row.result === filter);
}
