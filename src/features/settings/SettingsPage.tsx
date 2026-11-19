import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../hooks/useAppContext';
import {
  useAllExpenses,
  useCategories,
  useEffectiveBudgets,
  useSetting,
} from '../../hooks/useData';
import type { ThemeMode } from '../../hooks/useTheme';
import { exportExpensesCSV } from '../../lib/io/csv';
import { exportBackupJSON } from '../../lib/io/json';
import { formatCents } from '../../lib/money';
import { currentMonthStr, todayStr } from '../../lib/period';
import { byTag } from '../../lib/stats';
import { downloadTextFile, formatBackupAge } from './ImportExport';

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme, showToast } = useApp();

  const curYm = currentMonthStr();
  const categories = useCategories(false);
  const allCategories = useCategories(true);
  const allExpenses = useAllExpenses();
  const budgets = useEffectiveBudgets(curYm);
  const lastBackupAt = useSetting<number | null>('lastBackupAt', null);

  const tagCount = useMemo(() => byTag(allExpenses).length, [allExpenses]);
  const totalBudget = budgets.find((b) => b.categoryId === null);
  const backupInfo = formatBackupAge(lastBackupAt);

  const handleQuickExportCSV = () => {
    const csv = exportExpensesCSV(allExpenses, allCategories);
    downloadTextFile(`flowlet-expenses-${todayStr()}.csv`, csv, 'text/csv;charset=utf-8');
    showToast(`已导出 ${allExpenses.length} 笔支出（CSV）`);
  };

  const handleQuickExportJSON = async () => {
    const json = await exportBackupJSON();
    downloadTextFile(
      `flowlet-backup-${todayStr()}.json`,
      json,
      'application/json;charset=utf-8',
    );
    showToast('已导出完整 JSON 备份');
  };

  return (
    <div className="page-scroll">
      <div className="title-row">
        <h1 className="page-title">我的</h1>
      </div>

      <div className="card-list">
        <div
          className="setting-row"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/settings/categories')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/settings/categories')}
        >
          <div className="row-body">
            <span style={{ fontSize: 17 }}>分类管理</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="caption" style={{ fontSize: 15 }}>
                {categories.length} 个
              </span>
              <span style={{ color: 'var(--text-3)', fontSize: 18 }}>›</span>
            </div>
          </div>
        </div>

        <div
          className="setting-row"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/settings/tags')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/settings/tags')}
        >
          <div className="row-body">
            <span style={{ fontSize: 17 }}>标签管理</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="caption" style={{ fontSize: 15 }}>
                {tagCount} 个
              </span>
              <span style={{ color: 'var(--text-3)', fontSize: 18 }}>›</span>
            </div>
          </div>
        </div>

        <div
          className="setting-row"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/budget')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/budget')}
        >
          <div className="row-body" style={{ borderBottom: 0 }}>
            <span style={{ fontSize: 17 }}>预算设置</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="caption num" style={{ fontSize: 15 }}>
                {totalBudget ? `¥${formatCents(totalBudget.amountCents, 0)} / 月` : '未设置'}
              </span>
              <span style={{ color: 'var(--text-3)', fontSize: 18 }}>›</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card-list">
        <div className="setting-row">
          <div className="row-body" style={{ borderBottom: 0 }}>
            <span style={{ fontSize: 17 }}>外观</span>
            <div className="seg" style={{ width: 180 }}>
              {(
                [
                  ['auto', '自动'],
                  ['light', '浅色'],
                  ['dark', '深色'],
                ] as [ThemeMode, string][]
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  className={theme === mode ? 'on' : ''}
                  onClick={() => setTheme(mode)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="caption" style={{ padding: '4px 16px 6px' }}>
        数据与备份
      </div>
      <div className="card-list">
        <div
          className="setting-row"
          style={{ cursor: 'pointer' }}
          onClick={handleQuickExportCSV}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleQuickExportCSV()}
        >
          <div className="row-body">
            <span style={{ fontSize: 17 }}>导出 CSV</span>
            <span style={{ color: 'var(--text-3)', fontSize: 18 }}>›</span>
          </div>
        </div>

        <div
          className="setting-row"
          style={{ cursor: 'pointer' }}
          onClick={() => void handleQuickExportJSON()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && void handleQuickExportJSON()}
        >
          <div className="row-body">
            <span style={{ fontSize: 17 }}>导出 JSON 备份</span>
            <span style={{ color: 'var(--text-3)', fontSize: 18 }}>›</span>
          </div>
        </div>

        <div
          className="setting-row"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/settings/io')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/settings/io')}
        >
          <div className="row-body" style={{ borderBottom: 0 }}>
            <span style={{ fontSize: 17 }}>导入账单 / 备份</span>
            <span style={{ color: 'var(--text-3)', fontSize: 18 }}>›</span>
          </div>
        </div>
      </div>

      <div className="caption" style={{ padding: '0 16px 12px' }}>
        <span
          style={{
            color: backupInfo.needsReminder ? 'var(--warn)' : 'var(--ok)',
            marginRight: 6,
          }}
        >
          ●
        </span>
        {backupInfo.text}。数据只保存在本机浏览器里，建议定期备份。
      </div>

      <div className="card-list">
        <div className="setting-row">
          <div className="row-body" style={{ borderBottom: 0 }}>
            <span style={{ fontSize: 17 }}>关于 flowlet</span>
            <span className="caption" style={{ fontSize: 14 }}>
              v0.1.0 · 本地离线记账
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
