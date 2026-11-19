import { useMemo } from 'react';
import type { EChartsCoreOption } from 'echarts/core';
import { EChart } from '../../components/charts/EChart';
import type { DateRange, Expense } from '../../db/types';
import { formatCents } from '../../lib/money';
import { getElapsedDaysInRange, type PeriodMode, todayStr } from '../../lib/period';
import { byDay, byMonth, sumCents } from '../../lib/stats';

interface TrendChartProps {
  mode: PeriodMode;
  expenses: Expense[];
  range: DateRange;
  year: number;
  theme: 'light' | 'dark';
}

export function TrendChart({ mode, expenses, range, year, theme }: TrendChartProps) {
  const totalCents = useMemo(() => sumCents(expenses), [expenses]);

  const { title, avgLabel, avgCents, option } = useMemo(() => {
    const brandColor = theme === 'dark' ? '#5B85FF' : '#2B5BEE';
    const textColor = '#64748B';

    if (mode === 'year') {
      const rows = byMonth(expenses, year);
      const activeMonths = rows.filter((r) => r.totalCents > 0).length || 1;
      const avg = Math.round(totalCents / activeMonths);
      const avgYuan = Number((avg / 100).toFixed(2));

      const opt: EChartsCoreOption = {
        grid: { left: 6, right: 8, top: 24, bottom: 22, containLabel: true },
        tooltip: {
          trigger: 'axis',
          formatter: (params: unknown) => {
            const first = Array.isArray(params) ? params[0] : params;
            const p = first as { name: string; value: number };
            return `${year}年${p.name}<br/>¥${Number(p.value).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
          },
        },
        xAxis: {
          type: 'category',
          data: rows.map((r) => r.label),
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: textColor, fontSize: 11, interval: 1 },
        },
        yAxis: {
          type: 'value',
          splitLine: {
            lineStyle: { color: theme === 'dark' ? '#2C2C2E' : '#E5E5EA', type: 'dashed' },
          },
          axisLabel: {
            color: textColor,
            fontSize: 10,
            formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)),
          },
        },
        series: [
          {
            type: 'bar',
            barMaxWidth: 18,
            itemStyle: { color: brandColor, borderRadius: [4, 4, 0, 0] },
            data: rows.map((r) => Number((r.totalCents / 100).toFixed(2))),
            markLine:
              avg > 0
                ? {
                    symbol: 'none',
                    label: {
                      formatter: `月均 ¥${formatCents(avg, 0)}`,
                      position: 'insideEndTop',
                      color: textColor,
                      fontSize: 10,
                    },
                    lineStyle: { color: textColor, type: 'dashed', width: 1 },
                    data: [{ yAxis: avgYuan }],
                  }
                : undefined,
          },
        ],
      };

      return {
        title: '每月支出',
        avgLabel: `月均 ¥${formatCents(avg, 0)}`,
        avgCents: avg,
        option: opt,
      };
    }

    const rows = byDay(expenses, range);
    const elapsed = Math.max(1, getElapsedDaysInRange(range, todayStr()));
    const avg = Math.round(totalCents / elapsed);
    const avgYuan = Number((avg / 100).toFixed(2));
    const labels = rows.map((r) =>
      mode === 'month' ? String(Number.parseInt(r.date.slice(8, 10), 10)) : r.date.slice(5),
    );

    const opt: EChartsCoreOption = {
      grid: { left: 6, right: 8, top: 24, bottom: 22, containLabel: true },
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const first = Array.isArray(params) ? params[0] : params;
          const p = first as { dataIndex: number; value: number };
          const d = rows[p.dataIndex]?.date ?? '';
          return `${d}<br/>¥${Number(p.value).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
        },
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: textColor,
          fontSize: 10,
          interval: Math.max(0, Math.floor(rows.length / 6) - 1),
        },
      },
      yAxis: {
        type: 'value',
        splitLine: {
          lineStyle: { color: theme === 'dark' ? '#2C2C2E' : '#E5E5EA', type: 'dashed' },
        },
        axisLabel: {
          color: textColor,
          fontSize: 10,
          formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)),
        },
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: 16,
          itemStyle: { color: brandColor, borderRadius: [3, 3, 0, 0] },
          data: rows.map((r) => Number((r.totalCents / 100).toFixed(2))),
          markLine:
            avg > 0
              ? {
                  symbol: 'none',
                  label: {
                    formatter: `日均 ¥${formatCents(avg, 0)}`,
                    position: 'insideEndTop',
                    color: textColor,
                    fontSize: 10,
                  },
                  lineStyle: { color: textColor, type: 'dashed', width: 1 },
                  data: [{ yAxis: avgYuan }],
                }
              : undefined,
        },
      ],
    };

    return {
      title: '每日支出',
      avgLabel: `日均 ¥${formatCents(avg, 0)}`,
      avgCents: avg,
      option: opt,
    };
  }, [expenses, mode, range, theme, totalCents, year]);

  return (
    <div className="card">
      <div className="card-header">
        <h3>{title}</h3>
        {avgCents > 0 && <span className="caption num">{avgLabel}</span>}
      </div>
      {totalCents === 0 ? (
        <div className="caption" style={{ textAlign: 'center', padding: '24px 0' }}>
          暂无支出趋势
        </div>
      ) : (
        <EChart option={option} height={180} theme={theme} />
      )}
    </div>
  );
}
