import type { Budget, Category, Expense } from '../db/types';

export type BudgetLevel = 'ok' | 'warn' | 'over';

export interface BudgetItemStatus {
  budgetId: string;
  categoryId: string | null;
  name: string;
  icon?: string;
  color?: string;
  limitCents: number;
  usedCents: number;
  remainingCents: number;
  ratio: number;
  level: BudgetLevel;
}

export interface CrossedThreshold {
  item: BudgetItemStatus;
  threshold: 80 | 100;
}

export function budgetLevel(ratio: number): BudgetLevel {
  if (ratio > 1) return 'over';
  if (ratio >= 0.8) return 'warn';
  return 'ok';
}

export function budgetStatus(
  budgets: Budget[],
  expenses: Expense[],
  categories: Category[],
): BudgetItemStatus[] {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  let totalUsed = 0;
  const usedByCat = new Map<string, number>();

  for (const e of expenses) {
    totalUsed += e.amountCents;
    usedByCat.set(e.categoryId, (usedByCat.get(e.categoryId) ?? 0) + e.amountCents);
  }

  const statuses: BudgetItemStatus[] = [];
  for (const b of budgets) {
    if (b.amountCents <= 0) continue;
    const isTotal = b.categoryId === null;
    const cat = isTotal ? undefined : catMap.get(b.categoryId!);
    if (!isTotal && !cat) continue;

    const usedCents = isTotal ? totalUsed : (usedByCat.get(b.categoryId!) ?? 0);
    const ratio = usedCents / b.amountCents;

    statuses.push({
      budgetId: b.id,
      categoryId: b.categoryId,
      name: isTotal ? '本月总预算' : cat!.name,
      icon: cat?.icon,
      color: cat?.color,
      limitCents: b.amountCents,
      usedCents,
      remainingCents: b.amountCents - usedCents,
      ratio,
      level: budgetLevel(ratio),
    });
  }

  return statuses.sort((a, b) => {
    if (a.categoryId === null && b.categoryId !== null) return -1;
    if (a.categoryId !== null && b.categoryId === null) return 1;
    return b.ratio - a.ratio;
  });
}

export function crossedThresholds(
  before: BudgetItemStatus[],
  after: BudgetItemStatus[],
  categoryId: string,
): CrossedThreshold[] {
  const beforeMap = new Map(before.map((b) => [b.categoryId ?? '__total__', b.ratio]));
  const alerts: CrossedThreshold[] = [];

  for (const item of after) {
    if (item.categoryId !== null && item.categoryId !== categoryId) continue;
    const prevRatio = beforeMap.get(item.categoryId ?? '__total__') ?? 0;

    if (prevRatio < 1 && item.ratio >= 1) {
      alerts.push({ item, threshold: 100 });
    } else if (prevRatio < 0.8 && item.ratio >= 0.8) {
      alerts.push({ item, threshold: 80 });
    }
  }

  return alerts.sort((a, b) => {
    if (b.threshold !== a.threshold) return b.threshold - a.threshold;
    return b.item.ratio - a.item.ratio;
  });
}
