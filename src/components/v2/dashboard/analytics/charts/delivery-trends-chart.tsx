'use client';

import { useCallback, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { DailyDeliveryPoint } from '@/types/analytics';
import { STEP_TYPE_TO_ICON } from '@/components/icons/utils';
import { ChartConfig, ChartContainer, ChartTooltip, DmsTooltip } from '@/components/ui/primitives/chart';
import { ANALYTICS_TOOLTIPS } from '../constants/analytics-tooltips';
import { createDateBasedHasDataChecker } from '@/utils/chart-validation';
import { generateDummyDeliveryData } from './chart-dummy-data';
import type { DeliveryChartData } from './chart-types';
import { ChartWrapper } from './chart-wrapper';
import { StepTypeEnum } from '@/lib/enums';

const SEGMENT_GAP = 2;
const BAR_RADIUS = 2;
/** Keep at least this many px when scaling down inter-segment gaps on thin slices. */
const MIN_SLICE_PX = 0.5;

function getStackSegmentInsets(segmentIndex: number, totalSegments: number, height: number): { top: number; bottom: number } {
  if (totalSegments <= 1 || height <= 0) {
    return { top: 0, bottom: 0 };
  }
  let top = segmentIndex < totalSegments - 1 ? SEGMENT_GAP / 2 : 0;
  let bottom = segmentIndex > 0 ? SEGMENT_GAP / 2 : 0;
  const desired = top + bottom;
  if (desired <= 0) {
    return { top: 0, bottom: 0 };
  }
  const maxTotal = Math.max(0, height - MIN_SLICE_PX);
  if (desired > maxTotal) {
    const scale = maxTotal / desired;
    top *= scale;
    bottom *= scale;
  }
  return { top, bottom };
}

const chartConfig = {
  email: { label: 'Email', color: '#818cf8' },
  chat: { label: 'Chat', color: '#34d399' },
  call: { label: 'Call', color: '#f472b6' },
  inApp: { label: 'In-App', color: '#fb923c' },
} satisfies ChartConfig;

const STEP_TYPE_BY_KEY: Record<keyof typeof chartConfig, StepTypeEnum> = {
  email: StepTypeEnum.EMAIL,
  chat: StepTypeEnum.CHAT,
  call: StepTypeEnum.CALL,
  inApp: StepTypeEnum.IN_APP,
};

const CHANNELS = (Object.keys(chartConfig) as (keyof typeof chartConfig)[]).map((key) => ({
  key,
  label: chartConfig[key].label,
  color: chartConfig[key].color,
  icon: STEP_TYPE_TO_ICON[STEP_TYPE_BY_KEY[key]],
}));

type DeliveryTickProps = {
  x?: number;
  y?: number;
  payload?: { value: string };
  index?: number;
};

function DeliveryTick({ x, y, payload, index }: DeliveryTickProps) {
  const anchor = index === 0 ? 'start' : 'middle';
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor={anchor}
        className="fill-text-soft text-[10px] font-mono opacity-60 transition-opacity duration-200 group-hover/chart:opacity-100"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        {payload?.value}
      </text>
    </g>
  );
}

type DeliveryTooltipProps = {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    value?: number;
    color?: string;
    payload?: Partial<DeliveryChartData>;
  }>;
  label?: string;
};

function DeliveryTooltip(props: DeliveryTooltipProps) {
  const data = props.payload?.[0]?.payload;
  const rows = CHANNELS.map((ch) => ({
    key: ch.key,
    label: ch.label,
    value: Number(data?.[ch.key as keyof DeliveryChartData]) || 0,
    color: ch.color,
    icon: ch.icon,
  }));
  return <DmsTooltip active={props.active} label={props.label} rows={rows} showTotal />;
}

type StackedBarSegmentShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  segmentIndex: number;
  totalSegments: number;
};

