import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ExpenseRow } from '../../components/ExpenseRow';
import { useApp } from '../../hooks/useAppContext';
import { useCategories, useExpenses } from '../../hooks/useData';
import { formatCents } from '../../lib/money';
import {
  currentMonthStr,
  formatMonthLabel,
  getMonthRange,
  getPreviousPeriodRange,
  getYearRange,
  type PeriodMode,
  shiftMonth,
  todayStr,
} from '../../lib/period';
import { byCategory, byTag, comparePeriods, sumCents, topN } from '../../lib/stats';
import { CategoryDonut } from './CategoryDonut';
import { TagRanking } from './TagRanking';
import { TrendChart } from './TrendChart';

export function StatsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { openEdit, resolvedTheme } = useApp();

  const curYm = currentMonthStr();
  const curYear = Number.parseInt(curYm.slice(0, 4), 10);
  const today = todayStr();

  const [mode, setMode] = useState<PeriodMode>('month');
  const [month, setMonth] = useState(searchParams.get('month') || curYm);
  const [year, setYear] = useState(curYear);
  const [customStart, setCustomStart] = useState(`${curYm}-01`);
  const [customEnd, setCustomEnd] = useState(today);

  const range = useMemo(() => {
    if (mode === 'month') return getMonthRange(month);
    if (mode === 'year') return getYearRange(year);
    const start = customStart <= customEnd ? customStart : customEnd;
    const end = customStart <= customEnd ? customEnd : customStart;
    return { start, end };
  }, [customEnd, customStart, mode, month, year]);

  const prevRange = useMemo(
    () => getPreviousPeriodRange(mode, range, today),
    [mode, range, today],
  );

  const categories = useCategories(true);
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const expenses = useExpenses(range);
  const prevExpenses = useExpenses(prevRange);

  const totalCents = useMemo(() => sumCents(expenses), [expenses]);
  const catStats = useMemo(() => byCategory(expenses), [expenses]);
  const tagStats = useMemo(() => byTag(expenses), [expenses]);
  const topExpenses = useMemo(() => topN(expenses, 10), [expenses]);
  const comparison = useMemo(
    () => comparePeriods(expenses, prevExpenses),
    [expenses, prevExpenses],
  );

  const drillList = (extra: Record<string, string>) => {
    const params = new URLSearchParams(extra);
    if (mode === 'month') {
      params.set('month', month);
    } else {
      params.set('start', range.start);
      params.set('end', range.end);
    }
    navigate(`/list?${params.toString()}`);
  };

  const centerLabel =
    mode === 'month' ? '本月支出' : mode === 'year' ? '年度支出' : '区间支出';

  const compareTitle =
    mode === 'month'
      ? today >= range.start && today < range.end
        ? '和上月同期比'
        : '和上月比'
      : mode === 'year'
        ? today >= range.start && today < range.end
          ? '和去年同期比'
          : '和去年比'
        : '和上周期比';

  const topChanges = comparison.byCategory.slice(0, 3);

  return (
    <div className="page-scroll">
      <div className="title-row">
        <h1 className="page-title">统计</h1>
      </div>

      <div className="seg" style={{ marginBottom: 10 }} role="tablist" aria-label="统计周期">
        {(
          [
            ['month', '月'],
            ['year', '年'],
            ['custom', '自定义'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={mode === k ? 'on' : ''}
            onClick={() => setMode(k)}
            role="tab"
            aria-selected={mode === k}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'month' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 10,
            fontSize: 17,
            fontWeight: 600,
          }}
        >
          <button
            type="button"
            className="icon-btn"
            aria-label="上个月"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            style={{ fontSize: 22 }}
          >
            ‹
          </button>
          <span>{formatMonthLabel(month)}</span>
          <button
            type="button"
            className="icon-btn"
            aria-label="下个月"
            disabled={month >= curYm}
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            style={{ fontSize: 22, color: month >= curYm ? 'var(--text-3)' : 'var(--brand)' }}
          >
            ›
          </button>
        </div>
      )}

      {mode === 'year' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 10,
            fontSize: 17,
            fontWeight: 600,
          }}
        >
          <button
            type="button"
            className="icon-btn"
            aria-label="上一年"
            onClick={() => setYear((y) => y - 1)}
            style={{ fontSize: 22 }}
          >
            ‹
          </button>
          <span>{year}年</span>
          <button
            type="button"
            className="icon-btn"
            aria-label="下一年"
            disabled={year >= curYear}
            onClick={() => setYear((y) => y + 1)}
            style={{ fontSize: 22, color: year >= curYear ? 'var(--text-3)' : 'var(--brand)' }}
          >
            ›
          </button>
        </div>
      )}

      {mode === 'custom' && (
        <div
          className="card"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}
        >
          <input
            type="date"
            value={customStart}
            max={today}
            onChange={(e) => e.target.value && setCustomStart(e.target.value)}
            style={{
              flex: 1,
              background: 'var(--card-2)',
              borderRadius: 8,
              border: 0,
              padding: '6px 8px',
              fontSize: 14,
            }}
          />
          <span className="caption">至</span>
          <input
            type="date"
            value={customEnd}
            max={today}
            onChange={(e) => e.target.value && setCustomEnd(e.target.value)}
            style={{
              flex: 1,
              background: 'var(--card-2)',
              borderRadius: 8,
              border: 0,
              padding: '6px 8px',
              fontSize: 14,
            }}
          />
        </div>
      )}

      <div className="caption" style={{ textAlign: 'center', marginBottom: 10 }}>
        {range.start} – {range.end} · 共 {expenses.length} 笔
      </div>

      <CategoryDonut
        stats={catStats}
        totalCents={totalCents}
        centerLabel={centerLabel}
        categories={categories}
        theme={resolvedTheme}
        onDrillCategory={(categoryId) => drillList({ categoryId })}
      />

      <TrendChart
        mode={mode}
        expenses={expenses}
        range={range}
        year={year}
        theme={resolvedTheme}
      />

      <div className="card">
        <div className="card-header">
          <h3>{compareTitle}</h3>
          <span className="caption">
            {prevRange.start} – {prevRange.end}
          </span>
        </div>

        <div
          className="num"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
        >
          <div style={{ background: 'var(--card-2)', borderRadius: 12, padding: '10px 12px' }}>
            <span className="caption">总支出</span>
            <b
              style={{
                display: 'block',
                fontSize: 17,
                marginTop: 2,
                color:
                  comparison.deltaCents > 0
                    ? 'var(--over)'
                    : comparison.deltaCents < 0
                      ? 'var(--ok)'
                      : undefined,
              }}
            >
              {comparison.prevTotalCents === 0 && comparison.currTotalCents === 0
                ? '持平'
                : comparison.deltaRatio === null
                  ? '新增'
                  : `${comparison.deltaCents >= 0 ? '↑' : '↓'} ${Math.abs(Math.round(comparison.deltaRatio * 100))}%`}
            </b>
            <span className="caption">
              {comparison.deltaCents >= 0 ? '+' : '−'}¥
              {formatCents(Math.abs(comparison.deltaCents), 0)}
            </span>
          </div>

          {topChanges.map((item) => {
            const cat = catMap.get(item.categoryId);
            return (
              <div
                key={item.categoryId}
                style={{ background: 'var(--card-2)', borderRadius: 12, padding: '10px 12px' }}
              >
                <span className="caption">
                  {cat?.icon ?? '📦'} {cat?.name ?? '其他'}
                </span>
                <b
                  style={{
                    display: 'block',
                    fontSize: 17,
                    marginTop: 2,
                    color: item.deltaCents > 0 ? 'var(--over)' : 'var(--ok)',
                  }}
                >
                  {item.deltaRatio === null
                    ? '新增'
                    : `${item.deltaCents > 0 ? '↑' : '↓'} ${Math.abs(Math.round(item.deltaRatio * 100))}%`}
                </b>
                <span className="caption">
                  {item.deltaCents >= 0 ? '+' : '−'}¥{formatCents(Math.abs(item.deltaCents), 0)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <TagRanking tags={tagStats} onDrillTag={(tag) => drillList({ tag })} />

      {topExpenses.length > 0 && (
        <div className="card-list">
          <div className="card-header">
            <h3>单笔最大</h3>
            <span className="caption">Top {topExpenses.length}</span>
          </div>
          {topExpenses.map((exp) => (
            <ExpenseRow
              key={exp.id}
              expense={exp}
              category={catMap.get(exp.categoryId)}
              showDate
              onEdit={openEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
