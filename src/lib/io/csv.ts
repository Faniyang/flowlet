import { format, isValid, parseISO } from 'date-fns';
import { nanoid } from 'nanoid';
import Papa from 'papaparse';
import { db, type FlowletDB } from '../../db';
import { CATEGORY_COLOR_PALETTE } from '../../db/seed';
import type { Category, Expense } from '../../db/types';

export interface CSVImportRow {
  date: string;
  amountCents: number;
  categoryName: string;
  tags: string[];
  note: string;
}

export interface CSVImportPreview {
  toAdd: CSVImportRow[];
  duplicateCount: number;
  newCategoryNames: string[];
  errors: string[];
  totalRows: number;
}

function dedupKey(date: string, amountCents: number, note: string): string {
  return `${date}|${amountCents}|${note.trim()}`;
}

function isValidYmd(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const parsed = parseISO(dateStr);
  return isValid(parsed) && format(parsed, 'yyyy-MM-dd') === dateStr;
}

export function exportExpensesCSV(expenses: Expense[], categories: Category[]): string {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const rows = expenses.map((e) => [
    e.date,
    (e.amountCents / 100).toFixed(2),
    catMap.get(e.categoryId) ?? '其他',
    e.tags.join('|'),
    e.note,
  ]);

  const csv = Papa.unparse({
    fields: ['日期', '金额', '分类', '标签', '备注'],
    data: rows,
  });

  return '\uFEFF' + csv;
}

export function previewImportCSV(
  csvText: string,
  existingExpenses: Expense[],
  existingCategories: Category[],
): CSVImportPreview {
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  if (!cleanText) {
    return {
      toAdd: [],
      duplicateCount: 0,
      newCategoryNames: [],
      errors: ['CSV 文件内容为空'],
      totalRows: 0,
    };
  }

  const parsed = Papa.parse<Record<string, string>>(cleanText, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });

  const fields = parsed.meta.fields ?? [];
  if (!fields.includes('日期') || !fields.includes('金额') || !fields.includes('分类')) {
    return {
      toAdd: [],
      duplicateCount: 0,
      newCategoryNames: [],
      errors: ['缺少必要列：请确认表头包含「日期,金额,分类」'],
      totalRows: parsed.data.length,
    };
  }

  const existingKeys = new Set(
    existingExpenses.map((e) => dedupKey(e.date, e.amountCents, e.note)),
  );
  const existingCatNames = new Set(existingCategories.map((c) => c.name.trim()));
  const newCatSet = new Set<string>();
  const toAdd: CSVImportRow[] = [];
  const errors: string[] = [];
  let duplicateCount = 0;

  for (let i = 0; i < parsed.data.length; i += 1) {
    const row = parsed.data[i];
    const lineNo = i + 2;
    const date = (row['日期'] ?? '').trim();
    const rawAmount = (row['金额'] ?? '').trim().replace(/^[¥￥]/, '').replace(/,/g, '');
    const categoryName = (row['分类'] ?? '').trim() || '其他';
    const rawTags = (row['标签'] ?? '').trim();
    const note = (row['备注'] ?? '').trim();

    if (!isValidYmd(date)) {
      errors.push(`第 ${lineNo} 行：日期格式无效（${date || '空'}）`);
      continue;
    }

    const amountNum = Number.parseFloat(rawAmount);
    const amountCents = Math.round(amountNum * 100);
    if (!Number.isFinite(amountNum) || amountCents <= 0) {
      errors.push(`第 ${lineNo} 行：金额无效（${row['金额'] || '空'}）`);
      continue;
    }

    if (existingKeys.has(dedupKey(date, amountCents, note))) {
      duplicateCount += 1;
      continue;
    }

    if (!existingCatNames.has(categoryName)) {
      newCatSet.add(categoryName);
    }

    const tags = Array.from(
      new Set(
        rawTags
          .split('|')
          .map((t) => t.trim().replace(/^#+/, ''))
          .filter(Boolean),
      ),
    );

    toAdd.push({
      date,
      amountCents,
      categoryName,
      tags,
      note,
    });
  }

  return {
    toAdd,
    duplicateCount,
    newCategoryNames: Array.from(newCatSet),
    errors,
    totalRows: parsed.data.length,
  };
}

export async function commitImportCSV(
  preview: CSVImportPreview,
  database: FlowletDB = db,
): Promise<number> {
  if (preview.toAdd.length === 0) return 0;

  await database.transaction('rw', database.categories, database.expenses, async () => {
    const cats = await database.categories.toArray();
    const nameToId = new Map(cats.map((c) => [c.name.trim(), c.id]));
    let nextSort = cats.reduce((m, c) => Math.max(m, c.sort), -1) + 1;

    const newCats: Category[] = [];
    for (const name of preview.newCategoryNames) {
      if (nameToId.has(name)) continue;
      const id = nanoid();
      const color = CATEGORY_COLOR_PALETTE[nextSort % CATEGORY_COLOR_PALETTE.length];
      const cat: Category = {
        id,
        name,
        icon: '📦',
        color,
        sort: nextSort,
        archived: false,
      };
      nextSort += 1;
      newCats.push(cat);
      nameToId.set(name, id);
    }

    if (newCats.length > 0) {
      await database.categories.bulkPut(newCats);
    }

    const now = Date.now();
    const toInsert: Expense[] = preview.toAdd.map((row, idx) => ({
      id: nanoid(),
      amountCents: row.amountCents,
      categoryId: nameToId.get(row.categoryName) ?? 'other',
      date: row.date,
      note: row.note,
      tags: row.tags,
      createdAt: now + idx,
      updatedAt: now,
    }));

    await database.expenses.bulkPut(toInsert);
  });

  return preview.toAdd.length;
}
