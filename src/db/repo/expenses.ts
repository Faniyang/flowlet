import { nanoid } from 'nanoid';
import { db, type FlowletDB } from '../index';
import type { DateRange, Expense, ExpenseFilter, NewExpense } from '../types';

export async function addExpense(input: NewExpense, database: FlowletDB = db): Promise<Expense> {
  const now = Date.now();
  const expense: Expense = {
    id: nanoid(),
    amountCents: Math.round(input.amountCents),
    categoryId: input.categoryId,
    date: input.date,
    note: input.note.trim(),
    tags: Array.from(new Set(input.tags.map((t) => t.trim()).filter(Boolean))),
    createdAt: now,
    updatedAt: now,
  };
  await database.expenses.put(expense);
  return expense;
}

export async function updateExpense(
  id: string,
  patch: Partial<NewExpense>,
  database: FlowletDB = db,
): Promise<void> {
  const next: Partial<Expense> = { updatedAt: Date.now() };
  if (patch.amountCents !== undefined) next.amountCents = Math.round(patch.amountCents);
  if (patch.categoryId !== undefined) next.categoryId = patch.categoryId;
  if (patch.date !== undefined) next.date = patch.date;
  if (patch.note !== undefined) next.note = patch.note.trim();
  if (patch.tags !== undefined) {
    next.tags = Array.from(new Set(patch.tags.map((t) => t.trim()).filter(Boolean)));
  }
  await database.expenses.update(id, next);
}

export async function deleteExpense(id: string, database: FlowletDB = db): Promise<void> {
  await database.expenses.delete(id);
}

export async function getAllExpenses(database: FlowletDB = db): Promise<Expense[]> {
  const items = await database.expenses.toArray();
  return sortExpensesDesc(items);
}

export async function queryExpenses(
  range?: DateRange,
  filter?: ExpenseFilter,
  database: FlowletDB = db,
): Promise<Expense[]> {
  let items: Expense[];
  if (range) {
    items = await database.expenses.where('date').between(range.start, range.end, true, true).toArray();
  } else {
    items = await database.expenses.toArray();
  }

  const q = filter?.q?.trim().toLowerCase();
  const filtered = items.filter((item) => {
    if (filter?.categoryId && item.categoryId !== filter.categoryId) return false;
    if (filter?.tag && !item.tags.includes(filter.tag)) return false;
    if (q) {
      const inNote = item.note.toLowerCase().includes(q);
      const inTags = item.tags.some((t) => t.toLowerCase().includes(q));
      if (!inNote && !inTags) return false;
    }
    return true;
  });

  return sortExpensesDesc(filtered);
}

export async function renameTag(
  from: string,
  to: string,
  database: FlowletDB = db,
): Promise<number> {
  const cleanFrom = from.replace(/^#+/, '').trim();
  const cleanTo = to.replace(/^#+/, '').trim();
  if (!cleanFrom || !cleanTo || cleanFrom === cleanTo) return 0;

  let changed = 0;
  await database.transaction('rw', database.expenses, async () => {
    const matched = await database.expenses.where('tags').equals(cleanFrom).toArray();
    const now = Date.now();
    for (const exp of matched) {
      const nextTags = Array.from(
        new Set(exp.tags.map((t) => (t === cleanFrom ? cleanTo : t))),
      );
      await database.expenses.update(exp.id, { tags: nextTags, updatedAt: now });
      changed += 1;
    }
  });
  return changed;
}

export async function deleteTag(tag: string, database: FlowletDB = db): Promise<number> {
  const cleanTag = tag.replace(/^#+/, '').trim();
  if (!cleanTag) return 0;

  let changed = 0;
  await database.transaction('rw', database.expenses, async () => {
    const matched = await database.expenses.where('tags').equals(cleanTag).toArray();
    const now = Date.now();
    for (const exp of matched) {
      const nextTags = exp.tags.filter((t) => t !== cleanTag);
      await database.expenses.update(exp.id, { tags: nextTags, updatedAt: now });
      changed += 1;
    }
  });
  return changed;
}

export function sortExpensesDesc(items: Expense[]): Expense[] {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return b.createdAt - a.createdAt;
  });
}
