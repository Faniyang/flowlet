import type { Category } from '../../db/types';

interface FiltersProps {
  query: string;
  onQueryChange: (q: string) => void;
  categories: Category[];
  selectedCategoryId: string;
  onCategoryChange: (id: string) => void;
  selectedTag: string;
  onClearTag: () => void;
  availableTags: string[];
  onSelectTag: (tag: string) => void;
}

export function Filters({
  query,
  onQueryChange,
  categories,
  selectedCategoryId,
  onCategoryChange,
  selectedTag,
  onClearTag,
  availableTags,
  onSelectTag,
}: FiltersProps) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--card)',
          borderRadius: 12,
          height: 40,
          padding: '0 12px',
          marginBottom: 10,
        }}
      >
        <span style={{ color: 'var(--text-2)', fontSize: 15 }}>🔍</span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="搜索备注或 #标签"
          style={{
            flex: 1,
            border: 0,
            outline: 0,
            background: 'transparent',
            fontSize: 15,
          }}
        />
        {query && (
          <button
            type="button"
            aria-label="清除搜索"
            onClick={() => onQueryChange('')}
            style={{ color: 'var(--text-2)', fontSize: 14, padding: 4 }}
          >
            ✕
          </button>
        )}
      </label>

      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          scrollbarWidth: 'none',
        }}
      >
        <button
          type="button"
          className={`chip${!selectedCategoryId ? ' on' : ''}`}
          onClick={() => onCategoryChange('')}
        >
          全部
        </button>
        {categories.map((cat) => {
          const active = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              className={`chip${active ? ' on' : ''}`}
              onClick={() => onCategoryChange(active ? '' : cat.id)}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {(selectedTag || availableTags.length > 0) && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingTop: 6,
            scrollbarWidth: 'none',
          }}
        >
          {selectedTag ? (
            <button type="button" className="chip on" onClick={onClearTag}>
              #{selectedTag} ✕
            </button>
          ) : (
            availableTags.slice(0, 8).map((tag) => (
              <button
                key={tag}
                type="button"
                className="chip"
                onClick={() => onSelectTag(tag)}
              >
                #{tag}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
