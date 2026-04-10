'use client';

import { Fragment, useCallback, useId, useMemo } from 'react';
import { Area, AreaChart, XAxis, YAxis } from 'recharts';
import type { DailyInteractionPoint } from '@/api/activity';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/primitives/chart';
import { ANALYTICS_TOOLTIPS } from '../constants/analytics-tooltips';
import { createDateBasedHasDataChecker } from '@/utils/chart-validation';
import { generateDummyInteractionData } from './chart-dummy-data';
import type { InteractionChartData } from './chart-types';
import { ChartWrapper } from './chart-wrapper';

const chartConfig = {
  documentsUploaded: { label: 'Docs Uploaded', color: '#818cf8' },
  documentsReviewed: { label: 'Docs Reviewed', color: '#34d399' },
  commentsAdded: { label: 'Comments', color: '#f472b6' },
  qualityChecks: { label: 'QC Requests', color: '#fbbf24' },
} satisfies ChartConfig;

type SeriesKey = keyof typeof chartConfig;

const SERIES = (Object.keys(chartConfig) as SeriesKey[]).map((key) => ({
  key,
  label: chartConfig[key].label,
  color: chartConfig[key].color,
}));

type InteractionTooltipProps = {
  active?: boolean;
  payload?: Array<{ dataKey?: string; payload?: InteractionChartData }>;
  label?: string;
};

function InteractionTrendTooltip({ active, payload, label }: InteractionTooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  const total = SERIES.reduce((sum, s) => sum + (Number(data[s.key as keyof InteractionChartData]) || 0), 0);

  return (
    <div className="min-w-[220px] overflow-hidden rounded-xl border border-border/40 bg-bg-white text-[12px] shadow-popover">
      <div className="bg-bg-weak px-3 py-2">
        <p className="truncate font-medium tracking-tight text-text-soft">{label}</p>
      </div>
      <div className="border-t border-border/30" />
      <div className="grid gap-x-1 gap-y-1 px-3 py-2" style={{ gridTemplateColumns: '1fr 46px' }}>
        {SERIES.map((s) => (
          <Fragment key={s.key}>
            <div className="flex min-w-0 items-center gap-2">
              <div className="h-2 w-1 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <p className="min-w-0 truncate font-medium text-text-sub">{s.label}</p>
            </div>
            <div className="flex items-center justify-end">
              <span className="font-mono text-[11px] tabular-nums font-medium text-text-strong">
                {(Number(data[s.key as keyof InteractionChartData]) || 0).toLocaleString()}
              </span>
            </div>
          </Fragment>
        ))}
      </div>
      <div className="border-t border-border/30" />
      <div className="grid items-center gap-x-4 bg-bg-weak px-3 py-2" style={{ gridTemplateColumns: '1fr 56px' }}>
        <p className="font-semibold text-text-sub">Total</p>
        <div className="flex justify-end">
          <span className="font-mono text-[11px] tabular-nums font-semibold text-text-strong">
            {total.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

type CustomTickProps = { x?: number; y?: number; payload?: { value: string }; index?: number };

function CustomTick({ x, y, payload, index }: CustomTickProps) {
  const anchor = index === 0 ? 'start' : 'end';
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

type ContentProps = { data: InteractionChartData[]; includeTooltip: boolean };

function InteractionTrendChartContent({ data, includeTooltip }: ContentProps) {
  const baseId = useId();

  const firstDate = data[1]?.date || '';
  const lastDate = data[data.length - 1]?.date || '';

  return (
    <div className="relative w-full -mx-1 group/chart h-[160px]">
      <div className="pointer-events-none absolute left-0 top-0 bottom-6 w-3 bg-linear-to-r from-white via-white/80 to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-6 w-3 bg-linear-to-l from-white via-white/80 to-transparent z-10" />
      <ChartContainer config={chartConfig} className="h-full min-h-[100px] w-full aspect-auto">
        <AreaChart accessibilityLayer data={data} margin={{ top: 8, right: 2, left: 2, bottom: 0 }}>
          <defs>
            {SERIES.map((s) => (
              <linearGradient key={s.key} id={`${baseId}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false} tickLine={false}
            tick={<CustomTick />}
            ticks={[firstDate, lastDate]}
            domain={['dataMin', 'dataMax']}
            padding={{ left: 4, right: 0 }}
          />
          <YAxis hide domain={[0, 'auto']} />
          {includeTooltip && <ChartTooltip cursor={false} content={<InteractionTrendTooltip />} />}
          {SERIES.map((s) => (
            <Area
              key={s.key}
              dataKey={s.key}
              name={s.label}
              type="monotone"
              stackId="interactions"
              stroke={s.color}
              strokeWidth={1.5}
              fill={`url(#${baseId}-${s.key})`}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

type InteractionTrendChartProps = {
  data?: DailyInteractionPoint[];
  isLoading?: boolean;
  error?: Error | null;
};

export function InteractionTrendChart({ data, isLoading, error }: InteractionTrendChartProps) {
  const chartData = useMemo(
    () =>
      data?.map((p) => ({
        date: p.date,
        timestamp: p.timestamp,
        documentsUploaded: p.documentsUploaded,
        documentsReviewed: p.documentsReviewed,
        commentsAdded: p.commentsAdded,
        qualityChecks: p.qualityChecks,
      })),
    [data],
  );

  const hasDataChecker = useCallback(
    createDateBasedHasDataChecker<InteractionChartData>(
      (p) => (p.documentsUploaded || 0) > 0 || (p.documentsReviewed || 0) > 0 ||
              (p.commentsAdded || 0) > 0 || (p.qualityChecks || 0) > 0,
    ),
    [],
  );

  return (
    <ChartWrapper
      title="Application activity trend"
      data={chartData}
      isLoading={isLoading}
      error={error}
      hasDataChecker={hasDataChecker}
      dummyDataGenerator={generateDummyInteractionData}
      emptyStateRenderer={(d) => <InteractionTrendChartContent data={d} includeTooltip={false} />}
      infoTooltip={ANALYTICS_TOOLTIPS.INTERACTION_TREND}
      emptyStateTitle="Not enough data to show"
      emptyStateTooltip={ANALYTICS_TOOLTIPS.INSUFFICIENT_DATE_RANGE}
    >
      {(d) => <InteractionTrendChartContent data={d} includeTooltip />}
    </ChartWrapper>
  );
}
