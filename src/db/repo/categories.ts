import { nanoid } from 'nanoid';
import { db, type FlowletDB } from '../index';
import type { Category } from '../types';

export async function getCategories(
  includeArchived = false,
  database: FlowletDB = db,
): Promise<Category[]> {
  const all = await database.categories.orderBy('sort').toArray();
  return includeArchived ? all : all.filter((c) => !c.archived);
}

export async function addCategory(
  input: { name: string; icon: string; color: string },
  database: FlowletDB = db,
): Promise<Category> {
  const existing = await database.categories.toArray();
  const maxSort = existing.reduce((max, c) => Math.max(max, c.sort), -1);
  const category: Category = {
    id: nanoid(),
    name: input.name.trim(),
    icon: input.icon || '📦',
    color: input.color || '#8E8E93',
    sort: maxSort + 1,
    archived: false,
  };
  await database.categories.put(category);
  return category;
}

export async function updateCategory(
  id: string,
  patch: Partial<Omit<Category, 'id'>>,
  database: FlowletDB = db,
): Promise<void> {
  const next: Partial<Category> = { ...patch };
  if (next.name !== undefined) next.name = next.name.trim();
  await database.categories.update(id, next);
}

export async function archiveCategory(
  id: string,
  archived = true,
  database: FlowletDB = db,
): Promise<void> {
  await database.categories.update(id, { archived });
}

export async function reorderCategories(
  orderedIds: string[],
  database: FlowletDB = db,
): Promise<void> {
  await database.transaction('rw', database.categories, async () => {
    for (let i = 0; i < orderedIds.length; i += 1) {
      await database.categories.update(orderedIds[i], { sort: i });
    }
  });
}
