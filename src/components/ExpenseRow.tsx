import { useRef, useState } from 'react';
import type { Category, Expense } from '../db/types';
import { formatCents } from '../lib/money';
import { formatDateHeader } from '../lib/period';
import { CategoryIcon } from './CategoryIcon';

interface ExpenseRowProps {
  expense: Expense;
  category?: Category;
  showDate?: boolean;
  onEdit: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
}

export function ExpenseRow({
  expense,
  category,
  showDate = false,
  onEdit,
  onDelete,
}: ExpenseRowProps) {
  const [swiped, setSwiped] = useState(false);
  const startXRef = useRef<number | null>(null);

  const catName = category?.name ?? '其他';
  const catIcon = category?.icon ?? '📦';
  const catColor = category?.color ?? '#8E8E93';

  const subtitleParts: string[] = [];
  if (showDate) subtitleParts.push(formatDateHeader(expense.date));
  subtitleParts.push(catName);
  for (const t of expense.tags) {
    subtitleParts.push(`#${t}`);
  }

  const handleTouchStart = (ev: React.TouchEvent) => {
    if (!onDelete) return;
    startXRef.current = ev.touches[0].clientX;
  };

  const handleTouchEnd = (ev: React.TouchEvent) => {
    if (!onDelete || startXRef.current === null) return;
    const dx = ev.changedTouches[0].clientX - startXRef.current;
    startXRef.current = null;
    if (dx < -40) setSwiped(true);
    else if (dx > 25) setSwiped(false);
  };

  return (
    <div className="row-swipe-wrap">
      {onDelete && (
        <div className="row-swipe-actions">
          <button
            type="button"
            className="row-delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(expense);
            }}
          >
            删除
          </button>
        </div>
      )}
      <div
        className="expense-row"
        style={{ transform: swiped ? 'translateX(-76px)' : undefined }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (swiped) {
            setSwiped(false);
            return;
          }
          onEdit(expense);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onEdit(expense);
          }
        }}
      >
        <CategoryIcon icon={catIcon} color={catColor} />
        <div className="row-body">
          <div className="row-main">
            <div className="row-t1">{expense.note || catName}</div>
            <div className="row-t2">{subtitleParts.join(' · ')}</div>
          </div>
          <div className="row-amt num">{formatCents(expense.amountCents)}</div>
        </div>
      </div>
    </div>
  );
}
