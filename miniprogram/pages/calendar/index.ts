import { CALENDAR_EVENTS, WEEKDAY_LABELS } from '../../mock/calendar';
import type { EventItem } from '../../mock/home';
import {
  buildMonthCells,
  formatDayHeading,
  toDateKey,
} from '../../utils/calendar';
import type { CalendarCell } from '../../utils/calendar';

/**
 * ============================================================================
 * 赛事日历页逻辑
 * ============================================================================
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
 * 如果你的手机日期不在 2026 年 8 月，看不到示例赛事的小圆点，
 * 需要手动翻月过去，或者改 mock/calendar.ts 里的日期键。
 */

/** 从赛事数据里提取出"哪些天有赛事"，用 Set 是为了查找快 */
const EVENT_DAYS = new Set(Object.keys(CALENDAR_EVENTS));

/** 月份标签，如「2026 / 08」。想改成「2026年8月」就改这里 */
function monthLabelOf(year: number, month: number): string {
  return `${year} / ${month < 10 ? `0${month}` : month}`;
}

Page({
  data: {
    statusBarHeight: 0,
    weekdays: WEEKDAY_LABELS,
    year: 2026,
    month: 8,
    monthLabel: '',
    weeks: [] as CalendarCell[][],
    selectedKey: '',
    dayHeading: '',
    events: [] as EventItem[],
  },

  onLoad() {
    const app = getApp<IAppOption>();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight });
    this.jumpToToday();
  },

  /** 重建月视图并同步选中日期的赛事列表 */
  render(year: number, month: number, selectedKey: string) {
    this.setData({
      year,
      month,
      monthLabel: monthLabelOf(year, month),
      weeks: buildMonthCells(year, month, EVENT_DAYS),
      selectedKey,
      dayHeading: formatDayHeading(selectedKey),
      events: CALENDAR_EVENTS[selectedKey] ?? [],
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

  onEventTap() {
    wx.showToast({ title: '赛事详情页待设计', icon: 'none' });
  },

  onSignupTap() {
    wx.showToast({ title: '报名流程待接入云开发', icon: 'none' });
  },
});
