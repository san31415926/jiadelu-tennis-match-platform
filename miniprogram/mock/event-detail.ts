/**
 * ============================================================================
 * 赛事详情数据
 * ============================================================================
 *
 * 从首页 / 超级杯 / 日历点进详情页。路径带 ?id=e-open-1，
 * 在三份赛事表里查找；找不到就落到报名中的第一场，避免空白页。
 *
 * 版式来自视觉刷新草稿「赛事详情 / V5」：八个 Tab 收成同一页的 activeTab，
 * 不是八个独立页面。组队是「赛事组队招募」，不是约球匹配，没有 VS / H2H。
 *
 * 【常见改动】
 * 想改首页概览 / 资讯     → 改 DETAIL_EXTRAS 对应场次
 * 想改报名预览名单       → 改 SIGNUP_PAIRS / SIGNUP_SINGLES
 * 想改组队招募卡片       → 改 TEAM_RECRUITS
 * 想改签表 / 成绩 / 赛程 → 改 BRACKET_GROUPS / RESULT_ROWS / SCHEDULE_MATCHES
 * 成绩选手的 club 不填（或空字符串）时，成绩 Tab 显示「个人」
 * 想改精选图             → 改 FEATURED_PHOTOS，复用相册和球场照
 */
import { CALENDAR_EVENTS } from './calendar';
import { expandAlbumPhotos, GALLERY_SECTIONS } from './gallery';
import { MOCK_EVENTS } from './home';
import type { EventItem } from './home';
import { SUPER_CUP_EVENTS } from './super-cup';

export type EventStatus = '报名中' | '进行中' | '已结束';

export type EventDetailTab =
  | 'home'
  | 'info'
  | 'signup'
  | 'team'
  | 'photos'
  | 'bracket'
  | 'schedule'
  | 'results';

export interface EventNews {
  title: string;
  date: string;
}

export interface EventOverviewRow {
  label: string;
  value: string;
}

export interface EventNavItem {
  key: EventDetailTab;
  label: string;
  icon: string;
}

export interface EventPlayer {
  name: string;
  rating: string;
  gender: 'male' | 'female';
  avatar: string;
  time?: string;
  points?: string;
  groupTag?: string;
  ratingDelta?: string;
  /**
   * 所在俱乐部。成绩 Tab 用来填「俱乐部」列。
   * 不填就显示「个人」。名称尽量用 mock/club.ts / ranking.ts 里已有的，
   * 避免同一人在榜单和成绩里挂两家俱乐部。
   */
  club?: string;
}

export interface EventSignupPair {
  players: EventPlayer[];
}

export interface EventSignupPreview {
  signed: string;
  waitlist: string;
  deadline: string;
  slotHint: string;
  maxHint: string;
  notice: string;
  format: 'doubles' | 'singles';
  pairs: EventSignupPair[];
}

export interface EventFileItem {
  kind: 'doc' | 'attach';
  name: string;
}

export interface EventReward {
  headline: string;
  champion: string;
  runnerUp: string;
  gift: string;
  rules: string[];
}

export interface EventTeamRecruit {
  id: string;
  name: string;
  avatar: string;
  need: string;
  points: number;
}

export interface EventResultRow {
  rank: number;
  players: EventPlayer[];
  eventPoints: string;
  superCup: string;
}

export interface BracketTeam {
  code: string;
  seed: boolean;
  combined: string;
  names: string;
  avatars: string[];
  scores: string[];
}

export interface BracketGroup {
  name: string;
  codes: string[];
  teams: BracketTeam[];
}

export interface ScheduleMatch {
  time: string;
  court: string;
  round: string;
  left: string;
  right: string;
  score: string;
  /** 画面上的中文，如 已结束 / 进行中 / 未开始 */
  status: string;
  /**
   * 给 WXSS 用的英文后缀。小程序样式选择器不能写中文，
   * 所以 class 是 sched__st--{{statusTone}}，不要把 status 直接拼进类名。
   */
  statusTone: 'done' | 'live' | 'soon';
}

export interface SignupPerson {
  name: string;
  avatar: string;
  uid: string;
  hand: string;
  rating: string;
}

