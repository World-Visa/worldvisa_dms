'use client';

import { useCallback, useMemo } from 'react';
import { Bar, BarChart, Cell, XAxis, YAxis } from 'recharts';
import type { CountryVolume } from '@/types/analytics';
import { ChartConfig, ChartContainer, ChartTooltip, DmsTooltip } from '@/components/ui/primitives/chart';
import { ANALYTICS_TOOLTIPS } from '../constants/analytics-tooltips';
import { createVolumeBasedHasDataChecker } from '@/utils/chart-validation';
import { generateDummyProviderData } from './chart-dummy-data';
import type { CountryChartData } from './chart-types';
import { ChartWrapper } from './chart-wrapper';
import { COUNTRY_IMAGE_URLS } from '@/lib/applications/utils';

const chartConfig = {
  total: { label: 'Applications', color: '#818cf8' },
} satisfies ChartConfig;

type CountryVolumeTooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload?: { country?: string; main?: number; spouse?: number; total?: number; fill?: string; displayName?: string };
  }>;
};

function CountryVolumeTooltip({ active, payload }: CountryVolumeTooltipProps) {
  const data = payload?.[0]?.payload;
  if (!data) return null;
  const rows = [
    { key: 'main', label: 'Main Applications', value: data.main || 0, color: '#818cf8' },
    { key: 'spouse', label: 'Spouse Applications', value: data.spouse || 0, color: '#22d3ee' },
  ];
  return <DmsTooltip active={active} label={data.displayName || data.country} rows={rows} showTotal />;
}

type Country = 'Australia' | 'Canada';

function isKnownCountry(country: string): country is Country {
  return country === 'Australia' || country === 'Canada';
}

type CountryAxisTickProps = { x?: number; y?: number; payload?: { value: string } };

function CustomTick({ x = 0, y = 0, payload }: CountryAxisTickProps) {
  const label = payload?.value;
  if (!label) return null;
  const maxLength = 18;
  const text = label.length > maxLength ? `${label.slice(0, maxLength)}...` : label;
  const imgUrl = isKnownCountry(label) ? COUNTRY_IMAGE_URLS[label] : null;

  return (
    <g transform={`translate(${x},${y})`}>
      {imgUrl ? (
        <foreignObject x={-18} y={-8} width={16} height={16}>
          <img
            src={imgUrl}
            alt={label}
            width={16}
            height={16}
            className="size-4 rounded-full object-cover"
          />
        </foreignObject>
      ) : (
        <circle cx={-10} cy={0} r={6} fill="#e5e7eb" />
      )}
      <text x={2} y={0} dy={4} textAnchor="start" fill="#525866" fontSize={12}>
        {text}
      </text>
    </g>
  );
}

type ProvidersByVolumeProps = {
  data?: CountryVolume[];
  isLoading?: boolean;
  error?: Error | null;
};

export function ProvidersByVolume({ data, isLoading }: ProvidersByVolumeProps) {
  const chartData = useMemo(
    () =>
      data?.map((item) => ({
        country: item.country,
        main: item.main,
        spouse: item.spouse,
        total: item.total,
        displayName: item.country,
        fill: item.fill,
      })),
    [data],
  );

  const hasDataChecker = useCallback(
    createVolumeBasedHasDataChecker<CountryChartData>((p) => (p.total || 0) > 0),
    [],
  );

  const calculateChartHeight = useCallback((d: CountryChartData[]) => {
    return Math.max(d.length * (16 + 10) + 20, 80);
  }, []);

  const renderChart = useCallback(
    (d: CountryChartData[], includeTooltip = true) => {
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
            <XAxis type="number" dataKey="total" hide />
            <YAxis
              dataKey="country"
              type="category"
              tickLine={false}
              tickMargin={168}
              axisLine={false}
              width={190}
              tick={(props) => <CustomTick {...props} />}
              interval={0}
            />
            {includeTooltip && <ChartTooltip cursor={false} content={<CountryVolumeTooltip />} />}
            <Bar dataKey="total" radius={3} barSize={16}>
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
      title="Top applications by country"
      data={chartData}
      isLoading={isLoading}
      hasDataChecker={hasDataChecker}
      dummyDataGenerator={generateDummyProviderData}
      emptyStateRenderer={(d) => renderChart(d, false)}
      infoTooltip={ANALYTICS_TOOLTIPS.PROVIDERS_BY_VOLUME}
      emptyStateTitle="Not enough data to show"
      emptyStateTooltip={ANALYTICS_TOOLTIPS.INSUFFICIENT_ENTRIES}
    >
      {renderChart}
    </ChartWrapper>
  );
}
