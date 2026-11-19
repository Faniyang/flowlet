import type { Table } from 'dexie';
import type { Category, Setting } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: '餐饮', icon: '🍜', color: '#FF9500', sort: 0, archived: false },
  { id: 'transport', name: '交通', icon: '🚇', color: '#007AFF', sort: 1, archived: false },
  { id: 'shopping', name: '购物', icon: '🛍️', color: '#FF2D55', sort: 2, archived: false },
  { id: 'daily', name: '日用', icon: '🧴', color: '#5AC8FA', sort: 3, archived: false },
  { id: 'housing', name: '住房', icon: '🏠', color: '#AF52DE', sort: 4, archived: false },
  { id: 'fun', name: '娱乐', icon: '🎮', color: '#FFCC00', sort: 5, archived: false },
  { id: 'medical', name: '医疗', icon: '💊', color: '#FF6B6B', sort: 6, archived: false },
  { id: 'sport', name: '运动', icon: '🏃', color: '#34C759', sort: 7, archived: false },
  { id: 'study', name: '学习', icon: '📚', color: '#5856D6', sort: 8, archived: false },
  { id: 'gift', name: '人情', icon: '🎁', color: '#A2845E', sort: 9, archived: false },
  { id: 'travel', name: '旅行', icon: '✈️', color: '#00C7BE', sort: 10, archived: false },
  { id: 'other', name: '其他', icon: '📦', color: '#8E8E93', sort: 11, archived: false },
];

export const CATEGORY_COLOR_PALETTE = [
  '#FF9500',
  '#007AFF',
  '#FF2D55',
  '#5AC8FA',
  '#AF52DE',
  '#FFCC00',
  '#FF6B6B',
  '#34C759',
  '#5856D6',
  '#A2845E',
  '#00C7BE',
  '#8E8E93',
];

export const CATEGORY_EMOJI_PRESETS = [
  '🍜', '🚇', '🛍️', '🧴', '🏠', '🎮',
  '💊', '🏃', '📚', '🎁', '✈️', '📦',
  '☕', '🧋', '🍰', '🍺', '🚗', '⛽',
  '🎬', '🎵', '🐱', '🐶', '💡', '🧾',
];

interface SeedableDB {
  categories: Table<Category, string>;
  settings: Table<Setting, string>;
  transaction: <T>(
    mode: 'rw',
    t1: Table<Category, string>,
    t2: Table<Setting, string>,
    scope: () => Promise<T>,
  ) => Promise<T>;
}

export async function ensureSeeded(database: SeedableDB): Promise<void> {
  await database.transaction('rw', database.categories, database.settings, async () => {
    const seeded = await database.settings.get('seeded');
    const count = await database.categories.count();
    if (!seeded && count === 0) {
      await database.categories.bulkPut(DEFAULT_CATEGORIES);
      await database.settings.put({ key: 'seeded', value: true });
    } else if (!seeded) {
      await database.settings.put({ key: 'seeded', value: true });
    }
  });
}
