import { useMemo } from 'react';
import type { Category, Expense } from '../db/types';
import { formatCents } from '../lib/money';
import { formatDateHeader } from '../lib/period';
import { ExpenseRow } from './ExpenseRow';

interface ExpenseGroupListProps {
  expenses: Expense[];
  categories: Category[];
  onEdit: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
  emptyText?: string;
}

export function ExpenseGroupList({
  expenses,
  categories,
  onEdit,
  onDelete,
  emptyText = '还没有记录',
}: ExpenseGroupListProps) {
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const groups = useMemo(() => {
    const map = new Map<string, { date: string; totalCents: number; items: Expense[] }>();
    for (const exp of expenses) {
      const group = map.get(exp.date);
      if (group) {
        group.totalCents += exp.amountCents;
        group.items.push(exp);
      } else {
        map.set(exp.date, {
          date: exp.date,
          totalCents: exp.amountCents,
          items: [exp],
        });
      }
    }
    return Array.from(map.values());
  }, [expenses]);

  if (expenses.length === 0) {
    return (
      <div className="caption" style={{ padding: '24px 16px 24px 0', textAlign: 'center' }}>
        {emptyText}
      </div>
    );
  }

  return (
    <div>
      {groups.map((g) => (
        <div key={g.date}>
          <div className="day-header">
            <span>{formatDateHeader(g.date)}</span>
            <span className="num">{formatCents(g.totalCents)}</span>
          </div>
          {g.items.map((exp) => (
            <ExpenseRow
              key={exp.id}
              expense={exp}
              category={catMap.get(exp.categoryId)}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