export interface EventDetail extends EventItem {
  status: EventStatus;
  series: string;
  news: EventNews;
  overview: EventOverviewRow[];
  venueName: string;
  venueThumb: string;
  eventType: string;
  fee: string;
  signupTime: string;
  matchTime: string;
  ctaHint: string;
  rewards: EventReward;
  files: EventFileItem[];
  signupPreview: EventSignupPreview;
  teamRecruits: EventTeamRecruit[];
  featuredPhotos: string[];
  photos: string[];
  photoCount: string;
  bracketTabs: string[];
  bracketHint: string;
  bracketGroups: BracketGroup[];
  schedule: ScheduleMatch[];
  results: EventResultRow[];
}

export const EVENT_NAV: EventNavItem[] = [
  { key: 'home', label: '首页', icon: '/assets/icons/event-detail/home.png' },
  { key: 'info', label: '信息', icon: '/assets/icons/event-detail/info.png' },
  { key: 'signup', label: '报名', icon: '/assets/icons/event-detail/signup.png' },
  { key: 'team', label: '组队', icon: '/assets/icons/event-detail/team.png' },
  { key: 'photos', label: '图片', icon: '/assets/icons/event-detail/photos.png' },
  { key: 'bracket', label: '签表', icon: '/assets/icons/event-detail/bracket.png' },
  { key: 'schedule', label: '赛程', icon: '/assets/icons/event-detail/schedule.png' },
  { key: 'results', label: '成绩', icon: '/assets/icons/event-detail/results.png' },
];

const DEFAULT_SERIES = 'LTJIMMY® · 大湾区网球信任制爱好者常年赛';
const COURT_PHOTO = '/assets/images/court-photo.jpg';
const AVATARS = [
  '/assets/images/avatars/anime-01.jpg',
  '/assets/images/avatars/anime-02.jpg',
  '/assets/images/avatars/anime-03.jpg',
  '/assets/images/avatars/anime-04.jpg',
  '/assets/images/avatars/anime-05.jpg',
  '/assets/images/avatars/anime-06.jpg',
];

function av(index: number): string {
  return AVATARS[index % AVATARS.length];
}

/** 报名页当前球员。UID / 持拍手设计稿写死，接登录后改这里 */
export const SIGNUP_SELF: SignupPerson = {
  name: '帆',
  avatar: av(0),
  uid: '10008652',
  hand: '右手',
  rating: '5.0级',
};

/** 组队报名时的示例搭档。点「暂无队伍」会清掉，不是约球匹配 */
export const SIGNUP_PARTNER: SignupPerson = {
  name: '阿月',
  avatar: av(1),
  uid: '10008688',
  hand: '右手',
  rating: '3.8级',
};

const FEATURED_PHOTOS = [
  '/assets/images/gallery/photo-1.jpg',
  '/assets/images/gallery/photo-2.jpg',
  '/assets/images/banners/banner-05-night-court-photo.jpg',
  '/assets/images/gallery/photo-3.jpg',
];

function collectPhotos(): string[] {
  const pool = GALLERY_SECTIONS.flatMap((section) => section.photos);
  pool.push(COURT_PHOTO, '/assets/images/banners/banner-06-mixed-doubles-photo.jpg');
  return expandAlbumPhotos(pool, 12);
}

const REWARDS: EventReward = {
  headline: '奖品：超级杯赛事门票 + 晋级总决赛',
  champion: '冠军：2 张超级杯半决赛一等票 + 晋级总决赛（正赛球场参赛）',
  runnerUp: '亚军：2 张超级杯半决赛二等票',
  gift: '每站三个组别各抽出 1 名幸运观众，获得球星互动名额。',
  rules: [
    '1. 参加 5 站资格赛的球员只有一次获奖机会。一旦有球员获得冠军 / 亚军，即失去之后获奖资格，奖励不顺延给其他人。（不与巡回赛门票冲突）',
    '2. 晋级总决赛的球员只有一次机会，须以原配搭档参赛。若夺冠组合中有球员已获得晋级资格，则两人均失去资格，资格顺延给亚军组合。「一次原则」同样适用于亚军。',
    '通过参加嘉得路常年赛累积积分，即有机会站上正赛球场。',
  ],
};

const FILES: EventFileItem[] = [
  { kind: 'doc', name: '免责声明' },
  { kind: 'doc', name: '参赛须知' },
  { kind: 'attach', name: '附件2：2026 通往超级杯之路大赛规程.docx' },
  { kind: 'attach', name: '附件1：网球赛事赛程表（4片场地）.xlsx' },
];

