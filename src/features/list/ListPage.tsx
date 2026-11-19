import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ExpenseGroupList } from '../../components/ExpenseGroupList';
import { deleteExpense } from '../../db/repo/expenses';
import type { DateRange } from '../../db/types';
import { useApp } from '../../hooks/useAppContext';
import { useCategories, useExpenses } from '../../hooks/useData';
import { formatCents } from '../../lib/money';
import {
  currentMonthStr,
  formatMonthLabel,
  getMonthRange,
  shiftMonth,
} from '../../lib/period';
import { byTag, sumCents } from '../../lib/stats';
import { Filters } from './Filters';

export function ListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { openEdit, showToast } = useApp();

  const curYm = currentMonthStr();
  const urlStart = searchParams.get('start') ?? '';
  const urlEnd = searchParams.get('end') ?? '';
  const monthParam = searchParams.get('month') ?? curYm;
  const categoryId = searchParams.get('categoryId') ?? '';
  const tag = searchParams.get('tag') ?? '';
  const q = searchParams.get('q') ?? '';

  const isCustomRange = Boolean(urlStart && urlEnd);
  const isAllTime = !isCustomRange && monthParam === 'all';

  const range: DateRange | undefined = useMemo(() => {
    if (isCustomRange) return { start: urlStart, end: urlEnd };
    if (isAllTime) return undefined;
    return getMonthRange(monthParam);
  }, [isAllTime, isCustomRange, monthParam, urlEnd, urlStart]);

  const allCategories = useCategories(true);
  const activeCategories = useMemo(
    () => allCategories.filter((c) => !c.archived),
    [allCategories],
  );

  // 用于展示当前周期的可用标签
  const periodExpenses = useExpenses(range);
  const availableTags = useMemo(
    () => byTag(periodExpenses).map((t) => t.tag),
    [periodExpenses],
  );

  const filteredExpenses = useExpenses(range, {
    categoryId: categoryId || undefined,
    tag: tag || undefined,
    q: q || undefined,
  });

  const totalCents = useMemo(() => sumCents(filteredExpenses), [filteredExpenses]);

  const updateParam = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    setSearchParams(next, { replace: true });
  };

  const handleDelete = async (id: string) => {
    await deleteExpense(id);
    showToast('已删除支出记录');
  };

  const periodLabel = isCustomRange
    ? `${urlStart} 至 ${urlEnd}`
    : isAllTime
      ? '全部时间'
      : formatMonthLabel(monthParam);

  return (
    <div className="page-scroll">
      <div className="title-row">
        <div>
          <h1 className="page-title">明细</h1>
          <div className="page-subtitle" data-testid="list-summary">
            {periodLabel} · {filteredExpenses.length} 笔 · ¥{formatCents(totalCents)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!isCustomRange && !isAllTime && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button
                type="button"
                className="chip"
                aria-label="上个月"
                onClick={() => updateParam({ month: shiftMonth(monthParam, -1) })}
              >
                ‹
              </button>
              <button
                type="button"
                className="chip"
                aria-label="下个月"
                disabled={monthParam >= curYm}
                onClick={() => updateParam({ month: shiftMonth(monthParam, 1) })}
                style={{ opacity: monthParam >= curYm ? 0.45 : 1 }}
              >
                ›
              </button>
            </div>
          )}
          {isCustomRange ? (
            <button
              type="button"
              className="chip on"
              onClick={() => updateParam({ start: null, end: null, month: curYm })}
            >
              退出区间 ✕
            </button>
          ) : (
            <button
              type="button"
              className={`chip${isAllTime ? ' on' : ''}`}
              onClick={() => updateParam({ month: isAllTime ? curYm : 'all' })}
            >
              全部时间
            </button>
          )}
        </div>
      </div>

      <Filters
        query={q}
        onQueryChange={(nextQ) => updateParam({ q: nextQ })}
        categories={activeCategories}
        selectedCategoryId={categoryId}
        onCategoryChange={(id) => updateParam({ categoryId: id })}
        selectedTag={tag}
        onClearTag={() => updateParam({ tag: null })}
        availableTags={availableTags}
        onSelectTag={(t) => updateParam({ tag: t })}
      />

      <div className="card-list">
        <ExpenseGroupList
          expenses={filteredExpenses}
          categories={allCategories}
          onEdit={openEdit}
          onDelete={(exp) => void handleDelete(exp.id)}
          emptyText="没有符合条件的支出记录"
        />
      </div>
    </div>
  );
}
