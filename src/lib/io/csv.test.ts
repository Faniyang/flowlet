import { describe, expect, it } from 'vitest';
import { DEFAULT_CATEGORIES } from '../../db/seed';
import type { Expense } from '../../db/types';
import { exportExpensesCSV, previewImportCSV } from './csv';

describe('csv io', () => {
  const expenses: Expense[] = [
    {
      id: 'e1',
      date: '2026-11-18',
      amountCents: 4700,
      categoryId: 'food',
      note: '午饭, 加蛋',
      tags: ['聚餐', '同事'],
      createdAt: 1,
      updatedAt: 1,
    },
    {
      id: 'e2',
      date: '2026-11-17',
      amountCents: 3000,
      categoryId: 'sport',
      note: '羽毛球',
      tags: [],
      createdAt: 2,
      updatedAt: 2,
    },
  ];

  it('round-trips CSV export and import preview with BOM and duplicates', () => {
    const csv = exportExpensesCSV(expenses, DEFAULT_CATEGORIES);
    expect(csv.startsWith('\uFEFF日期,金额,分类,标签,备注')).toBe(true);

    // 导入空库
    const fresh = previewImportCSV(csv, [], DEFAULT_CATEGORIES);
    expect(fresh.errors).toEqual([]);
    expect(fresh.duplicateCount).toBe(0);
    expect(fresh.newCategoryNames).toEqual([]);
    expect(fresh.toAdd).toEqual([
      {
        date: '2026-11-18',
        amountCents: 4700,
        categoryName: '餐饮',
        tags: ['聚餐', '同事'],
        note: '午饭, 加蛋',
      },
      {
        date: '2026-11-17',
        amountCents: 3000,
        categoryName: '运动',
        tags: [],
        note: '羽毛球',
      },
    ]);

    // 重复导入同一份文件
    const dup = previewImportCSV(csv, expenses, DEFAULT_CATEGORIES);
    expect(dup.toAdd).toHaveLength(0);
    expect(dup.duplicateCount).toBe(2);
  });

  it('detects unknown categories and invalid rows', () => {
    const csv = `日期,金额,分类,标签,备注\n2026-11-18,99.5,宠物,猫粮,买罐头\n2026-02-30,10,餐饮,,坏日期`;
    const preview = previewImportCSV(csv, [], DEFAULT_CATEGORIES);
    expect(preview.toAdd).toHaveLength(1);
    expect(preview.newCategoryNames).toEqual(['宠物']);
    expect(preview.errors).toHaveLength(1);
  });
});
