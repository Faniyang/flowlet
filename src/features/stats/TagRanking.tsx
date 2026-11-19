import { formatCents } from '../../lib/money';
import type { TagStat } from '../../lib/stats';

interface TagRankingProps {
  tags: TagStat[];
  onDrillTag: (tag: string) => void;
}

export function TagRanking({ tags, onDrillTag }: TagRankingProps) {
  return (
    <div className="card-list">
      <div className="card-header">
        <h3>标签</h3>
        <span className="caption">跨分类统计</span>
      </div>

      {tags.length === 0 ? (
        <div className="caption" style={{ padding: '14px 16px 18px 0' }}>
          记账时在备注输入 #标签，即可跨分类汇总花费
        </div>
      ) : (
        tags.map((item, idx) => (
          <div
            key={item.tag}
            className="expense-row"
            onClick={() => onDrillTag(item.tag)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onDrillTag(item.tag);
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--card-2)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--text-2)',
                fontSize: 15,
                flexShrink: 0,
              }}
            >
              #
            </div>
            <div
              className="row-body"
              style={{ borderBottom: idx === tags.length - 1 ? 0 : undefined }}
            >
              <div className="row-main">
                <div className="row-t1">{item.tag}</div>
                <div className="row-t2">{item.count} 笔</div>
              </div>
              <div className="row-amt num">¥{formatCents(item.totalCents)}</div>
              <span style={{ color: 'var(--text-3)', fontSize: 18 }}>›</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
