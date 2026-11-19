import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryIcon } from '../../components/CategoryIcon';
import {
  addCategory,
  archiveCategory,
  reorderCategories,
  updateCategory,
} from '../../db/repo/categories';
import { CATEGORY_COLOR_PALETTE, CATEGORY_EMOJI_PRESETS } from '../../db/seed';
import type { Category } from '../../db/types';
import { useApp } from '../../hooks/useAppContext';
import { useCategories } from '../../hooks/useData';

export function CategoryEditor() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const allCategories = useCategories(true);

  const active = allCategories.filter((c) => !c.archived);
  const archived = allCategories.filter((c) => c.archived);

  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🍜');
  const [color, setColor] = useState(CATEGORY_COLOR_PALETTE[0]);

  const startCreate = () => {
    setEditingCat(null);
    setName('');
    setIcon('☕');
    setColor(CATEGORY_COLOR_PALETTE[active.length % CATEGORY_COLOR_PALETTE.length]);
    setShowForm(true);
  };

  const startEdit = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      showToast('请输入分类名称');
      return;
    }
    if (editingCat) {
      await updateCategory(editingCat.id, { name: cleanName, icon: icon || '📦', color });
      showToast(`已更新「${cleanName}」`);
    } else {
      await addCategory({ name: cleanName, icon: icon || '📦', color });
      showToast(`已新增分类「${cleanName}」`);
    }
    setShowForm(false);
  };

  const move = async (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= active.length) return;
    const ids = active.map((c) => c.id);
    const [removed] = ids.splice(idx, 1);
    ids.splice(target, 0, removed);
    await reorderCategories(ids);
  };

  const handleArchive = async (cat: Category) => {
    if (active.length <= 1) {
      showToast('至少保留一个可用分类');
      return;
    }
    await archiveCategory(cat.id, true);
    showToast(`已归档「${cat.name}」`, { text: '历史支出分类不受影响' });
  };

  return (
    <div className="page-scroll">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ color: 'var(--brand)', fontSize: 17, padding: '6px 10px 6px 0' }}
        >
          ‹ 返回
        </button>
        <button
          type="button"
          onClick={startCreate}
          style={{ color: 'var(--brand)', fontSize: 16, fontWeight: 600 }}
        >
          + 新增分类
        </button>
      </div>

      <div className="title-row">
        <div>
          <h1 className="page-title">分类管理</h1>
          <div className="page-subtitle">调整顺序、改名换图标，删除采用归档以保护历史账目</div>
        </div>
      </div>

      {showForm && (
        <form className="card" onSubmit={(e) => void handleSubmit(e)}>
          <div className="card-header">
            <h3>{editingCat ? '编辑分类' : '新增分类'}</h3>
            <button
              type="button"
              className="caption"
              onClick={() => setShowForm(false)}
            >
              取消
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <CategoryIcon icon={icon || '📦'} color={color} size={46} />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="分类名称（如 宠物、咖啡）"
              maxLength={12}
              style={{
                flex: 1,
                height: 42,
                borderRadius: 10,
                border: 0,
                background: 'var(--card-2)',
                padding: '0 12px',
                fontSize: 16,
              }}
            />
          </div>

          <div className="caption" style={{ marginBottom: 6 }}>
            选择图标
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: 6,
              marginBottom: 12,
            }}
          >
            {CATEGORY_EMOJI_PRESETS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setIcon(em)}
                style={{
                  height: 36,
                  borderRadius: 8,
                  fontSize: 20,
                  background: icon === em ? 'var(--brand)' : 'var(--card-2)',
                }}
              >
                {em}
              </button>
            ))}
          </div>

          <div className="caption" style={{ marginBottom: 6 }}>
            选择颜色
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {CATEGORY_COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => setColor(c)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: c,
                  boxShadow: color === c ? '0 0 0 2px var(--card), 0 0 0 4px var(--text)' : undefined,
                }}
              />
            ))}
          </div>

          <button type="submit" className="primary-btn">
            {editingCat ? '保存修改' : '添加分类'}
          </button>
        </form>
      )}

      <div className="card-list">
        <div className="card-header">
          <h3>使用中（{active.length}）</h3>
        </div>
        {active.map((cat, idx) => (
          <div key={cat.id} className="setting-row" style={{ gap: 12 }}>
            <CategoryIcon icon={cat.icon} color={cat.color} />
            <div className="row-body">
              <span style={{ fontSize: 16, fontWeight: 500 }}>{cat.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => void move(idx, -1)}
                  style={{ color: idx === 0 ? 'var(--text-3)' : 'var(--text-2)', padding: '4px 6px' }}
                  aria-label="上移"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={idx === active.length - 1}
                  onClick={() => void move(idx, 1)}
                  style={{
                    color: idx === active.length - 1 ? 'var(--text-3)' : 'var(--text-2)',
                    padding: '4px 6px',
                  }}
                  aria-label="下移"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(cat)}
                  style={{ color: 'var(--brand)', fontSize: 14, padding: '4px 6px' }}
                >
                  编辑
                </button>
                <button
                  type="button"
                  onClick={() => void handleArchive(cat)}
                  style={{ color: 'var(--text-2)', fontSize: 14, padding: '4px 2px' }}
                >
                  归档
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {archived.length > 0 && (
        <div className="card-list">
          <div className="card-header">
            <h3>已归档（{archived.length}）</h3>
          </div>
          {archived.map((cat) => (
            <div key={cat.id} className="setting-row" style={{ gap: 12, opacity: 0.72 }}>
              <CategoryIcon icon={cat.icon} color={cat.color} />
              <div className="row-body">
                <span style={{ fontSize: 16 }}>{cat.name}</span>
                <button
                  type="button"
                  onClick={() => void archiveCategory(cat.id, false)}
                  style={{ color: 'var(--brand)', fontSize: 14 }}
                >
                  恢复
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
