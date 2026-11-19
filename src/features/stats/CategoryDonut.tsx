import { useMemo } from 'react';
import type { EChartsCoreOption } from 'echarts/core';
import { CategoryIcon } from '../../components/CategoryIcon';
import { EChart } from '../../components/charts/EChart';
import type { Category } from '../../db/types';
import { formatCents } from '../../lib/money';
import type { CategoryStat } from '../../lib/stats';

interface CategoryDonutProps {
  stats: CategoryStat[];
  totalCents: number;
  centerLabel: string;
  categories: Category[];
  theme: 'light' | 'dark';
  onDrillCategory: (categoryId: string) => void;
}

export function CategoryDonut({
  stats,
  totalCents,
  centerLabel,
  categories,
  theme,
  onDrillCategory,
}: CategoryDonutProps) {
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const maxCents = stats[0]?.totalCents || 1;

  const option = useMemo<EChartsCoreOption>(() => {
    const borderColor = theme === 'dark' ? '#1C1C1E' : '#FFFFFF';
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { name: string; value: number; percent: number };
          return `${p.name}<br/>¥${p.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} (${p.percent}%)`;
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['58%', '84%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          itemStyle: {
            borderColor,
            borderWidth: stats.length > 1 ? 2 : 0,
            borderRadius: 4,
          },
          data: stats.map((s) => {
            const cat = catMap.get(s.categoryId);
            return {
              name: cat?.name ?? '其他',
              value: Number((s.totalCents / 100).toFixed(2)),
              itemStyle: { color: cat?.color ?? '#8E8E93' },
            };
          }),
        },
      ],
    };
  }, [catMap, stats, theme]);

  if (stats.length === 0) {
    return (
      <div className="card">
        <div className="caption" style={{ textAlign: 'center', padding: '28px 0' }}>
          当前周期暂无支出数据
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ position: 'relative', height: 210, marginBottom: 8 }}>
        <EChart
          option={option}
          height={210}
          theme={theme}
          onItemClick={(p) => {
            if (p.dataIndex !== undefined && stats[p.dataIndex]) {
              onDrillCategory(stats[p.dataIndex].categoryId);
            }
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span className="caption">{centerLabel}</span>
          <b className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>
            ¥{formatCents(totalCents, 0)}
          </b>
        </div>
      </div>

      <div>
        {stats.map((s, idx) => {
          const cat = catMap.get(s.categoryId);
          const name = cat?.name ?? '其他';
          const icon = cat?.icon ?? '📦';
          const color = cat?.color ?? '#8E8E93';
          return (
            <div
              key={s.categoryId}
              className="expense-row"
              data-testid={`stats-cat-${s.categoryId}`}
              onClick={() => onDrillCategory(s.categoryId)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onDrillCategory(s.categoryId);
              }}
            >
              <CategoryIcon icon={icon} color={color} />
              <div
                className="row-body"
                style={{ borderBottom: idx === stats.length - 1 ? 0 : undefined }}
              >
                <div className="row-main">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 16 }}>
                      {name}{' '}
                      <span className="caption" style={{ marginLeft: 2 }}>
                        {s.count}笔
                      </span>
                    </span>
                    <span className="caption num">{(s.ratio * 100).toFixed(1)}%</span>
                  </div>
                  <div className="progress-track" style={{ height: 4, marginTop: 6 }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(s.totalCents / maxCents) * 100}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
                <div className="row-amt num" style={{ minWidth: 74, textAlign: 'right' }}>
                  ¥{formatCents(s.totalCents, 0)}
                </div>
                <span style={{ color: 'var(--text-3)', fontSize: 18 }}>›</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
