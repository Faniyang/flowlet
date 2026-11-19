import { nanoid } from 'nanoid';
import { db, type FlowletDB } from '../index';
import type { Budget } from '../types';

export async function getEffectiveBudgets(
  month: string,
  database: FlowletDB = db,
): Promise<Budget[]> {
  const rows = await database.budgets.where('month').anyOf(['default', month]).toArray();
  const map = new Map<string, Budget>();

  for (const b of rows) {
    if (b.month === 'default') {
      map.set(b.categoryId ?? '__total__', b);
    }
  }
  for (const b of rows) {
    if (b.month === month) {
      map.set(b.categoryId ?? '__total__', b);
    }
  }

  return Array.from(map.values());
}

export async function getBudgetsByMonth(
  month: string,
  database: FlowletDB = db,
): Promise<Budget[]> {
  return database.budgets.where('month').equals(month).toArray();
}

export async function setBudget(
  month: string,
  categoryId: string | null,
  amountCents: number,
  database: FlowletDB = db,
): Promise<void> {
  const cleanCents = Math.round(amountCents);
  await database.transaction('rw', database.budgets, async () => {
    const existing = await database.budgets
      .where('month')
      .equals(month)
      .filter((b) => b.categoryId === categoryId)
      .toArray();

    if (cleanCents <= 0) {
      if (existing.length > 0) {
        await database.budgets.bulkDelete(existing.map((b) => b.id));
      }
      return;
    }

    if (existing.length > 0) {
      await database.budgets.update(existing[0].id, { amountCents: cleanCents });
      if (existing.length > 1) {
        await database.budgets.bulkDelete(existing.slice(1).map((b) => b.id));
      }
    } else {
      await database.budgets.put({
        id: nanoid(),
        month,
        categoryId,
        amountCents: cleanCents,
      });
    }
  });
}
