import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getEffectiveBudgets } from '../db/repo/budgets';
import { getCategories } from '../db/repo/categories';
import { getAllExpenses, queryExpenses } from '../db/repo/expenses';
import { getSetting } from '../db/repo/settings';
import type { Budget, Category, DateRange, Expense, ExpenseFilter } from '../db/types';

export function useCategories(includeArchived = false): Category[] {
  return (
    useLiveQuery(() => getCategories(includeArchived, db), [includeArchived]) ?? []
  );
}

export function useExpenses(range?: DateRange, filter?: ExpenseFilter): Expense[] {
  const start = range?.start ?? '';
  const end = range?.end ?? '';
  const categoryId = filter?.categoryId ?? '';
  const tag = filter?.tag ?? '';
  const q = filter?.q ?? '';

  return (
    useLiveQuery(
      () =>
        queryExpenses(
          start && end ? { start, end } : undefined,
          {
            categoryId: categoryId || undefined,
            tag: tag || undefined,
            q: q || undefined,
          },
          db,
        ),
      [start, end, categoryId, tag, q],
    ) ?? []
  );
}

export function useAllExpenses(): Expense[] {
  return useLiveQuery(() => getAllExpenses(db), []) ?? [];
}

export function useEffectiveBudgets(month: string): Budget[] {
  return useLiveQuery(() => getEffectiveBudgets(month, db), [month]) ?? [];
}

export function useSetting<T>(key: string, fallback: T): T {
  const val = useLiveQuery(() => getSetting<T>(key, fallback, db), [key]);
  return val === undefined ? fallback : val;
}
