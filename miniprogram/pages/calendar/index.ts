import { listCalendarMonth } from '../../api/events';
import { WEEKDAY_LABELS } from '../../mock/calendar';
import type { EventItem } from '../../mock/home';
import {
  buildMonthCells,
  formatDayHeading,
  toDateKey,
} from '../../utils/calendar';
import type { CalendarCell } from '../../utils/calendar';
import { resolveVenueId } from '../../mock/venue';
import { navigateToEventDetail, navigateToPage } from '../../utils/navigate';
import { themeBehavior } from '../../behaviors/theme';

/**
 * ============================================================================
 * 赛事日历页逻辑
 * ============================================================================
 * 版式来自终稿 17:92。V5 草稿 228:954 几乎同构图，已去掉波浪头，改 occupy 吸顶栏。
 * 「今日」、选中日、有赛圆点走主题强调色。
 *
 * 【核心是一个 render 方法】
 * 翻月、点日期、点今日，最终都归结为"用新的年月和选中日期重画一次"，
 * 所以统一调 render(year, month, selectedKey)，不用三套逻辑。
 *
 * 【日期计算不在这里】
 * 生成 42 个格子的逻辑在 utils/calendar.ts，这个文件只负责调用和渲染。
 *
 * 【默认打开当前月】
 * 页面加载时调 jumpToToday()，所以打开就是今天所在的月份。
 * 赛事日期来自云库的 dateKey（开关关上后）；假数据仍是 2026 年 8 月。
 */

/** 月份标签，如「2026 / 08」。想改成「2026年8月」就改这里 */
function monthLabelOf(year: number, month: number): string {
  return `${year} / ${month < 10 ? `0${month}` : month}`;
}

Page({
  behaviors: [themeBehavior],
  data: {
    weekdays: WEEKDAY_LABELS,
    year: 2026,
    month: 8,
    monthLabel: '',
    weeks: [] as CalendarCell[][],
    selectedKey: '',
    dayHeading: '',
    events: [] as EventItem[],
    eventsByDay: {} as Record<string, EventItem[]>,
  },

  onLoad() {
    const boot = getApp<IAppOption>().globalData.cloudBoot || Promise.resolve();
    boot.then(() => this.jumpToToday());
  },

  /** 重建月视图并同步选中日期的赛事列表 */
  render(year: number, month: number, selectedKey: string) {
    listCalendarMonth(year, month)
      .then(({ dateKeys, eventsByDay }) => {
        this.setData({
          year,
          month,
          monthLabel: monthLabelOf(year, month),
          weeks: buildMonthCells(year, month, new Set(dateKeys)),
          selectedKey,
          dayHeading: formatDayHeading(selectedKey),
          events: eventsByDay[selectedKey] ?? [],
          eventsByDay,
        });
      })
      .catch((error) => {
        console.warn('读日历失败', error);
        this.setData({
          year,
          month,
          monthLabel: monthLabelOf(year, month),
          weeks: buildMonthCells(year, month, new Set()),
          selectedKey,
          dayHeading: formatDayHeading(selectedKey),
          events: [],
          eventsByDay: {},
        });
      });
  },

  jumpToToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    this.render(year, month, toDateKey(year, month, now.getDate()));
  },

  onPrevMonth() {
    const { year, month } = this.data;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    this.render(prevYear, prevMonth, toDateKey(prevYear, prevMonth, 1));
  },

  onNextMonth() {
    const { year, month } = this.data;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    this.render(nextYear, nextMonth, toDateKey(nextYear, nextMonth, 1));
  },

  onToday() {
    this.jumpToToday();
  },

  /** 点到上下月的日期时，顺带把视图切到那个月 */
  onSelectDay(event: WechatMiniprogram.TouchEvent) {
    const key = String(event.currentTarget.dataset.key);
    const [year, month] = key.split('-').map(Number);
    this.render(year, month, key);
  },

  onEventTap(event: WechatMiniprogram.CustomEvent<{ id?: string }>) {
    navigateToEventDetail(event.detail.id);
  },

  onSignupTap(event: WechatMiniprogram.CustomEvent<{ id?: string }>) {
    const id = event.detail && event.detail.id;
    if (id) {
      navigateToPage(`/pages/signup/index?id=${id}`);
    }
  },

  onVenueTap(event: WechatMiniprogram.CustomEvent<{ id?: string; venue?: string; venueId?: string }>) {
    navigateToPage(`/pages/venue/index?id=${resolveVenueId(event.detail)}`);
  },
});
