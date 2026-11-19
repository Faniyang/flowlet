import { CategoryIcon } from '../../components/CategoryIcon';
import type { Category } from '../../db/types';

interface CategoryGridProps {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function CategoryGrid({ categories, selectedId, onSelect }: CategoryGridProps) {
  return (
    <div className="cat-grid" role="radiogroup" aria-label="选择分类">
      {categories.map((cat) => {
        const isSelected = cat.id === selectedId;
        return (
          <button
            key={cat.id}
            type="button"
            className={`cat-btn${isSelected ? ' on' : ''}`}
            data-cat-id={cat.id}
            onClick={() => onSelect(cat.id)}
            aria-checked={isSelected}
            role="radio"
          >
            <CategoryIcon
              icon={cat.icon}
              color={cat.color}
              size={44}
              selected={isSelected}
            />
            <span style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