const SIGNUP_PAIRS: EventSignupPair[] = [
  {
    players: [
      {
        name: '克克克',
        rating: '[3.9级]',
        gender: 'male',
        avatar: av(0),
        time: '8月19日 21:16',
        groupTag: '0积分 组',
        points: '0 积分',
      },
      {
        name: '阿月',
        rating: '[3.8级]',
        gender: 'female',
        avatar: av(1),
        time: '8月19日 21:16',
        points: '0 积分',
      },
    ],
  },
  {
    players: [
      {
        name: '阿豪',
        rating: '[4.0级]',
        gender: 'male',
        avatar: av(2),
        time: '8月18日 19:02',
        groupTag: '200积分 组',
        points: '120 积分',
      },
      {
        name: '小鱼',
        rating: '[3.9级]',
        gender: 'female',
        avatar: av(3),
        time: '8月18日 19:02',
        points: '80 积分',
      },
    ],
  },
  {
    players: [
      {
        name: '老周',
        rating: '[4.1级]',
        gender: 'male',
        avatar: av(0),
        time: '8月17日 10:41',
        groupTag: '260积分 组',
        points: '200 积分',
      },
      {
        name: '林林',
        rating: '[3.7级]',
        gender: 'female',
        avatar: av(1),
        time: '8月17日 10:41',
        points: '60 积分',
      },
    ],
  },
];

const SIGNUP_SINGLES: EventSignupPair[] = SIGNUP_PAIRS.map((pair) => ({
  players: [pair.players[0]],
}));

const TEAM_RECRUITS: EventTeamRecruit[] = [
  { id: 't-atai', name: '阿泰', avatar: av(2), need: '缺女搭档 · 7.0混双', points: 1540 },
  { id: 't-ahao', name: '阿豪', avatar: av(0), need: '缺男搭档 · 7.0混双', points: 1280 },
  { id: 't-lin', name: '林林', avatar: av(1), need: '不限性别 · 8月25日前组好', points: 960 },
];

const RESULT_ROWS: EventResultRow[] = [
  {
    rank: 1,
    eventPoints: '+200',
    superCup: '+200',
    players: [
      { name: '小鹿', rating: '[3.4级]', gender: 'female', avatar: av(1), ratingDelta: '↑ 0.2', club: 'GagaTennis Club' },
      { name: '杰森', rating: '[3.5级]', gender: 'male', avatar: av(2), ratingDelta: '↑ 0.2', club: '菜菜才不菜' },
    ],
  },
  {
    rank: 2,
    eventPoints: '+120',
    superCup: '+120',
    players: [
      { name: 'LIN', rating: '[2.7级]', gender: 'female', avatar: av(3) },
      { name: '阿豪', rating: '[3.0级]', gender: 'male', avatar: av(0), ratingDelta: '↑ 0.1', club: '椒个鹏友' },
    ],
  },
  {
    rank: 3,
    eventPoints: '+60',
    superCup: '+60',
    players: [
      { name: '阿月', rating: '[3.8级]', gender: 'female', avatar: av(1), club: '佛山飞跃队' },
      { name: '老周', rating: '[4.1级]', gender: 'male', avatar: av(2) },
    ],
  },
  {
    rank: 4,
    eventPoints: '+40',
    superCup: '+40',
    players: [
      { name: '林林', rating: '[3.7级]', gender: 'female', avatar: av(3), club: 'RisingAce 网球社' },
      { name: '克克克', rating: '[3.9级]', gender: 'male', avatar: av(0) },
    ],
  },
  {
    rank: 5,
    eventPoints: '+30',
    superCup: '+30',
    players: [
      { name: '小鱼', rating: '[3.9级]', gender: 'female', avatar: av(1), club: '椒个鹏友' },
      { name: '大飞', rating: '[4.0级]', gender: 'male', avatar: av(2), club: 'inininAlive Club' },
    ],
  },
];

