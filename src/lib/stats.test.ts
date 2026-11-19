import { describe, expect, it } from 'vitest';
import type { Expense } from '../db/types';
import { byCategory, byDay, byMonth, byTag, comparePeriods, topN } from './stats';

const mk = (
  id: string,
  date: string,
  categoryId: string,
  amountCents: number,
  tags: string[] = [],
): Expense => ({
  id,
  date,
  categoryId,
  amountCents,
  note: '',
  tags,
  createdAt: 1,
  updatedAt: 1,
});

describe('stats', () => {
  const sample: Expense[] = [
    mk('1', '2026-11-01', 'food', 3000, ['聚餐']),
    mk('2', '2026-11-01', 'transport', 1000),
    mk('3', '2026-11-03', 'food', 6000, ['聚餐', '同事']),
  ];

  it('aggregates by category sorted descending with ratios', () => {
    const res = byCategory(sample);
    expect(res).toEqual([
      { categoryId: 'food', totalCents: 9000, count: 2, ratio: 0.9 },
      { categoryId: 'transport', totalCents: 1000, count: 1, ratio: 0.1 },
    ]);
  });

  it('fills zero-spend days in byDay', () => {
    const res = byDay(sample, { start: '2026-11-01', end: '2026-11-03' });
    expect(res).toEqual([
      { date: '2026-11-01', totalCents: 4000 },
      { date: '2026-11-02', totalCents: 0 },
      { date: '2026-11-03', totalCents: 6000 },
    ]);
  });

  it('aggregates 12 months in byMonth', () => {
    const res = byMonth(sample, 2026);
    expect(res).toHaveLength(12);
    expect(res[10]).toEqual({ month: '2026-11', label: '11月', totalCents: 10000 });
    expect(res[0].totalCents).toBe(0);
  });

  it('aggregates tags and topN', () => {
    expect(byTag(sample)).toEqual([
      { tag: '聚餐', totalCents: 9000, count: 2 },
      { tag: '同事', totalCents: 6000, count: 1 },
    ]);
    expect(topN(sample, 2).map((e) => e.id)).toEqual(['3', '1']);
  });

  it('compares current and previous periods', () => {
    const prev: Expense[] = [mk('p1', '2026-10-02', 'food', 4500)];
    const cmp = comparePeriods(sample, prev);
    expect(cmp.currTotalCents).toBe(10000);
    expect(cmp.prevTotalCents).toBe(4500);
    expect(cmp.deltaCents).toBe(5500);
    expect(cmp.byCategory[0]).toEqual({
      categoryId: 'food',
      currCents: 9000,
      prevCents: 4500,
      deltaCents: 4500,
      deltaRatio: 1,
    });
    expect(cmp.byCategory[1]).toEqual({
      categoryId: 'transport',
      currCents: 1000,
      prevCents: 0,
      deltaCents: 1000,
      deltaRatio: null,
    });
  });
});
