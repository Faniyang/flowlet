import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { FlowletDB, initDB } from '../index';
import { getBudgetsByMonth, getEffectiveBudgets, setBudget } from './budgets';
import { addCategory, archiveCategory, getCategories } from './categories';
import {
  addExpense,
  deleteExpense,
  deleteTag,
  queryExpenses,
  renameTag,
  updateExpense,
} from './expenses';
import { commitImportCSV, exportExpensesCSV, previewImportCSV } from '../../lib/io/csv';
import { exportBackupJSON, importBackupJSON } from '../../lib/io/json';

let testDb: FlowletDB;
let seq = 0;

beforeEach(async () => {
  seq += 1;
  testDb = new FlowletDB(`flowlet-test-${Date.now()}-${seq}`);
  await initDB(testDb);
});

describe('db & repo', () => {
  it('seeds 12 default categories with sport and without telecom', async () => {
    const cats = await getCategories(true, testDb);
    expect(cats).toHaveLength(12);
    expect(cats.some((c) => c.name === '运动' && c.icon === '🏃')).toBe(true);
    expect(cats.some((c) => c.name === '通讯')).toBe(false);
  });

  it('supports expense CRUD and multi-entry tag querying', async () => {
    const e1 = await addExpense(
      {
        amountCents: 4700,
        categoryId: 'food',
        date: '2026-11-18',
        note: '午饭',
        tags: ['聚餐', '同事'],
      },
      testDb,
    );
    await addExpense(
      {
        amountCents: 3000,
        categoryId: 'sport',
        date: '2026-11-16',
        note: '羽毛球',
        tags: ['运动'],
      },
      testDb,
    );

    const byTag = await queryExpenses(
      { start: '2026-11-01', end: '2026-11-30' },
      { tag: '聚餐' },
      testDb,
    );
    expect(byTag).toHaveLength(1);
    expect(byTag[0].id).toBe(e1.id);

    await updateExpense(e1.id, { amountCents: 5200 }, testDb);
    const afterUpdate = await queryExpenses(
      { start: '2026-11-01', end: '2026-11-30' },
      { categoryId: 'food' },
      testDb,
    );
    expect(afterUpdate[0].amountCents).toBe(5200);

    await deleteExpense(e1.id, testDb);
    const remaining = await queryExpenses(undefined, undefined, testDb);
    expect(remaining).toHaveLength(1);
  });

  it('renames, merges, and deletes tags across expenses', async () => {
    await addExpense(
      {
        amountCents: 2000,
        categoryId: 'food',
        date: '2026-11-18',
        note: '火锅',
        tags: ['聚餐', '团建'],
      },
      testDb,
    );

    const renamed = await renameTag('团建', '聚餐', testDb);
    expect(renamed).toBe(1);
    const items = await queryExpenses(undefined, undefined, testDb);
    expect(items[0].tags).toEqual(['聚餐']);

    const deleted = await deleteTag('聚餐', testDb);
    expect(deleted).toBe(1);
    const afterDel = await queryExpenses(undefined, undefined, testDb);
    expect(afterDel[0].tags).toEqual([]);
  });

  it('manages budgets with null total categoryId and month overrides', async () => {
    await setBudget('default', null, 500000, testDb);
    await setBudget('default', 'food', 150000, testDb);
    await setBudget('2026-11', 'food', 200000, testDb);

    const effNov = await getEffectiveBudgets('2026-11', testDb);
    expect(effNov.find((b) => b.categoryId === null)?.amountCents).toBe(500000);
    expect(effNov.find((b) => b.categoryId === 'food')?.amountCents).toBe(200000);

    const effDec = await getEffectiveBudgets('2026-12', testDb);
    expect(effDec.find((b) => b.categoryId === 'food')?.amountCents).toBe(150000);

    await setBudget('2026-11', 'food', 0, testDb);
    expect(await getBudgetsByMonth('2026-11', testDb)).toHaveLength(0);
  });

  it('commits CSV import with auto-created categories and restores JSON backup', async () => {
    const customCat = await addCategory({ name: '咖啡', icon: '☕', color: '#A2845E' }, testDb);
    await archiveCategory(customCat.id, true, testDb);
    expect((await getCategories(false, testDb)).some((c) => c.id === customCat.id)).toBe(false);

    const csv = '日期,金额,分类,标签,备注\n2026-11-18,38.50,宠物,猫咪|日常,猫粮';
    const preview = previewImportCSV(csv, [], await getCategories(true, testDb));
    const inserted = await commitImportCSV(preview, testDb);
    expect(inserted).toBe(1);
    const cats = await getCategories(true, testDb);
    expect(cats.some((c) => c.name === '宠物')).toBe(true);

    const json = await exportBackupJSON(testDb);
    const exportedCsv = exportExpensesCSV(await queryExpenses(undefined, undefined, testDb), cats);
    expect(exportedCsv).toContain('38.50');

    const otherDb = new FlowletDB(`flowlet-restore-${Date.now()}-${seq}`);
    await initDB(otherDb);
    const res = await importBackupJSON(json, 'overwrite', otherDb);
    expect(res.expenses).toBe(1);
    const restoredExpenses = await queryExpenses(undefined, undefined, otherDb);
    expect(restoredExpenses[0].note).toBe('猫粮');
  });
});
