export interface CalendarCell {
  /** YYYY-MM-DD */
  key: string;
  day: number;
  inMonth: boolean;
  hasEvent: boolean;
}

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/**
 * 生成月视图的 6 周 × 7 天，头尾补齐上下月日期。
 * 设计（node 17:105）固定画了 6 周，因此这里也固定 42 格，避免高度跳动。
 */
export function buildMonthCells(
  year: number,
  month: number,
  eventDays: Set<string>
): CalendarCell[][] {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const cells: CalendarCell[] = [];

  for (let index = firstWeekday - 1; index >= 0; index -= 1) {
    const day = daysInPrevMonth - index;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    cells.push({
      key: toDateKey(prevYear, prevMonth, day),
      day,
      inMonth: false,
      hasEvent: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = toDateKey(year, month, day);
    cells.push({ key, day, inMonth: true, hasEvent: eventDays.has(key) });
  }

  let nextDay = 1;
  while (cells.length < 42) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    cells.push({
      key: toDateKey(nextYear, nextMonth, nextDay),
      day: nextDay,
      inMonth: false,
      hasEvent: false,
    });
    nextDay += 1;
  }

  const weeks: CalendarCell[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

/** 「08月29日(周六)」，用于赛事列表的日期标题 */
export function formatDayHeading(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  const weekday = WEEKDAY_NAMES[new Date(year, month - 1, day).getDay()];
  return `${pad(month)}月${pad(day)}日(周${weekday})`;
}