const BRACKET_GROUPS: BracketGroup[] = [
  {
    name: 'A组',
    codes: ['T1', 'T2', 'T3', 'T4'],
    teams: [
      {
        code: 'T1',
        seed: true,
        combined: '6.9级',
        names: '小鹿 3.4 · 杰森 3.5',
        avatars: [av(1), av(2)],
        scores: ['—', '6:3', '6:2', '6:4'],
      },
      {
        code: 'T2',
        seed: false,
        combined: '5.7级',
        names: 'LIN 2.7 · 阿豪 3.0',
        avatars: [av(3), av(0)],
        scores: ['3:6', '—', '6:4', '7:5'],
      },
      {
        code: 'T3',
        seed: false,
        combined: '7.9级',
        names: '阿月 3.8 · 老周 4.1',
        avatars: [av(1), av(2)],
        scores: ['2:6', '4:6', '—', '6:3'],
      },
      {
        code: 'T4',
        seed: false,
        combined: '7.6级',
        names: '林林 3.7 · 克克克 3.9',
        avatars: [av(3), av(0)],
        scores: ['4:6', '5:7', '3:6', '—'],
      },
    ],
  },
  {
    name: 'B组',
    codes: ['T5', 'T6', 'T7', 'T8'],
    teams: [
      {
        code: 'T5',
        seed: true,
        combined: '7.9级',
        names: '小鱼 3.9 · 大飞 4.0',
        avatars: [av(1), av(2)],
        scores: ['—', '6:2', '6:4', '6:3'],
      },
      {
        code: 'T6',
        seed: false,
        combined: '7.2级',
        names: '阿泰 3.6 · 帆 3.6',
        avatars: [av(0), av(3)],
        scores: ['2:6', '—', '6:3', '4:6'],
      },
      {
        code: 'T7',
        seed: false,
        combined: '6.8级',
        names: '阿月 3.8 · 待定',
        avatars: [av(1), av(2)],
        scores: ['4:6', '3:6', '—', '6:4'],
      },
      {
        code: 'T8',
        seed: false,
        combined: '7.0级',
        names: '林林 3.7 · 小鹿 3.3',
        avatars: [av(3), av(1)],
        scores: ['3:6', '6:4', '4:6', '—'],
      },
    ],
  },
];

const SCHEDULE_MATCHES: ScheduleMatch[] = [
  {
    time: '16:00',
    court: '1号场',
    round: '小组赛',
    left: '小鹿 / 杰森',
    right: 'LIN / 阿豪',
    score: '6-3  6-4',
    status: '已结束',
    statusTone: 'done',
  },
  {
    time: '16:50',
    court: '1号场',
    round: '小组赛',
    left: '阿月 / 老周',
    right: '林林 / 克克克',
    score: '',
    status: '进行中',
    statusTone: 'live',
  },
  {
    time: '17:40',
    court: '2号场',
    round: '小组赛',
    left: '小鱼 / 大飞',
    right: '阿泰 / 帆',
    score: '',
    status: '未开始',
    statusTone: 'soon',
  },
  {
    time: '18:30',
    court: '2号场',
    round: '小组赛',
    left: 'T3 vs T5',
    right: '交叉位待定',
    score: '',
    status: '未开始',
    statusTone: 'soon',
  },
];

const BRACKET_HINT =
  '小组内单循环，对角格是自己无需对阵。比分需双方确认后提交。';

type DetailExtra = Pick<
  EventDetail,
  | 'status'
  | 'series'
  | 'news'
  | 'overview'
  | 'venueName'
  | 'venueThumb'
  | 'eventType'
  | 'fee'
  | 'signupTime'
  | 'matchTime'
  | 'ctaHint'
  | 'rewards'
  | 'files'
  | 'signupPreview'
  | 'teamRecruits'
  | 'featuredPhotos'
  | 'photos'
  | 'photoCount'
  | 'bracketTabs'
  | 'bracketHint'
  | 'bracketGroups'
  | 'schedule'
  | 'results'
>;

const PHOTO_POOL = collectPhotos();

/** 草稿画板上那一场，其余赛事用 EventItem 拼一份同结构的详情 */
const DETAIL_EXTRAS: Record<string, Partial<DetailExtra>> = {
  'e-open-1': {
    status: '报名中',
    series: DEFAULT_SERIES,
    news: { title: '赛事规则（点击查看）', date: '2026-08-16' },
    signupTime: '08月16日(周日)-08月25日(周二)',
    matchTime: '08月29日(周六) 16:00-21:00',
    venueName: '佛山球球热网球禅城店',
    eventType: '混合双打',
    fee: '108 元',
    ctaHint: '报名需先登录成为赛事球员',
    teamRecruits: TEAM_RECRUITS,
  },
};

function statusFromFilter(key: string): EventStatus {
  if (key === '进行中' || key === '已结束' || key === '报名中') {
    return key;
  }
  return '报名中';
}

