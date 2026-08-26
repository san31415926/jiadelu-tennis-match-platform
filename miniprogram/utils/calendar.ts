/**
 * ============================================================================
 * 日历计算 —— 生成月视图的日期格子
 * ============================================================================
 *
 * 【这个文件是干什么的】
 * 赛事日历页需要显示一个月历表格。这里负责算出"这个月要显示哪 42 个日期"，
 * 包括开头补上月末尾几天、结尾补下月开头几天，让每一行都是完整的 7 天。
 *
 * 页面本身不做日期计算，只负责把这里返回的数据渲染出来。
 */

export interface CalendarCell {
  /** 日期的唯一标识，格式 YYYY-MM-DD，用来匹配赛事数据和判断选中态 */
  key: string;
  /** 显示的日号，1~31 */
  day: number;
  /** 是否属于当前显示的月份。false 的格子文字显示为浅灰 */
  inMonth: boolean;
  /** 这天有没有赛事。true 会在日号下方画一个强调色小圆点 */
  hasEvent: boolean;
}

export const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

/** 把 8 补成 08，用于拼日期字符串 */
function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/** 拼出 2026-08-18 这样的日期键 */
export function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/**
 * 生成月视图数据：6 行 × 7 列 = 42 个格子。
 *
 * @param year  年份，如 2026
 * @param month 月份，1~12（注意不是 JS Date 的 0~11）
 * @param eventDays 有赛事的日期集合，元素是 'YYYY-MM-DD' 字符串
 *
 * 【为什么固定 42 格而不是按实际周数】
 * 一个月最少占 4 行、最多占 6 行。如果按实际周数渲染，翻月时日历高度会
 * 忽然变化，下面的赛事列表跟着上下跳，观感很差。设计稿（Figma node 17:105）
 * 也是固定画了 6 行，所以这里固定补齐到 42 格。
 *
 * 【想改成按实际周数】
 * 把最后那个 while (cells.length < 42) 改成填满当前周即可（补到 7 的整数倍），
 * 同时把日历页 wxss 里 .grid__inner 的固定高度去掉改成自适应。
 */
export function buildMonthCells(
  year: number,
  month: number,
  eventDays: Set<string>
): CalendarCell[][] {
  // getDay() 返回 0~6，0 是周日。设计稿的星期行也是从周日开始，正好对应
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  // 把日号传 0 会得到上个月最后一天，这是取月份天数的常用技巧
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const cells: CalendarCell[] = [];

  // 第一步：开头补上个月的尾巴。比如 1 号是周三，就要在前面补上月的最后 3 天
  for (let index = firstWeekday - 1; index >= 0; index -= 1) {
    const day = daysInPrevMonth - index;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    cells.push({
      key: toDateKey(prevYear, prevMonth, day),
      day,
      inMonth: false,
      // 上下月的格子不显示赛事点，避免用户误以为是本月的赛事
      hasEvent: false,
    });
  }

  // 第二步：填本月的每一天，顺便标记哪天有赛事
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = toDateKey(year, month, day);
    cells.push({ key, day, inMonth: true, hasEvent: eventDays.has(key) });
  }

  // 第三步：结尾补下个月的开头，凑满 42 格
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

  // 第四步：把 42 个格子切成 6 组，每组 7 个，对应页面上的 6 行
  const weeks: CalendarCell[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

/** 筛选日历顶上那句「2026年08月」 */
export function formatMonthTitle(year: number, month: number): string {
  return `${year}年${pad(month)}月`;
}

/** 已选择那句「08月24日」，从 YYYY-MM-DD 来 */
export function formatMonthDay(key: string): string {
  const parts = key.split('-');
  return `${parts[1]}月${parts[2]}日`;
}

/**
 * 从赛事 time 文案抠出日期键。假数据没有年份，一律按 2026。
 * 改了 time 写法（没有「08月29日」）这里会返回空字符串，那天就筛不中。
 */
export function eventDateKey(time: string, year = 2026): string {
  const matched = time.match(/(\d+)月(\d+)日/);
  if (!matched) {
    return '';
  }
  return toDateKey(year, Number(matched[1]), Number(matched[2]));
}

/**
 * 把日期键格式化成赛事列表上方那条标题，如「08月29日(周六)」。
 *
 * 想改格式在这里动，比如想显示成「2026年8月29日 星期六」：
 *   return `${year}年${month}月${day}日 星期${weekday}`;
 */
export function formatDayHeading(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  const weekday = WEEKDAY_NAMES[new Date(year, month - 1, day).getDay()];
  return `${pad(month)}月${pad(day)}日(周${weekday})`;
}
