/** 赛事日历假数据，与 Figma node 17:93 对应 */
import type { EventItem } from './home';

const COURT_PHOTO = '/assets/images/court-photo.jpg';

/** 有赛事的日期，键为 YYYY-MM-DD */
export const CALENDAR_EVENTS: Record<string, EventItem[]> = {
  '2026-08-01': [
    {
      id: 'cal-0801',
      title: '6.5男双积分赛',
      poster: COURT_PHOTO,
      venue: '广州润盈网球中心',
      time: '08月01日 09:00-17:00',
      slots: '12/16',
      actionText: '立即报名',
    },
  ],
  '2026-08-04': [
    {
      id: 'cal-0804',
      title: '女子单打评级赛',
      poster: COURT_PHOTO,
      venue: '佛山球球热网球禅城店',
      time: '08月04日 14:00-20:00',
      slots: '6/8',
      actionText: '立即报名',
    },
  ],
  '2026-08-08': [
    {
      id: 'cal-0808',
      title: '常青杯团体赛',
      poster: COURT_PHOTO,
      venue: '东莞松山湖 TC',
      time: '08月08日 10:00-18:00',
      slots: '8/8',
      actionText: '查看对阵',
    },
  ],
  '2026-08-29': [
    {
      id: 'cal-0829-1',
      title: '7.0混双评级赛',
      poster: COURT_PHOTO,
      venue: '佛山球球热网球禅城店',
      time: '08月29日 16:00-21:00',
      slots: '8/16',
      actionText: '立即报名',
    },
    {
      id: 'cal-0829-2',
      title: '青少年组挑战赛',
      poster: COURT_PHOTO,
      venue: '广州天河体育中心',
      time: '08月29日 09:00-12:00',
      slots: '10/16',
      actionText: '立即报名',
    },
  ],
};

export const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
