'use client';

import { useCallback, useMemo } from 'react';
import { Bar, BarChart, Cell, XAxis, YAxis } from 'recharts';
import type { ApplicationCategoryItem } from '@/types/analytics';
import { ChartConfig, ChartContainer, ChartTooltip, DmsTooltip } from '@/components/ui/primitives/chart';
import { ANALYTICS_TOOLTIPS } from '../constants/analytics-tooltips';
import { createVolumeBasedHasDataChecker } from '@/utils/chart-validation';
import { generateDummyWorkflowData } from './chart-dummy-data';
import type { WorkflowChartData } from './chart-types';
import { ChartWrapper } from './chart-wrapper';

const chartConfig = {
  count: { label: 'Applications', color: '#818cf8' },
} satisfies ChartConfig;

// Plain color dots per category — avoids React hook violations inside SVG tick renderers
const CATEGORY_COLORS: Record<string, string> = {
  'All Lodgements': '#818cf8',
  'Approaching': '#fbbf24',
  'Overdue': '#f87171',
  'Future': '#34d399',
  'No Deadline': '#94a3b8',
};

type CategoryVolumeTooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload?: { workflowName?: string; count?: number; displayName?: string; fill?: string };
  }>;
};

function CategoryVolumeTooltip({ active, payload }: CategoryVolumeTooltipProps) {
  const data = payload?.[0]?.payload;
  if (!data) return null;
  const rows = [{ key: 'count', label: 'Applications', value: data.count || 0, color: data.fill || '#818cf8' }];
  return <DmsTooltip active={active} label={data.displayName || data.workflowName} rows={rows} showTotal={false} />;
}

type CategoryAxisTickProps = { x?: number; y?: number; payload?: { value: string } };

function CustomTick({ x = 0, y = 0, payload }: CategoryAxisTickProps) {
  const label = payload?.value;
  if (!label) return null;
  const maxLength = 20;
  const text = label.length > maxLength ? `${label.slice(0, maxLength)}...` : label;
  const dotColor = CATEGORY_COLORS[label] ?? '#525866';

  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx={-10} cy={0} r={4} fill={dotColor} />
      <text x={-2} y={0} dy={4} textAnchor="start" fill="#525866" fontSize={12}>
        {text}
      </text>
    </g>
  );
}

type ApplicationsByCategoryProps = {
  data?: ApplicationCategoryItem[];
  isLoading?: boolean;
  error?: Error | null;
};

export function ApplicationsByCategory({ data, isLoading }: ApplicationsByCategoryProps) {
  const chartData = useMemo(
    () =>
      data?.map((item) => ({
        workflowName: item.label,
        count: item.count,
        displayName: item.label,
        fill: item.fill,
      })),
    [data],
  );

  const hasDataChecker = useCallback(
    createVolumeBasedHasDataChecker<WorkflowChartData>((p) => (p.count || 0) > 0),
    [],
  );

  const barSize = 12;

  const calculateChartHeight = useCallback((d: WorkflowChartData[]) => {
    return Math.max(d.length * (barSize + 10) + 20, 80);
  }, []);

  const renderChart = useCallback(
    (d: WorkflowChartData[], includeTooltip = true) => {
      const chartHeight = calculateChartHeight(d);
      return (
        <ChartContainer config={chartConfig} className="w-full" style={{ height: `${chartHeight}px` }}>
          <BarChart
            accessibilityLayer
            data={d}
            layout="vertical"
            height={chartHeight}
            margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
          >
            <XAxis type="number" dataKey="count" hide />
            <YAxis
              dataKey="displayName"
              type="category"
              tickLine={false}
              tickMargin={168}
              axisLine={false}
              width={190}
              tick={(props) => <CustomTick {...props} />}
              interval={0}
            />
            {includeTooltip && <ChartTooltip cursor={false} content={<CategoryVolumeTooltip />} />}
            <Bar dataKey="count" radius={3} barSize={barSize}>
              {d.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      );
    },
    [calculateChartHeight],
  );

  return (
    <ChartWrapper
      title="Top applications by category"
      data={chartData}
      isLoading={isLoading}
      hasDataChecker={hasDataChecker}
      dummyDataGenerator={generateDummyWorkflowData}
      emptyStateRenderer={(d) => renderChart(d, false)}
      infoTooltip={ANALYTICS_TOOLTIPS.TOP_WORKFLOWS_BY_VOLUME}
      emptyStateTitle="Not enough data to show"
      emptyStateTooltip={ANALYTICS_TOOLTIPS.INSUFFICIENT_ENTRIES}
    >
      {renderChart}
    </ChartWrapper>
  );
}

// Keep named export for backward compat with charts-section.tsx
export { ApplicationsByCategory as WorkflowsByVolume };
