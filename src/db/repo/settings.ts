import { db, type FlowletDB } from '../index';

export async function getSetting<T>(
  key: string,
  fallback: T,
  database: FlowletDB = db,
): Promise<T> {
  const row = await database.settings.get(key);
  if (!row || row.value === undefined) return fallback;
  return row.value as T;
}

export async function setSetting<T>(
  key: string,
  value: T,
  database: FlowletDB = db,
): Promise<void> {
  await database.settings.put({ key, value });
}
