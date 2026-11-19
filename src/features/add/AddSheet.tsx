import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getEffectiveBudgets } from '../../db/repo/budgets';
import {
  addExpense,
  deleteExpense,
  queryExpenses,
  updateExpense,
} from '../../db/repo/expenses';
import { useApp } from '../../hooks/useAppContext';
import { useAllExpenses, useCategories } from '../../hooks/useData';
import { budgetStatus, crossedThresholds } from '../../lib/budget';
import { centsToInputStr, formatCents, formatYuan, parseAmountExpr } from '../../lib/money';
import { formatDateHeader, getMonthRange, shiftDate, todayStr } from '../../lib/period';
import { byTag } from '../../lib/stats';
import { extractTags, formatNoteWithTags } from '../../lib/tags';
import { CategoryGrid } from './CategoryGrid';
import { Keypad } from './Keypad';

const FALLBACK_TAGS = ['聚餐', '同事', '旅行'];

export function AddSheet() {
  const { sheetState, closeSheet, showToast } = useApp();
  const { open, editing, presetCategoryId, presetDate } = sheetState;

  const allCategories = useCategories(true);
  const allExpenses = useAllExpenses();

  const [expr, setExpr] = useState('');
  const [categoryId, setCategoryId] = useState('food');
  const [noteRaw, setNoteRaw] = useState('');
  const [date, setDate] = useState(todayStr());
  const [shake, setShake] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const noteInputRef = useRef<HTMLInputElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const orderedCategories = useMemo(() => {
    const active = allCategories.filter((c) => !c.archived);
    if (editing) {
      const hasEditCat = active.some((c) => c.id === editing.categoryId);
      const editCat = allCategories.find((c) => c.id === editing.categoryId);
      return !hasEditCat && editCat ? [editCat, ...active] : active;
    }
    return active;
  }, [allCategories, editing]);

  const defaultCategoryId = useMemo(() => {
    const activeIds = new Set(orderedCategories.map((c) => c.id));
    for (const exp of allExpenses) {
      if (activeIds.has(exp.categoryId)) return exp.categoryId;
    }
    return orderedCategories[0]?.id ?? 'food';
  }, [allExpenses, orderedCategories]);

  const suggestedTags = useMemo(() => {
    const existing = byTag(allExpenses).map((t) => t.tag);
    const merged = Array.from(new Set([...existing, ...FALLBACK_TAGS]));
    return merged.slice(0, 4);
  }, [allExpenses]);

  useEffect(() => {
    if (!open) return;
    setConfirmDelete(false);
    setSaving(false);
    if (editing) {
      setExpr(centsToInputStr(editing.amountCents));
      setCategoryId(editing.categoryId);
      setNoteRaw(formatNoteWithTags(editing.note, editing.tags));
      setDate(editing.date);
    } else {
      setExpr('');
      setNoteRaw('');
      setDate(presetDate ?? todayStr());
      setCategoryId(presetCategoryId ?? defaultCategoryId);
    }
    if (
      typeof window !== 'undefined' &&
      window.location.pathname === '/' &&
      !window.history.state?.flowletSheet
    ) {
      window.history.pushState({ ...window.history.state, flowletSheet: true }, '');
    }
    // 只在打开或切换编辑对象时初始化表单
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing?.id, presetCategoryId, presetDate]);

  useEffect(() => {
    if (!open) return;
    const onPopState = () => {
      closeSheet();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [closeSheet, open]);

  const handlePress = useCallback((key: string) => {
    setExpr((prev) => {
      const currentSegment = prev.split(/[+-]/).pop() ?? '';
      if (key === 'del') {
        return prev.slice(0, -1);
      }
      if (key === '+' || key === '-') {
        if (!prev) return prev;
        return prev.replace(/[+-.]$/, '') + key;
      }
      if (key === '.') {
        if (currentSegment.includes('.')) return prev;
        return prev + (currentSegment === '' ? '0.' : '.');
      }
      if (/\.\d{2}$/.test(currentSegment)) return prev;
      if (currentSegment.replace('.', '').length >= 7) return prev;
      const base = currentSegment === '0' ? prev.slice(0, -1) : prev;
      return base + key;
    });
  }, []);

  const parsedCents = useMemo(() => parseAmountExpr(expr), [expr]);
  const hasOperator = useMemo(() => /[+-]/.test(expr.slice(1)), [expr]);
  const parsedNote = useMemo(() => extractTags(noteRaw), [noteRaw]);

  const handleSave = useCallback(
    async (keepOpen: boolean) => {
      if (saving) return;
      const cents = parseAmountExpr(expr);
      if (cents <= 0) {
        setShake(false);
        requestAnimationFrame(() => setShake(true));
        return;
      }

      setSaving(true);
      try {
        const expMonth = date.slice(0, 7);
        const range = getMonthRange(expMonth);
        const [budgets, beforeExpenses] = await Promise.all([
          getEffectiveBudgets(expMonth),
          queryExpenses(range),
        ]);
        const beforeStatus = budgetStatus(budgets, beforeExpenses, allCategories);

        const payload = {
          amountCents: cents,
          categoryId,
          date,
          note: parsedNote.note,
          tags: parsedNote.tags,
        };

        if (editing) {
          await updateExpense(editing.id, payload);
        } else {
          await addExpense(payload);
        }

        const afterExpenses = await queryExpenses(range);
        const afterStatus = budgetStatus(budgets, afterExpenses, allCategories);
        const crossed = crossedThresholds(beforeStatus, afterStatus, categoryId);

        const cat = allCategories.find((c) => c.id === categoryId);
        const title = `${editing ? '已更新' : '已记录'} ${cat?.icon ?? '📦'} ${cat?.name ?? '其他'} ${formatYuan(cents)}`;

        const topAlert = crossed[0];
        const subtitle = topAlert
          ? {
              dotColor: topAlert.item.level === 'over' ? 'var(--over)' : 'var(--warn)',
              text:
                topAlert.item.ratio > 1
                  ? `${topAlert.item.name}已超出预算 ${formatYuan(topAlert.item.usedCents - topAlert.item.limitCents)}`
                  : `${topAlert.item.name}已用 ${Math.round(topAlert.item.ratio * 100)}%，还剩 ${formatYuan(Math.max(0, topAlert.item.remainingCents))}`,
            }
          : undefined;

        showToast(title, subtitle);

        if (keepOpen && !editing) {
          setExpr('');
          setNoteRaw('');
        } else {
          closeSheet();
        }
      } finally {
        setSaving(false);
      }
    },
    [allCategories, categoryId, closeSheet, date, editing, expr, parsedNote, saving, showToast],
  );

  const handleDelete = async () => {
    if (!editing) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteExpense(editing.id);
    showToast('已删除该笔支出');
    closeSheet();
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (document.activeElement === noteInputRef.current) {
        if (ev.key === 'Escape') {
          noteInputRef.current?.blur();
        } else if (ev.key === 'Enter') {
          noteInputRef.current?.blur();
        }
        return;
      }
      if (/^[0-9.+-]$/.test(ev.key)) {
        ev.preventDefault();
        handlePress(ev.key);
      } else if (ev.key === 'Backspace') {
        ev.preventDefault();
        handlePress('del');
      } else if (ev.key === 'Enter') {
        ev.preventDefault();
        void handleSave(false);
      } else if (ev.key === 'Escape') {
        ev.preventDefault();
        closeSheet();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeSheet, handlePress, handleSave, open]);

  if (!open) return null;

  const today = todayStr();
  const yesterday = shiftDate(today, -1);

  const displayExpr = expr
    ? expr.replace(/\+/g, ' + ').replace(/-/g, ' − ')
    : '0';

  return (
    <div
      className="sheet-mask"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSheet();
      }}
    >
      <div className="sheet-panel" role="dialog" aria-modal="true" aria-label={editing ? '编辑支出' : '记一笔'}>
        <div className="grabber" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 42 }}>
          <button
            type="button"
            style={{ color: 'var(--brand)', fontSize: 17, minHeight: 40, paddingRight: 12 }}
            onClick={closeSheet}
          >
            取消
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              className={`chip${date === today ? ' on' : ''}`}
              onClick={() => setDate(date === today ? yesterday : today)}
              title="点击切换今天/昨天"
            >
              {date === today ? '今天' : date === yesterday ? '昨天' : formatDateHeader(date, today)}
            </button>
            <label
              className="chip"
              style={{ cursor: 'pointer', position: 'relative' }}
              aria-label="选择日期"
            >
              <span>📅</span>
              <input
                ref={dateInputRef}
                type="date"
                value={date}
                max={today}
                onChange={(e) => {
                  if (e.target.value) setDate(e.target.value);
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  width: '100%',
                  cursor: 'pointer',
                }}
              />
            </label>
          </div>

          {editing ? (
            <button
              type="button"
              style={{
                color: 'var(--over)',
                fontSize: 15,
                fontWeight: confirmDelete ? 600 : 400,
                minHeight: 40,
                paddingLeft: 12,
              }}
              onClick={() => void handleDelete()}
            >
              {confirmDelete ? '确认删除' : '删除'}
            </button>
          ) : (
            <div style={{ width: 44 }} />
          )}
        </div>

        <div style={{ padding: '6px 4px 0', minHeight: 74, textAlign: 'right' }}>
          <div
            className={`expr-display num${!expr ? ' empty' : ''}${shake ? ' shake' : ''}`}
            data-testid="amount-display"
            onAnimationEnd={() => setShake(false)}
          >
            {displayExpr}
          </div>
          <div className="caption num" style={{ height: 20 }} data-testid="amount-preview">
            {hasOperator ? `= ${formatCents(parsedCents)}` : ''}
          </div>
        </div>

        <CategoryGrid
          categories={orderedCategories}
          selectedId={categoryId}
          onSelect={setCategoryId}
        />

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--card-2)',
            borderRadius: 12,
            height: 44,
            padding: '0 12px',
          }}
        >
          <span style={{ color: 'var(--text-2)' }}>✎</span>
          <input
            ref={noteInputRef}
            type="text"
            value={noteRaw}
            onChange={(e) => setNoteRaw(e.target.value)}
            placeholder="添加备注，输入 #标签"
            autoComplete="off"
            data-testid="note-input"
            style={{
              flex: 1,
              border: 0,
              outline: 0,
              background: 'transparent',
              fontSize: 16,
            }}
          />
          {noteRaw && (
            <button
              type="button"
              aria-label="清空备注"
              onClick={() => setNoteRaw('')}
              style={{ color: 'var(--text-2)', fontSize: 14, padding: '4px 6px' }}
            >
              ✕
            </button>
          )}
        </label>

        <div
          style={{
            display: 'flex',
            gap: 6,
            minHeight: 34,
            alignItems: 'center',
            overflowX: 'auto',
            paddingTop: 6,
            scrollbarWidth: 'none',
          }}
        >
          {parsedNote.tags.length > 0 ? (
            parsedNote.tags.map((t) => (
              <span key={t} className="chip on">
                #{t}
              </span>
            ))
          ) : (
            <>
              <span className="caption">常用：</span>
              {suggestedTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="chip"
                  onClick={() => setNoteRaw((prev) => `${prev.trim()} #${t} `.trimStart())}
                >
                  #{t}
                </button>
              ))}
            </>
          )}
        </div>

        <Keypad
          isEditing={Boolean(editing)}
          onPress={handlePress}
          onSave={(keepOpen) => void handleSave(keepOpen)}
        />
      </div>
    </div>
  );
}
