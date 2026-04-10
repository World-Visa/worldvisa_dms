import { useMemo } from 'react';
import type { AnalyticsDashboardData, PeriodMetric } from '@/types/analytics';
import { getCompactFormat } from '@/utils/number-formatting';

export type MetricData = {
  value: string;
  description: string;
  percentageChange: number;
  trendDirection: 'up' | 'down' | 'neutral';
};

function formatDecimal(value: number): string {
  const isWhole = Number.isInteger(value) || Math.abs(value - Math.round(value)) < 1e-9;
  return isWhole ? String(Math.round(value)) : value.toFixed(1);
}

function formatNumber(num: number): string {
  const { value, suffix } = getCompactFormat(num);
  if (suffix) {
    return `${formatDecimal(value)}${suffix}`;
  }
  return num.toLocaleString();
}

function processMetric(metric: PeriodMetric | undefined): MetricData {
  if (!metric) {
    return { value: '0', description: 'No data available', percentageChange: 0, trendDirection: 'neutral' };
  }

  const change = metric.currentPeriod - metric.previousPeriod;
  const absChange = Math.abs(change);
  const pct = Math.abs(metric.changePercent);
  const trendDirection = metric.changePercent > 0 ? 'up' : metric.changePercent < 0 ? 'down' : 'neutral';
  const hasNoData = !metric.currentPeriod && !metric.previousPeriod;

  return {
    value: formatNumber(metric.currentPeriod),
    description: hasNoData
      ? 'No data available'
      : `${change >= 0 ? '+' : '-'}${formatNumber(absChange)} compared to prior period`,
    percentageChange: pct,
    trendDirection,
  };
}

export function useMetricData(data: AnalyticsDashboardData | undefined) {
  const messagesDeliveredData = useMemo(
    () => processMetric(data?.metrics.activeApplications),
    [data?.metrics.activeApplications],
  );

  const activeSubscribersData = useMemo(
    () => processMetric(data?.metrics.onboardedApplicants),
    [data?.metrics.onboardedApplicants],
  );

  const totalInteractionsData = useMemo(
    () => processMetric(data?.metrics.docsUnderReview),
    [data?.metrics.docsUnderReview],
  );

  const avgMessagesPerSubscriberData = useMemo(
    () => processMetric(data?.metrics.overdueApplications),
    [data?.metrics.overdueApplications],
  );

  return {
    messagesDeliveredData,
    activeSubscribersData,
    totalInteractionsData,
    avgMessagesPerSubscriberData,
  };
}
