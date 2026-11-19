import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryIcon } from '../../components/CategoryIcon';
import { ExpenseGroupList } from '../../components/ExpenseGroupList';
import { deleteExpense } from '../../db/repo/expenses';
import { useApp } from '../../hooks/useAppContext';
import { useCategories, useEffectiveBudgets, useExpenses } from '../../hooks/useData';
import { budgetStatus } from '../../lib/budget';
import { formatCents, formatYuan } from '../../lib/money';
import {
  currentMonthStr,
  getElapsedDaysInRange,
  getMonthRange,
  getTotalDaysInRange,
  shiftMonth,
  todayStr,
} from '../../lib/period';
import { byCategory, sumCents } from '../../lib/stats';

export function HomePage() {
  const navigate = useNavigate();
  const { openEdit, openAdd, showToast } = useApp();

  const curYm = currentMonthStr();
  const [month, setMonth] = useState(curYm);
  const range = useMemo(() => getMonthRange(month), [month]);

  const categories = useCategories(true);
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const expenses = useExpenses(range);
  const budgets = useEffectiveBudgets(month);

  const today = todayStr();
  const totalCents = useMemo(() => sumCents(expenses), [expenses]);
  const todayCents = useMemo(
    () => sumCents(expenses.filter((e) => e.date === today)),
    [expenses, today],
  );

  const totalDays = getTotalDaysInRange(range);
  const elapsedDays = Math.max(1, getElapsedDaysInRange(range, today));
  const dailyAvgCents = Math.round(totalCents / elapsedDays);

  const statuses = useMemo(
    () => budgetStatus(budgets, expenses, categories),
    [budgets, expenses, categories],
  );
  const totalBudget = statuses.find((s) => s.categoryId === null);
  const alertItems = useMemo(
    () => statuses.filter((s) => s.ratio >= 0.8),
    [statuses],
  );

  const topCategories = useMemo(() => byCategory(expenses).slice(0, 3), [expenses]);
  const maxCatCents = topCategories[0]?.totalCents || 1;
  const recentExpenses = useMemo(() => expenses.slice(0, 6), [expenses]);

  const monthNum = Number.parseInt(month.slice(5, 7), 10);
  const yearNum = Number.parseInt(month.slice(0, 4), 10);
  const isCurrentMonth = month === curYm;

  const handleDelete = async (id: string) => {
    await deleteExpense(id);
    showToast('已删除支出记录');
  };

  return (
    <div className="page-scroll">
      <div className="title-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              aria-label="上个月"
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
              style={{ color: 'var(--text-2)', fontSize: 22, padding: '0 6px 0 0' }}
            >
              ‹
            </button>
            <h1 className="page-title">{monthNum}月</h1>
            <button
              type="button"
              aria-label="下个月"
              disabled={isCurrentMonth}
              onClick={() => setMonth((m) => shiftMonth(m, 1))}
              style={{
                color: isCurrentMonth ? 'var(--text-3)' : 'var(--text-2)',
                fontSize: 22,
                padding: '0 6px',
              }}
            >
              ›
            </button>
          </div>
          <div className="page-subtitle">
            {yearNum}年 ·{' '}
            {isCurrentMonth
              ? `第 ${elapsedDays} 天 / ${totalDays} 天`
              : `共 ${expenses.length} 笔`}
          </div>
        </div>

        <button
          type="button"
          className="chip"
          onClick={() => navigate('/budget')}
          style={{ height: 32, padding: '0 12px', fontWeight: 500 }}
        >
          预算设置
        </button>
      </div>

      <div className="card">
        <div className="caption">{isCurrentMonth ? '本月已花' : `${monthNum}月共花`}</div>
        <div className="amount-lg num" data-testid="home-month-total">
          <span className="yen">¥</span>
          {formatCents(totalCents)}
        </div>

        {totalBudget ? (
          <>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(totalBudget.ratio, 1) * 100}%`,
                  backgroundColor: `var(--${totalBudget.level})`,
                }}
              />
            </div>
            <div
              className="caption"
              style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}
            >
              <span>
                预算 ¥{formatCents(totalBudget.limitCents, 0)} · 已用{' '}
                {Math.round(totalBudget.ratio * 100)}%
              </span>
              {isCurrentMonth && (
                <span>时间进度 {Math.round((elapsedDays / totalDays) * 100)}%</span>
              )}
            </div>
            <div className="kpis num">
              <div className="kpi">
                <span className="caption">
                  {totalBudget.remainingCents >= 0 ? '剩余' : '超支'}
                </span>
                <b
                  style={{
                    color: totalBudget.remainingCents < 0 ? 'var(--over)' : undefined,
                  }}
                >
                  ¥{formatCents(Math.abs(totalBudget.remainingCents), 0)}
                </b>
              </div>
              <div className="kpi">
                <span className="caption">日均</span>
                <b>¥{formatCents(dailyAvgCents, 0)}</b>
              </div>
              <div className="kpi">
                <span className="caption">{isCurrentMonth ? '今日' : '笔数'}</span>
                <b>{isCurrentMonth ? `¥${formatCents(todayCents, 0)}` : `${expenses.length} 笔`}</b>
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: 10,
                background: 'var(--card-2)',
              }}
            >
              <span className="caption">尚未设置月度总预算</span>
              <button
                type="button"
                style={{ color: 'var(--brand)', fontSize: 13, fontWeight: 500 }}
                onClick={() => navigate('/budget')}
              >
                去设置 ›
              </button>
            </div>
            <div className="kpis num">
              <div className="kpi">
                <span className="caption">总笔数</span>
                <b>{expenses.length} 笔</b>
              </div>
              <div className="kpi">
                <span className="caption">日均</span>
                <b>¥{formatCents(dailyAvgCents, 0)}</b>
              </div>
              <div className="kpi">
                <span className="caption">{isCurrentMonth ? '今日' : '月均笔'}</span>
                <b>
                  {isCurrentMonth
                    ? `¥${formatCents(todayCents, 0)}`
                    : expenses.length > 0
                      ? `¥${formatCents(Math.round(totalCents / expenses.length), 0)}`
                      : '¥0'}
                </b>
              </div>
            </div>
          </>
        )}
      </div>

      {alertItems.map((a) => (
        <div
          key={a.budgetId}
          className="alert-banner"
          data-testid={`budget-alert-${a.categoryId ?? 'total'}`}
          onClick={() => navigate('/budget')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') navigate('/budget');
          }}
        >
          <span className="status-dot" style={{ backgroundColor: `var(--${a.level})` }} />
          <span>
            {a.ratio > 1 ? (
              <>
                <b>{a.name}</b> 已超出预算 {formatYuan(a.usedCents - a.limitCents)}
              </>
            ) : (
              <>
                <b>{a.name}</b> 已用 {Math.round(a.ratio * 100)}%，还剩{' '}
                {formatYuan(Math.max(0, a.remainingCents))}
              </>
            )}
          </span>
        </div>
      ))}

      <div className="card">
        <div className="card-header">
          <h3>花在哪了</h3>
          <button
            type="button"
            className="more-link"
            onClick={() => navigate(`/stats?month=${month}`)}
          >
            全部 ›
          </button>
        </div>

        {topCategories.length === 0 ? (
          <div className="caption" style={{ padding: '10px 0' }}>
            本月暂无支出，
            <button
              type="button"
              style={{ color: 'var(--brand)' }}
              onClick={() => openAdd()}
            >
              点此记第一笔
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topCategories.map((item) => {
              const cat = catMap.get(item.categoryId);
              const catName = cat?.name ?? '其他';
              const catColor = cat?.color ?? '#8E8E93';
              const catIcon = cat?.icon ?? '📦';
              return (
                <div
                  key={item.categoryId}
                  onClick={() => navigate(`/list?categoryId=${item.categoryId}&month=${month}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      navigate(`/list?categoryId=${item.categoryId}&month=${month}`);
                    }
                  }}
                >
                  <CategoryIcon icon={catIcon} color={catColor} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 15,
                        marginBottom: 6,
                      }}
                    >
                      <span>
                        {catName}{' '}
                        <span className="caption">{Math.round(item.ratio * 100)}%</span>
                      </span>
                      <span className="num">¥{formatCents(item.totalCents)}</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${(item.totalCents / maxCatCents) * 100}%`,
                          backgroundColor: catColor,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card-list">
        <div className="card-header">
          <h3>最近</h3>
          <button
            type="button"
            className="more-link"
            onClick={() => navigate(`/list?month=${month}`)}
          >
            全部 ›
          </button>
        </div>
        <ExpenseGroupList
          expenses={recentExpenses}
          categories={categories}
          onEdit={openEdit}
          onDelete={(exp) => void handleDelete(exp.id)}
          emptyText="本月还没有支出记录"
        />
      </div>
    </div>
  );
}