function listEvents(): { item: EventItem; status: EventStatus }[] {
  const rows: { item: EventItem; status: EventStatus }[] = [];
  const sources = [MOCK_EVENTS, SUPER_CUP_EVENTS];
  for (const table of sources) {
    Object.keys(table).forEach((key) => {
      const status = statusFromFilter(key);
      table[key].forEach((item) => rows.push({ item, status }));
    });
  }
  Object.values(CALENDAR_EVENTS).forEach((day) => {
    day.forEach((item) => {
      const status: EventStatus =
        item.actionText === '查看成绩'
          ? '已结束'
          : item.actionText === '查看对阵'
            ? '进行中'
            : '报名中';
      rows.push({ item, status });
    });
  });
  return rows;
}

function isSingles(item: EventItem): boolean {
  const cat = `${item.category || ''}${item.title || ''}`;
  return cat.indexOf('单') >= 0;
}

function fallbackExtra(item: EventItem, status: EventStatus): DetailExtra {
  const needSignup = status === '报名中';
  const singles = isSingles(item);
  const venueName = (item.venue || '').replace(/\s+/g, '');
  const typeFromCaption = (item.slotCaption || '').split('·')[0];
  const price = (item.price || '¥108').replace('¥', '');
  return {
    status,
    series: DEFAULT_SERIES,
    news: { title: '赛事规则（点击查看）', date: '2026-08-16' },
    signupTime: '详见赛事通知',
    matchTime: item.time,
    venueName,
    venueThumb: COURT_PHOTO,
    eventType: singles ? item.category || item.title : typeFromCaption || item.category || '混合双打',
    fee: needSignup ? `${price} 元` : '—',
    overview: [
      { label: '报名时间', value: '详见赛事通知' },
      { label: '比赛时间', value: item.time },
      { label: '赛事类型', value: item.category },
      { label: '报名费用', value: needSignup ? `${price} 元` : '—' },
    ],
    ctaHint: needSignup ? '报名需先登录成为赛事球员' : '',
    rewards: REWARDS,
    files: FILES,
    signupPreview: {
      signed: singles ? '8/16' : '14/32',
      waitlist: '0/6',
      deadline: '< 2天 2小时',
      slotHint: singles ? '按积分高低分配 16 签位' : '按积分高低分配 32 签位',
      maxHint: singles ? '(最多可报名 48)' : '(最多可报名 96)',
      notice: '该页等级为报名时等级，可能与其他页面等级存在差异',
      format: singles ? 'singles' : 'doubles',
      pairs: singles ? SIGNUP_SINGLES : SIGNUP_PAIRS,
    },
    teamRecruits: status === '报名中' ? [] : TEAM_RECRUITS,
    featuredPhotos: FEATURED_PHOTOS,
    photos: PHOTO_POOL,
    photoCount: '共 12 张',
    bracketTabs: ['小组赛', '金组', '银组', '铜组'],
    bracketHint: BRACKET_HINT,
    bracketGroups: BRACKET_GROUPS,
    schedule: SCHEDULE_MATCHES,
    results: RESULT_ROWS,
  };
}

export function getEventDetail(id: string): EventDetail {
  const pool = listEvents();
  const hit =
    pool.find((row) => row.item.id === id) ??
    pool.find((row) => row.item.id === 'e-open-1') ??
    pool[0];
  if (!hit) {
    throw new Error('赛事列表为空');
  }
  const base = fallbackExtra(hit.item, hit.status);
  const extra = DETAIL_EXTRAS[hit.item.id] ?? {};
  const signupTime = extra.signupTime ?? base.signupTime;
  const matchTime = extra.matchTime ?? base.matchTime;
  const venueName = extra.venueName ?? base.venueName;
  const eventType = extra.eventType ?? base.eventType;
  const fee = extra.fee ?? base.fee;
  const overview =
    extra.overview ??
    [
      { label: '报名时间', value: signupTime },
      { label: '比赛时间', value: matchTime },
      { label: '赛事类型', value: eventType },
      { label: '报名费用', value: fee },
    ];
  return {
    ...hit.item,
    ...base,
    ...extra,
    signupTime,
    matchTime,
    venueName,
    eventType,
    fee,
    overview,
    venueThumb: extra.venueThumb ?? base.venueThumb,
  };
}
