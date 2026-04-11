'use client';

import { ArrowRight } from 'lucide-react';
import { useCallback, useId, useMemo } from 'react';
import { Area, ComposedChart, XAxis, YAxis } from 'recharts';
import Link from 'next/link';
import type { DailyLodgementPoint } from '@/types/analytics';
import { ChartConfig, ChartContainer, ChartTooltip, DmsTooltip } from '@/components/ui/primitives/chart';
import { ANALYTICS_TOOLTIPS } from '../constants/analytics-tooltips';
import { createDateBasedHasDataChecker } from '@/utils/chart-validation';
import { generateDummyWorkflowRunsData } from './chart-dummy-data';
import type { LodgementChartData } from './chart-types';
import { ChartWrapper } from './chart-wrapper';
import { FlickeringGrid } from './flickering-grid';
import { ROUTES } from '@/utils/routes';

const CHART_HEIGHT = 180;

const chartConfig = {
  lodgements: { label: 'Lodgements', color: '#34d399' },
  reviews: { label: 'Reviews', color: '#818cf8' },
} satisfies ChartConfig;

type LodgementChartDataWithTotal = LodgementChartData & { total: number };

function ApplicationsLink() {
  return (
    <Link
      href={ROUTES.VISA_APPLICATIONS}
      className="flex items-center gap-1.5 py-2 px-3 -mx-3 -mb-3 mt-2 rounded-b-lg bg-linear-to-r from-neutral-alpha-50 via-neutral-alpha-25 to-transparent text-[12px] text-text-sub hover:text-text-strong transition-colors cursor-pointer"
    >
      <span className="text-text-sub font-medium">Track all applications</span>
      <span className="font-medium text-text-sub inline-flex items-center gap-1">
        Visa Applications
        <ArrowRight className="size-3.5 shrink-0" />
      </span>
    </Link>
  );
}

type CustomTickProps = { x?: number; y?: number; payload?: { value: string }; index?: number };

function CustomTick({ x, y, payload, index }: CustomTickProps) {
  const anchor = index === 0 ? 'start' : 'middle';
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0} y={0} dy={12} textAnchor={anchor}
        className="fill-text-soft text-[10px] font-mono opacity-60 transition-opacity duration-200 group-hover/chart:opacity-100"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        {payload?.value}
      </text>
    </g>
  );
}

type ChartContentParams = {
  data: LodgementChartDataWithTotal[];
  includeTooltip: boolean;
  baseId: string;
};

function renderLodgementChartContent({ data, includeTooltip, baseId }: ChartContentParams) {
  return (
    <div className="relative w-full -mx-1 group/chart h-full flex flex-col">
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-0" style={{ height: CHART_HEIGHT }}>
        <FlickeringGrid
          squareSize={2}
          gridGap={1}
          maxOpacity={0.1}
          color="#34d399"
          areaClip={{ data, margin: { left: 2, right: 2, top: 4, bottom: 0 } }}
        />
      </div>
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-1 bg-linear-to-b from-transparent to-white"
        style={{ height: CHART_HEIGHT }}
        aria-hidden
      />
      <div className="pointer-events-none absolute left-0 top-0 bottom-6 w-6 bg-linear-to-r from-white to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-6 w-6 bg-linear-to-l from-white to-transparent z-10" />
      <ChartContainer config={chartConfig} className="relative z-10 w-full" style={{ height: CHART_HEIGHT }}>
        <ComposedChart accessibilityLayer data={data} margin={{ left: 2, right: 2, top: 4, bottom: 0 }}>
          <defs>
            <linearGradient id={`${baseId}-lodgements`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.22} />
              <stop offset="20%" stopColor="#34d399" stopOpacity={0.04} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`${baseId}-reviews`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity={0.12} />
              <stop offset="40%" stopColor="#818cf8" stopOpacity={0.04} />
              <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false} tickLine={false}
            tick={<CustomTick />}
            interval={Math.max(0, Math.floor(data.length / 3) - 1)}
            padding={{ left: 8, right: 8 }}
          />
          <YAxis hide domain={[0, 'auto']} />
          {includeTooltip && <ChartTooltip cursor={false} content={<DmsTooltip showTotal />} />}
          <Area
            dataKey="lodgements"
            name="Lodgements"
            stroke="#34d399"
            strokeWidth={2}
            fill={`url(#${baseId}-lodgements)`}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 2, stroke: '#fff', fill: '#34d399' }}
            type="monotone"
            strokeLinecap="round"
            strokeLinejoin="round"
            isAnimationActive={false}
          />
          <Area
            dataKey="reviews"
            name="Reviews"
            stroke="#818cf8"
            strokeWidth={2}
            fill={`url(#${baseId}-reviews)`}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 2, stroke: '#fff', fill: '#818cf8' }}
            type="monotone"
            strokeLinecap="round"
            strokeLinejoin="round"
            isAnimationActive={false}
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}

type WorkflowRunsTrendChartProps = {
  data?: DailyLodgementPoint[];
  count?: number;
  periodLabel?: string;
  isLoading?: boolean;
  error?: Error | null;
};

export function WorkflowRunsTrendChart({ data, count, periodLabel, isLoading, error }: WorkflowRunsTrendChartProps) {
  const baseId = useId();

  const chartData = useMemo(
    () =>
      data?.map((p) => ({
        date: p.date,
        timestamp: p.timestamp,
        lodgements: p.lodgements,
        reviews: p.reviews,
        total: p.lodgements + p.reviews,
      })),
    [data],
  );

  const hasDataChecker = useCallback(
    createDateBasedHasDataChecker<LodgementChartDataWithTotal>(
      (p) => (p.lodgements || 0) > 0 || (p.reviews || 0) > 0,
    ),
    [],
  );

  const renderChart = useCallback(
    (d: LodgementChartDataWithTotal[], includeTooltip = true) =>
      renderLodgementChartContent({ data: d, includeTooltip, baseId }),
    [baseId],
  );

  const dummyDataGenerator = useCallback(
    () =>
      generateDummyWorkflowRunsData().map((p) => ({
        ...p,
        total: p.lodgements + p.reviews,
      })),
    [],
  );

  return (
    <ChartWrapper<LodgementChartDataWithTotal>
      title="Application lodgements"
      data={chartData}
      isLoading={isLoading}
      error={error}
      hasDataChecker={hasDataChecker}
      dummyDataGenerator={dummyDataGenerator}
      emptyStateRenderer={(d) => renderChart(d, false)}
      infoTooltip={ANALYTICS_TOOLTIPS.WORKFLOW_RUNS_TREND}
      emptyStateTitle="Not enough data to show"
      emptyStateTooltip={ANALYTICS_TOOLTIPS.INSUFFICIENT_DATE_RANGE}
      count={count}
      periodLabel={periodLabel}
      footer={<ApplicationsLink />}
    >
      {renderChart}
    </ChartWrapper>
  );
}
