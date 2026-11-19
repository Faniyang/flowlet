export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort: number;
  archived: boolean;
}

export interface Expense {
  id: string;
  amountCents: number;
  categoryId: string;
  date: string; // 'YYYY-MM-DD'
  note: string;
  tags: string[]; // 不含 '#'
  createdAt: number;
  updatedAt: number;
}

export interface NewExpense {
  amountCents: number;
  categoryId: string;
  date: string;
  note: string;
  tags: string[];
}

export interface Budget {
  id: string;
  month: string; // 'default' 或 'YYYY-MM'
  categoryId: string | null; // null 表示月度总预算
  amountCents: number;
}

export interface Setting {
  key: string;
  value: unknown;
}

export interface DateRange {
  start: string; // 'YYYY-MM-DD'
  end: string; // 'YYYY-MM-DD'
}

export interface ExpenseFilter {
  categoryId?: string;
  tag?: string;
  q?: string;
}
