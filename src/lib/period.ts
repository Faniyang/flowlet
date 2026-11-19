import {
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfYear,
  format,
  parseISO,
  startOfMonth,
  startOfYear,
  subDays,
} from 'date-fns';
import type { DateRange } from '../db/types';

export type PeriodMode = 'month' | 'year' | 'custom';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function todayStr(now: Date = new Date()): string {
  return format(now, 'yyyy-MM-dd');
}

export function currentMonthStr(now: Date = new Date()): string {
  return format(now, 'yyyy-MM');
}

export function getMonthRange(ym: string): DateRange {
  const anchor = parseISO(`${ym}-01`);
  return {
    start: format(startOfMonth(anchor), 'yyyy-MM-dd'),
    end: format(endOfMonth(anchor), 'yyyy-MM-dd'),
  };
}

export function getYearRange(year: number): DateRange {
  const anchor = parseISO(`${year}-01-01`);
  return {
    start: format(startOfYear(anchor), 'yyyy-MM-dd'),
    end: format(endOfYear(anchor), 'yyyy-MM-dd'),
  };
}

export function shiftMonth(ym: string, delta: number): string {
  const anchor = parseISO(`${ym}-01`);
  return format(addMonths(anchor, delta), 'yyyy-MM');
}

export function shiftDate(dateStr: string, deltaDays: number): string {
  const d = parseISO(dateStr);
  return deltaDays >= 0
    ? format(subDays(d, -deltaDays), 'yyyy-MM-dd')
    : format(subDays(d, -deltaDays), 'yyyy-MM-dd');
}

export function getPreviousPeriodRange(
  mode: PeriodMode,
  range: DateRange,
  today?: string,
): DateRange {
  if (mode === 'month') {
    const prevYm = shiftMonth(range.start.slice(0, 7), -1);
    const fullPrev = getMonthRange(prevYm);
    if (today && today >= range.start && today < range.end) {
      const elapsed = getElapsedDaysInRange(range, today);
      const syncEnd = shiftDate(fullPrev.start, Math.max(0, elapsed - 1));
      return {
        start: fullPrev.start,
        end: syncEnd < fullPrev.end ? syncEnd : fullPrev.end,
      };
    }
    return fullPrev;
  }
  if (mode === 'year') {
    const year = Number.parseInt(range.start.slice(0, 4), 10);
    const fullPrev = getYearRange(year - 1);
    if (today && today >= range.start && today < range.end) {
      const elapsed = getElapsedDaysInRange(range, today);
      const syncEnd = shiftDate(fullPrev.start, Math.max(0, elapsed - 1));
      return {
        start: fullPrev.start,
        end: syncEnd < fullPrev.end ? syncEnd : fullPrev.end,
      };
    }
    return fullPrev;
  }
  const start = parseISO(range.start);
  const end = parseISO(range.end);
  const spanDays = Math.max(1, differenceInCalendarDays(end, start) + 1);
  const prevEnd = subDays(start, 1);
  const prevStart = subDays(prevEnd, spanDays - 1);
  return {
    start: format(prevStart, 'yyyy-MM-dd'),
    end: format(prevEnd, 'yyyy-MM-dd'),
  };
}

export function eachDateInRange(range: DateRange): string[] {
  const start = parseISO(range.start);
  const end = parseISO(range.end);
  if (start > end) return [];
  return eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd'));
}

export function getTotalDaysInRange(range: DateRange): number {
  const start = parseISO(range.start);
  const end = parseISO(range.end);
  return Math.max(1, differenceInCalendarDays(end, start) + 1);
}

export function getElapsedDaysInRange(range: DateRange, today: string = todayStr()): number {
  if (today < range.start) return 0;
  if (today >= range.end) return getTotalDaysInRange(range);
  return differenceInCalendarDays(parseISO(today), parseISO(range.start)) + 1;
}

export function formatMonthLabel(ym: string): string {
  const year = Number.parseInt(ym.slice(0, 4), 10);
  const month = Number.parseInt(ym.slice(5, 7), 10);
  return `${year}年${month}月`;
}

export function formatDateHeader(dateStr: string, today: string = todayStr()): string {
  if (dateStr === today) return '今天';
  const yesterday = format(subDays(parseISO(today), 1), 'yyyy-MM-dd');
  if (dateStr === yesterday) return '昨天';
  const d = parseISO(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const wk = WEEKDAYS[d.getDay()];
  if (dateStr.slice(0, 4) !== today.slice(0, 4)) {
    return `${dateStr.slice(0, 4)}年${month}月${day}日 周${wk}`;
  }
  return `${month}月${day}日 周${wk}`;
}
