import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../hooks/useAppContext';
import { useAllExpenses, useCategories, useSetting } from '../../hooks/useData';
import {
  commitImportCSV,
  exportExpensesCSV,
  previewImportCSV,
  type CSVImportPreview,
} from '../../lib/io/csv';
import { exportBackupJSON, importBackupJSON, parseBackupJSON } from '../../lib/io/json';
import { todayStr } from '../../lib/period';

export function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatBackupAge(lastBackupAt: number | null): { text: string; needsReminder: boolean } {
  if (!lastBackupAt) {
    return { text: '尚未进行过完整备份', needsReminder: true };
  }
  const days = Math.floor((Date.now() - lastBackupAt) / (1000 * 60 * 60 * 24));
  if (days <= 0) return { text: '上次备份：今天', needsReminder: false };
  return {
    text: `上次备份：${days} 天前`,
    needsReminder: days > 30,
  };
}

export function ImportExport() {
  const navigate = useNavigate();
  const { showToast } = useApp();

  const allExpenses = useAllExpenses();
  const allCategories = useCategories(true);
  const lastBackupAt = useSetting<number | null>('lastBackupAt', null);
  const backupInfo = formatBackupAge(lastBackupAt);

  const [csvPreview, setCsvPreview] = useState<CSVImportPreview | null>(null);
  const [jsonCandidate, setJsonCandidate] = useState<{
    text: string;
    expenses: number;
    categories: number;
    budgets: number;
  } | null>(null);

  const handleExportCSV = () => {
    const csv = exportExpensesCSV(allExpenses, allCategories);
    downloadTextFile(`flowlet-expenses-${todayStr()}.csv`, csv, 'text/csv;charset=utf-8');
    showToast(`已导出 ${allExpenses.length} 笔支出（CSV）`);
  };

  const handleExportJSON = async () => {
    const json = await exportBackupJSON();
    downloadTextFile(
      `flowlet-backup-${todayStr()}.json`,
      json,
      'application/json;charset=utf-8',
    );
    showToast('已导出完整 JSON 备份');
  };

  const handleCSVFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    const preview = previewImportCSV(text, allExpenses, allCategories);
    setCsvPreview(preview);
    setJsonCandidate(null);
  };

  const handleCommitCSV = async () => {
    if (!csvPreview) return;
    const count = await commitImportCSV(csvPreview);
    setCsvPreview(null);
    showToast(`成功导入 ${count} 笔支出`);
  };

  const handleJSONFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const payload = parseBackupJSON(text);
      setJsonCandidate({
        text,
        expenses: payload.expenses.length,
        categories: payload.categories.length,
        budgets: payload.budgets.length,
      });
      setCsvPreview(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '备份文件解析失败');
    }
  };

  const handleCommitJSON = async (mode: 'merge' | 'overwrite') => {
    if (!jsonCandidate) return;
    const res = await importBackupJSON(jsonCandidate.text, mode);
    setJsonCandidate(null);
    showToast(
      mode === 'overwrite' ? '已从备份覆盖恢复' : '已合并备份数据',
      { text: `支出 ${res.expenses} 笔 · 分类 ${res.categories} 个 · 预算 ${res.budgets} 项` },
    );
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
          <h1 className="page-title">导入与导出</h1>
          <div className="page-subtitle">只支持 flowlet 自己导出的 CSV / JSON 文件</div>
        </div>
      </div>

      <div className="alert-banner">
        <span
          className="status-dot"
          style={{ backgroundColor: backupInfo.needsReminder ? 'var(--warn)' : 'var(--ok)' }}
        />
        <span style={{ fontSize: 14 }}>
          {backupInfo.text}。数据只存在本机浏览器里，清除浏览器数据会丢失账本。
        </span>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>导出数据</h3>
          <span className="caption">当前共 {allExpenses.length} 笔</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button type="button" className="secondary-btn" onClick={handleExportCSV}>
            导出 CSV
          </button>
          <button type="button" className="primary-btn" style={{ height: 44 }} onClick={() => void handleExportJSON()}>
            导出 JSON 备份
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>导入 CSV 账单</h3>
          <span className="caption">列：日期,金额,分类,标签,备注</span>
        </div>
        <label className="secondary-btn" style={{ cursor: 'pointer' }}>
          选择 CSV 文件
          <input
            type="file"
            accept=".csv,text/csv"
            data-testid="input-import-csv"
            onChange={(e) => void handleCSVFile(e)}
            style={{ display: 'none' }}
          />
        </label>

        {csvPreview && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              background: 'var(--card-2)',
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            <div>
              可导入 <b>{csvPreview.toAdd.length}</b> 笔 · 重复跳过{' '}
              <b>{csvPreview.duplicateCount}</b> 笔
            </div>
            {csvPreview.newCategoryNames.length > 0 && (
              <div className="caption">
                将自动创建分类：{csvPreview.newCategoryNames.join('、')}
              </div>
            )}
            {csvPreview.errors.length > 0 && (
              <div style={{ color: 'var(--over)', fontSize: 13, marginTop: 4 }}>
                {csvPreview.errors.slice(0, 3).join('；')}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                type="button"
                className="secondary-btn"
                style={{ background: 'var(--card)' }}
                onClick={() => setCsvPreview(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="primary-btn"
                style={{ height: 44 }}
                disabled={csvPreview.toAdd.length === 0}
                data-testid="confirm-import-csv"
                onClick={() => void handleCommitCSV()}
              >
                确认导入 ({csvPreview.toAdd.length})
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3>从 JSON 备份恢复</h3>
          <span className="caption">含分类、预算与标签</span>
        </div>
        <label className="secondary-btn" style={{ cursor: 'pointer' }}>
          选择 JSON 备份文件
          <input
            type="file"
            accept=".json,application/json"
            data-testid="input-import-json"
            onChange={(e) => void handleJSONFile(e)}
            style={{ display: 'none' }}
          />
        </label>

        {jsonCandidate && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              background: 'var(--card-2)',
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            <div>
              检测到备份：支出 <b>{jsonCandidate.expenses}</b> 笔、分类{' '}
              <b>{jsonCandidate.categories}</b> 个、预算 <b>{jsonCandidate.budgets}</b> 项
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                type="button"
                className="secondary-btn"
                style={{ background: 'var(--card)' }}
                onClick={() => void handleCommitJSON('merge')}
              >
                合并导入
              </button>
              <button
                type="button"
                className="primary-btn"
                style={{ height: 44, background: 'var(--over)' }}
                onClick={() => void handleCommitJSON('overwrite')}
              >
                覆盖恢复
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
