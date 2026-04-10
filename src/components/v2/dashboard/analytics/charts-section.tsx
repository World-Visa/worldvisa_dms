import type { AnalyticsDashboardData } from '@/types/analytics';
import { DeliveryTrendsChart } from './charts/delivery-trends-chart';
import { InteractionTrendChart } from './charts/interaction-trend-chart';
import { ApplicationsByCategory } from './charts/workflows-by-volume';

type ChartsSectionProps = {
  data: AnalyticsDashboardData | undefined;
  isLoading: boolean;
};

export function ChartsSection({ data, isLoading }: ChartsSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-1.5 lg:grid-rows-1 lg:h-[200px]">
      <DeliveryTrendsChart data={data?.deliveryTrend} isLoading={isLoading} />
      <ApplicationsByCategory data={data?.applicationsByCategory} isLoading={isLoading} />
      <InteractionTrendChart data={data?.interactionTrend} isLoading={isLoading} />
    </div>
  );
}
