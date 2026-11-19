import { db, type FlowletDB } from '../../db';
import type { Budget, Category, Expense, Setting } from '../../db/types';

export interface BackupPayload {
  schemaVersion: 1;
  app: 'flowlet';
  exportedAt: number;
  categories: Category[];
  expenses: Expense[];
  budgets: Budget[];
  settings: Setting[];
}

export async function exportBackupJSON(database: FlowletDB = db): Promise<string> {
  const exportedAt = Date.now();
  await database.settings.put({ key: 'lastBackupAt', value: exportedAt });

  const [categories, expenses, budgets, settings] = await Promise.all([
    database.categories.toArray(),
    database.expenses.toArray(),
    database.budgets.toArray(),
    database.settings.toArray(),
  ]);

  const payload: BackupPayload = {
    schemaVersion: 1,
    app: 'flowlet',
    exportedAt,
    categories,
    expenses,
    budgets,
    settings,
  };

  return JSON.stringify(payload, null, 2);
}

export function parseBackupJSON(jsonText: string): BackupPayload {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    throw new Error('JSON 格式无效，无法解析');
  }

  if (!raw || typeof raw !== 'object') {
    throw new Error('备份文件格式不正确');
  }
  const obj = raw as Record<string, unknown>;
  if (obj.schemaVersion !== 1) {
    throw new Error(`不支持的备份版本（${String(obj.schemaVersion ?? '未知')}）`);
  }
  if (
    !Array.isArray(obj.categories) ||
    !Array.isArray(obj.expenses) ||
    !Array.isArray(obj.budgets)
  ) {
    throw new Error('备份文件缺少必要数据表');
  }

  return {
    schemaVersion: 1,
    app: 'flowlet',
    exportedAt: typeof obj.exportedAt === 'number' ? obj.exportedAt : Date.now(),
    categories: obj.categories as Category[],
    expenses: obj.expenses as Expense[],
    budgets: obj.budgets as Budget[],
    settings: Array.isArray(obj.settings) ? (obj.settings as Setting[]) : [],
  };
}

export async function importBackupJSON(
  jsonText: string,
  mode: 'merge' | 'overwrite',
  database: FlowletDB = db,
): Promise<{ expenses: number; categories: number; budgets: number }> {
  const payload = parseBackupJSON(jsonText);

  if (mode === 'overwrite') {
    await database.transaction(
      'rw',
      database.categories,
      database.expenses,
      database.budgets,
      database.settings,
      async () => {
        await Promise.all([
          database.categories.clear(),
          database.expenses.clear(),
          database.budgets.clear(),
          database.settings.clear(),
        ]);
        if (payload.categories.length > 0) await database.categories.bulkPut(payload.categories);
        if (payload.expenses.length > 0) await database.expenses.bulkPut(payload.expenses);
        if (payload.budgets.length > 0) await database.budgets.bulkPut(payload.budgets);
        if (payload.settings.length > 0) await database.settings.bulkPut(payload.settings);
        await database.settings.put({ key: 'seeded', value: true });
      },
    );
    return {
      expenses: payload.expenses.length,
      categories: payload.categories.length,
      budgets: payload.budgets.length,
    };
  }

  let addedCats = 0;
  let addedExpenses = 0;
  let addedBudgets = 0;

  await database.transaction(
    'rw',
    database.categories,
    database.expenses,
    database.budgets,
    async () => {
      const [curCats, curExpenses, curBudgets] = await Promise.all([
        database.categories.toArray(),
        database.expenses.toArray(),
        database.budgets.toArray(),
      ]);

      const catIds = new Set(curCats.map((c) => c.id));
      const catNameToId = new Map(curCats.map((c) => [c.name.trim(), c.id]));
      const incomingCatIdMap = new Map<string, string>();
      const catsToInsert: Category[] = [];

      for (const c of payload.categories) {
        if (catIds.has(c.id)) {
          incomingCatIdMap.set(c.id, c.id);
        } else if (catNameToId.has(c.name.trim())) {
          incomingCatIdMap.set(c.id, catNameToId.get(c.name.trim())!);
        } else {
          catsToInsert.push(c);
          catIds.add(c.id);
          catNameToId.set(c.name.trim(), c.id);
          incomingCatIdMap.set(c.id, c.id);
        }
      }
      if (catsToInsert.length > 0) {
        await database.categories.bulkPut(catsToInsert);
        addedCats = catsToInsert.length;
      }

      const expIds = new Set(curExpenses.map((e) => e.id));
      const expKeys = new Set(
        curExpenses.map((e) => `${e.date}|${e.amountCents}|${e.note.trim()}`),
      );
      const expsToInsert: Expense[] = [];

      for (const e of payload.expenses) {
        const key = `${e.date}|${e.amountCents}|${e.note.trim()}`;
        if (expIds.has(e.id) || expKeys.has(key)) continue;
        expsToInsert.push({
          ...e,
          categoryId: incomingCatIdMap.get(e.categoryId) ?? e.categoryId,
        });
        expIds.add(e.id);
      }
      if (expsToInsert.length > 0) {
        await database.expenses.bulkPut(expsToInsert);
        addedExpenses = expsToInsert.length;
      }

      const budgetKeys = new Set(
        curBudgets.map((b) => `${b.month}::${b.categoryId ?? '__total__'}`),
      );
      const budgetsToInsert: Budget[] = [];
      for (const b of payload.budgets) {
        const mappedCat = b.categoryId === null ? null : (incomingCatIdMap.get(b.categoryId) ?? b.categoryId);
        const bKey = `${b.month}::${mappedCat ?? '__total__'}`;
        if (budgetKeys.has(bKey)) continue;
        budgetsToInsert.push({ ...b, categoryId: mappedCat });
        budgetKeys.add(bKey);
      }
      if (budgetsToInsert.length > 0) {
        await database.budgets.bulkPut(budgetsToInsert);
        addedBudgets = budgetsToInsert.length;
      }
    },
  );

  return {
    expenses: addedExpenses,
    categories: addedCats,
    budgets: addedBudgets,
  };
}
