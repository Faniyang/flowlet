import Dexie, { type Table } from 'dexie';
import type { Budget, Category, Expense, Setting } from './types';
import { ensureSeeded } from './seed';

export class FlowletDB extends Dexie {
  expenses!: Table<Expense, string>;
  categories!: Table<Category, string>;
  budgets!: Table<Budget, string>;
  settings!: Table<Setting, string>;

  constructor(name = 'flowlet-db') {
    super(name);
    this.version(1).stores({
      expenses: 'id, date, categoryId, *tags, createdAt',
      categories: 'id, sort',
      budgets: 'id, month',
      settings: 'key',
    });
  }
}

export const db = new FlowletDB();

let initPromise: Promise<void> | null = null;

export function initDB(database: FlowletDB = db): Promise<void> {
  if (database === db) {
    if (!initPromise) {
      initPromise = runInit(database);
    }
    return initPromise;
  }
  return runInit(database);
}

async function runInit(database: FlowletDB): Promise<void> {
  await ensureSeeded(database);
  if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
    try {
      await navigator.storage.persist();
    } catch {
      // 忽略部分浏览器拒绝持久化权限请求
    }
  }
}
