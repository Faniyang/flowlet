import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryIcon } from '../../components/CategoryIcon';
import { setBudget } from '../../db/repo/budgets';
import { useApp } from '../../hooks/useAppContext';
import { useCategories, useEffectiveBudgets, useExpenses } from '../../hooks/useData';
import { budgetLevel, type BudgetLevel } from '../../lib/budget';
import { centsToInputStr, formatCents } from '../../lib/money';
import { currentMonthStr, formatMonthLabel, getMonthRange } from '../../lib/period';
import { sumCents } from '../../lib/stats';

interface BudgetRowItemProps {
  testId: string;
  icon: string;
  color: string;
  name: string;
  usedCents: number;
  limitCents: number;
  onSave: (yuanText: string) => Promise<void>;
}

function BudgetRowItem({
  testId,
  icon,
  color,
  name,
  usedCents,
  limitCents,
  onSave,
}: BudgetRowItemProps) {
  const [draft, setDraft] = useState(centsToInputStr(limitCents));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft(centsToInputStr(limitCents));
    setDirty(false);
  }, [limitCents]);

  const ratio = limitCents > 0 ? usedCents / limitCents : 0;
  const level: BudgetLevel = limitCents > 0 ? budgetLevel(ratio) : 'ok';

  const commit = async () => {
    if (!dirty) return;
    await onSave(draft);
    setDirty(false);
  };

  return (
    <div style={{ padding: '12px 16px 12px 0', borderBottom: '0.5px solid var(--sep)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <CategoryIcon icon={icon} color={color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{name}</div>
          <div className="caption num">
            已花 ¥{formatCents(usedCents)}
            {limitCents > 0 ? ` · 占比 ${Math.round(ratio * 100)}%` : ''}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="caption">¥</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            value={draft}
            placeholder="不限"
            data-testid={testId}
            onChange={(e) => {
              setDraft(e.target.value);
              setDirty(true);
            }}
            onBlur={() => void commit()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            style={{
              width: 88,
              height: 34,
              borderRadius: 8,
              border: 0,
              background: 'var(--card-2)',
              padding: '0 8px',
              textAlign: 'right',
              fontSize: 15,
              fontVariantNumeric: 'tabular-nums',
            }}
          />
          {dirty && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                void commit();
              }}
              style={{ color: 'var(--brand)', fontSize: 14, fontWeight: 600 }}
            >
              保存
            </button>
          )}
        </div>
      </div>

      {limitCents > 0 && (
        <div className="progress-track" style={{ marginTop: 8, height: 5 }}>
          <div
            className="progress-fill"
            style={{
              width: `${Math.min(ratio, 1) * 100}%`,
              backgroundColor: `var(--${level})`,
            }}
          />
        </div>
      )}
    </div>
  );
}

export function BudgetPage() {
  const navigate = useNavigate();
  const { showToast } = useApp();

  const curYm = currentMonthStr();
  const categories = useCategories(false);
  const range = useMemo(() => getMonthRange(curYm), [curYm]);
  const monthExpenses = useExpenses(range);
  const effectiveBudgets = useEffectiveBudgets(curYm);

  const spentByCat = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of monthExpenses) {
      map.set(e.categoryId, (map.get(e.categoryId) ?? 0) + e.amountCents);
    }
    return map;
  }, [monthExpenses]);
  const totalSpent = useMemo(() => sumCents(monthExpenses), [monthExpenses]);

  const budgetMap = useMemo(
    () => new Map(effectiveBudgets.map((b) => [b.categoryId ?? '__total__', b.amountCents])),
    [effectiveBudgets],
  );

  const handleSave = async (categoryId: string | null, name: string, yuanText: string) => {
    const val = yuanText.trim() === '' ? 0 : Number.parseFloat(yuanText);
    const cents = Number.isFinite(val) && val > 0 ? Math.round(val * 100) : 0;
    await setBudget('default', categoryId, cents);
    // 清理可能存在的当月同名旧覆盖项，保证所见即所得
    await setBudget(curYm, categoryId, 0);
    showToast(cents > 0 ? `已设置${name}预算 ¥${formatCents(cents, 0)}` : `已清除${name}预算`);
  };

  return (
    <div className="page-scroll">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ color: 'var(--brand)', fontSize: 17, padding: '6px 10px 6px 0' }}
        >
          ‹ 返回
        </button>
      </div>

      <div className="title-row">
        <div>
          <h1 className="page-title">预算设置</h1>
          <div className="page-subtitle">
            {formatMonthLabel(curYm)}进度 · 低于 80% 绿、80–100% 橙、超支红
          </div>
        </div>
      </div>

      <div className="card-list">
        <BudgetRowItem
          testId="budget-input-total"
          icon="💰"
          color="#2B5BEE"
          name="月度总预算"
          usedCents={totalSpent}
          limitCents={budgetMap.get('__total__') ?? 0}
          onSave={(val) => handleSave(null, '月度总', val)}
        />

        {categories.map((cat) => (
          <BudgetRowItem
            key={cat.id}
            testId={`budget-input-${cat.id}`}
            icon={cat.icon}
            color={cat.color}
            name={cat.name}
            usedCents={spentByCat.get(cat.id) ?? 0}
            limitCents={budgetMap.get(cat.id) ?? 0}
            onSave={(val) => handleSave(cat.id, cat.name, val)}
          />
        ))}
      </div>
    </div>
  );
}
