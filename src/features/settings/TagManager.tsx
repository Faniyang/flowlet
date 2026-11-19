import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteTag, renameTag } from '../../db/repo/expenses';
import { useApp } from '../../hooks/useAppContext';
import { useAllExpenses } from '../../hooks/useData';
import { formatCents } from '../../lib/money';
import { byTag } from '../../lib/stats';

export function TagManager() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const allExpenses = useAllExpenses();
  const tags = useMemo(() => byTag(allExpenses), [allExpenses]);

  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [confirmDelTag, setConfirmDelTag] = useState<string | null>(null);

  const startRename = (tag: string) => {
    setEditingTag(tag);
    setNewName(tag);
    setConfirmDelTag(null);
  };

  const commitRename = async (from: string) => {
    const clean = newName.replace(/^#+/, '').trim();
    if (!clean || clean === from) {
      setEditingTag(null);
      return;
    }
    const exists = tags.some((t) => t.tag === clean);
    const count = await renameTag(from, clean);
    setEditingTag(null);
    showToast(
      exists ? `已将 #${from} 合并到 #${clean}` : `已重命名为 #${clean}`,
      { text: `共更新 ${count} 笔支出` },
    );
  };

  const handleDelete = async (tag: string) => {
    if (confirmDelTag !== tag) {
      setConfirmDelTag(tag);
      return;
    }
    const count = await deleteTag(tag);
    setConfirmDelTag(null);
    showToast(`已移除标签 #${tag}`, { text: `从 ${count} 笔支出中移除` });
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
          <h1 className="page-title">标签管理</h1>
          <div className="page-subtitle">重命名为已有标签时会自动合并</div>
        </div>
      </div>

      <div className="card-list">
        {tags.length === 0 ? (
          <div className="caption" style={{ padding: '24px 16px 24px 0', textAlign: 'center' }}>
            还没有任何标签。记账时在备注输入 #聚餐 即可创建
          </div>
        ) : (
          tags.map((item) => (
            <div key={item.tag} className="setting-row" style={{ gap: 12 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: 'var(--card-2)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--text-2)',
                  flexShrink: 0,
                }}
              >
                #
              </div>
              <div className="row-body">
                {editingTag === item.tag ? (
                  <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 8 }}>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      autoFocus
                      style={{
                        flex: 1,
                        height: 34,
                        borderRadius: 8,
                        border: 0,
                        background: 'var(--card-2)',
                        padding: '0 10px',
                        fontSize: 15,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => void commitRename(item.tag)}
                      style={{ color: 'var(--brand)', fontSize: 14, fontWeight: 600 }}
                    >
                      确定
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTag(null)}
                      style={{ color: 'var(--text-2)', fontSize: 14 }}
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 500 }}>{item.tag}</div>
                      <div className="caption num">
                        {item.count} 笔 · ¥{formatCents(item.totalCents)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => startRename(item.tag)}
                        style={{ color: 'var(--brand)', fontSize: 14 }}
                      >
                        重命名
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(item.tag)}
                        style={{
                          color: confirmDelTag === item.tag ? 'var(--over)' : 'var(--text-2)',
                          fontSize: 14,
                          fontWeight: confirmDelTag === item.tag ? 600 : 400,
                        }}
                      >
                        {confirmDelTag === item.tag ? '确认删除' : '删除'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
