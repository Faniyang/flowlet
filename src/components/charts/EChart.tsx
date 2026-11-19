import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import type { EChartsCoreOption } from 'echarts/core';
import { PieChart, BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  PieChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

interface EChartProps {
  option: EChartsCoreOption;
  height: number;
  theme?: 'light' | 'dark';
  onItemClick?: (params: { name?: string; dataIndex?: number }) => void;
}

export function EChart({ option, height, theme = 'light', onItemClick }: EChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const clickHandlerRef = useRef(onItemClick);
  clickHandlerRef.current = onItemClick;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const instance = echarts.init(el, theme === 'dark' ? 'dark' : undefined, {
      renderer: 'canvas',
    });
    chartRef.current = instance;

    instance.on('click', (params) => {
      clickHandlerRef.current?.({
        name: typeof params.name === 'string' ? params.name : undefined,
        dataIndex: typeof params.dataIndex === 'number' ? params.dataIndex : undefined,
      });
    });

    const ro = new ResizeObserver(() => {
      instance.resize();
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      instance.dispose();
      chartRef.current = null;
    };
  }, [theme]);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.setOption(
      {
        backgroundColor: 'transparent',
        ...option,
      },
      { notMerge: true },
    );
  }, [option, theme]);

  return <div ref={containerRef} style={{ width: '100%', height }} />;
}