function StackedBarSegmentShape({
  x = 0, y = 0, width = 0, height = 0, fill,
  segmentIndex, totalSegments,
}: StackedBarSegmentShapeProps) {
  if (height <= 0) return null;
  const { top, bottom } = getStackSegmentInsets(segmentIndex, totalSegments, height);
  const offsetY = top;
  const segmentHeight = height - top - bottom;
  return (
    <rect
      x={x} y={y + offsetY} width={width}
      height={Math.max(0, segmentHeight)}
      fill={fill} rx={BAR_RADIUS} ry={BAR_RADIUS}
    />
  );
}

function createStackedBarShape(segmentIndex: number, totalSegments: number) {
  return (props: Omit<StackedBarSegmentShapeProps, 'segmentIndex' | 'totalSegments'>) => (
    <StackedBarSegmentShape {...props} segmentIndex={segmentIndex} totalSegments={totalSegments} />
  );
}

type ChartContentProps = { data: DeliveryChartData[]; includeTooltip?: boolean };

function ChartContent({ data, includeTooltip = true }: ChartContentProps) {
  const [hiddenChannels] = useState<Set<string>>(new Set());
  const dataLength = data.length;

  const tickInterval = useMemo(() => {
    if (dataLength <= 4) return 0;
    if (dataLength <= 7) return 1;
    if (dataLength <= 14) return 3;
    if (dataLength <= 21) return 4;
    return Math.floor(dataLength / 5);
  }, [dataLength]);

  const barSize = useMemo(() => {
    if (dataLength <= 7) return 24;
    if (dataLength <= 14) return 16;
    if (dataLength <= 21) return 12;
    return undefined;
  }, [dataLength]);

  const visibleChannels = CHANNELS.filter((ch) => !hiddenChannels.has(ch.key));

  return (
    <div className="relative w-full group/chart flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <ChartContainer config={chartConfig} className="h-full min-h-[100px] w-full aspect-auto">
          <BarChart data={data} margin={{ left: 0, right: 0, top: 0, bottom: 0 }} barSize={barSize} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={<DeliveryTick />} interval={tickInterval} padding={{ left: 2, right: 2 }} />
            <YAxis hide domain={[0, 'auto']} />
            {includeTooltip && <ChartTooltip cursor={{ fill: '#f9fafb' }} content={<DeliveryTooltip />} />}
            {visibleChannels.map((channel, idx) => (
              <Bar
                key={channel.key}
                dataKey={channel.key}
                stackId="a"
                fill={channel.color}
                shape={createStackedBarShape(idx, visibleChannels.length)}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}

type DeliveryTrendsChartProps = {
  data?: DailyDeliveryPoint[];
  isLoading?: boolean;
  error?: Error | null;
};

export function DeliveryTrendsChart({ data, isLoading }: DeliveryTrendsChartProps) {
  const chartData = useMemo(
    () =>
      data?.map((p) => ({
        date: p.date,
        timestamp: p.timestamp,
        email: p.email,
        chat: p.chat,
        call: p.call,
        inApp: p.inApp,
      })),
    [data],
  );

  const hasDataChecker = useCallback(
    createDateBasedHasDataChecker<DeliveryChartData>(
      (p) => (p.email || 0) > 0 || (p.chat || 0) > 0 || (p.call || 0) > 0 || (p.inApp || 0) > 0,
    ),
    [],
  );

  return (
    <ChartWrapper
      title="Delivery trend"
      data={chartData}
      isLoading={isLoading}
      hasDataChecker={hasDataChecker}
      dummyDataGenerator={generateDummyDeliveryData}
      emptyStateRenderer={(d) => <ChartContent data={d} includeTooltip={false} />}
      infoTooltip={ANALYTICS_TOOLTIPS.DELIVERY_TREND}
      emptyStateTitle="Not enough data to show"
      emptyStateTooltip={ANALYTICS_TOOLTIPS.INSUFFICIENT_DATE_RANGE}
    >
      {(d) => <ChartContent data={d} includeTooltip />}
    </ChartWrapper>
  );
}
