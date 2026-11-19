import type { DateRange, Expense } from '../db/types';
import { eachDateInRange } from './period';

export interface CategoryStat {
  categoryId: string;
  totalCents: number;
  count: number;
  ratio: number;
}

export interface DayStat {
  date: string;
  totalCents: number;
}

export interface MonthStat {
  month: string;
  label: string;
  totalCents: number;
}

export interface TagStat {
  tag: string;
  totalCents: number;
  count: number;
}

export interface CategoryCompare {
  categoryId: string;
  currCents: number;
  prevCents: number;
  deltaCents: number;
  deltaRatio: number | null;
}

export interface PeriodComparison {
  currTotalCents: number;
  prevTotalCents: number;
  deltaCents: number;
  deltaRatio: number | null;
  byCategory: CategoryCompare[];
}

export function sumCents(expenses: Expense[]): number {
  let total = 0;
  for (const e of expenses) {
    total += e.amountCents;
  }
  return total;
}

export function byCategory(expenses: Expense[]): CategoryStat[] {
  const map = new Map<string, { totalCents: number; count: number }>();
  let grandTotal = 0;

  for (const e of expenses) {
    grandTotal += e.amountCents;
    const cur = map.get(e.categoryId);
    if (cur) {
      cur.totalCents += e.amountCents;
      cur.count += 1;
    } else {
      map.set(e.categoryId, { totalCents: e.amountCents, count: 1 });
    }
  }

  return Array.from(map.entries())
    .map(([categoryId, data]) => ({
      categoryId,
      totalCents: data.totalCents,
      count: data.count,
      ratio: grandTotal > 0 ? data.totalCents / grandTotal : 0,
    }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

export function byDay(expenses: Expense[], range: DateRange): DayStat[] {
  const map = new Map<string, number>();
  for (const e of expenses) {
    map.set(e.date, (map.get(e.date) ?? 0) + e.amountCents);
  }
  return eachDateInRange(range).map((date) => ({
    date,
    totalCents: map.get(date) ?? 0,
  }));
}

export function byMonth(expenses: Expense[], year: number): MonthStat[] {
  const prefix = `${year}-`;
  const totals = new Array<number>(12).fill(0);
  for (const e of expenses) {
    if (!e.date.startsWith(prefix)) continue;
    const monthIdx = Number.parseInt(e.date.slice(5, 7), 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      totals[monthIdx] += e.amountCents;
    }
  }
  return totals.map((totalCents, idx) => {
    const m = String(idx + 1).padStart(2, '0');
    return {
      month: `${year}-${m}`,
      label: `${idx + 1}月`,
      totalCents,
    };
  });
}

export function byTag(expenses: Expense[]): TagStat[] {
  const map = new Map<string, { totalCents: number; count: number }>();
  for (const e of expenses) {
    for (const tag of e.tags) {
      const cur = map.get(tag);
      if (cur) {
        cur.totalCents += e.amountCents;
        cur.count += 1;
      } else {
        map.set(tag, { totalCents: e.amountCents, count: 1 });
      }
    }
  }
  return Array.from(map.entries())
    .map(([tag, data]) => ({
      tag,
      totalCents: data.totalCents,
      count: data.count,
    }))
    .sort((a, b) => b.totalCents - a.totalCents || b.count - a.count);
}

export function topN(expenses: Expense[], n = 10): Expense[] {
  return [...expenses]
    .sort((a, b) => b.amountCents - a.amountCents || (a.date < b.date ? 1 : -1))
    .slice(0, n);
}

export function comparePeriods(curr: Expense[], prev: Expense[]): PeriodComparison {
  const currTotalCents = sumCents(curr);
  const prevTotalCents = sumCents(prev);
  const deltaCents = currTotalCents - prevTotalCents;
  const deltaRatio = prevTotalCents > 0 ? deltaCents / prevTotalCents : null;

  const currMap = new Map<string, number>();
  for (const e of curr) {
    currMap.set(e.categoryId, (currMap.get(e.categoryId) ?? 0) + e.amountCents);
  }
  const prevMap = new Map<string, number>();
  for (const e of prev) {
    prevMap.set(e.categoryId, (prevMap.get(e.categoryId) ?? 0) + e.amountCents);
  }

  const allCats = new Set([...currMap.keys(), ...prevMap.keys()]);
  const catCompares: CategoryCompare[] = [];

  for (const categoryId of allCats) {
    const currCents = currMap.get(categoryId) ?? 0;
    const prevCents = prevMap.get(categoryId) ?? 0;
    const catDelta = currCents - prevCents;
    if (catDelta === 0) continue;
    catCompares.push({
      categoryId,
      currCents,
      prevCents,
      deltaCents: catDelta,
      deltaRatio: prevCents > 0 ? catDelta / prevCents : null,
    });
  }

  catCompares.sort((a, b) => Math.abs(b.deltaCents) - Math.abs(a.deltaCents));

  return {
    currTotalCents,
    prevTotalCents,
    deltaCents,
    deltaRatio,
    byCategory: catCompares,
  };
}
