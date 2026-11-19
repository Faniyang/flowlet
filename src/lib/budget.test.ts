import { describe, expect, it } from 'vitest';
import { DEFAULT_CATEGORIES } from '../db/seed';
import type { Budget, Expense } from '../db/types';
import { budgetLevel, budgetStatus, crossedThresholds } from './budget';

describe('budget', () => {
  const budgets: Budget[] = [
    { id: 'b-total', month: 'default', categoryId: null, amountCents: 100000 },
    { id: 'b-food', month: 'default', categoryId: 'food', amountCents: 10000 },
  ];

  const mkExp = (id: string, categoryId: string, amountCents: number): Expense => ({
    id,
    categoryId,
    amountCents,
    date: '2026-11-18',
    note: '',
    tags: [],
    createdAt: 1,
    updatedAt: 1,
  });

  it('evaluates levels accurately', () => {
    expect(budgetLevel(0.79)).toBe('ok');
    expect(budgetLevel(0.8)).toBe('warn');
    expect(budgetLevel(1.0)).toBe('warn');
    expect(budgetLevel(1.01)).toBe('over');
  });

  it('detects crossed 80% and 100% thresholds once', () => {
    const before = budgetStatus(budgets, [mkExp('1', 'food', 5000)], DEFAULT_CATEGORIES);
    const at85 = budgetStatus(
      budgets,
      [mkExp('1', 'food', 5000), mkExp('2', 'food', 3500)],
      DEFAULT_CATEGORIES,
    );
    const firstCross = crossedThresholds(before, at85, 'food');
    expect(firstCross).toHaveLength(1);
    expect(firstCross[0].threshold).toBe(80);
    expect(firstCross[0].item.categoryId).toBe('food');

    const at95 = budgetStatus(
      budgets,
      [mkExp('1', 'food', 5000), mkExp('2', 'food', 3500), mkExp('3', 'food', 1000)],
      DEFAULT_CATEGORIES,
    );
    expect(crossedThresholds(at85, at95, 'food')).toHaveLength(0);

    const over100 = budgetStatus(
      budgets,
      [mkExp('1', 'food', 5000), mkExp('2', 'food', 3500), mkExp('3', 'food', 1000), mkExp('4', 'food', 1500)],
      DEFAULT_CATEGORIES,
    );
    const secondCross = crossedThresholds(at95, over100, 'food');
    expect(secondCross).toHaveLength(1);
    expect(secondCross[0].threshold).toBe(100);
    expect(secondCross[0].item.level).toBe('over');
  });
});
