import { RiGroup2Fill } from 'react-icons/ri';
import { InboxBellFilled } from '@/components/icons/inbox-bell-filled';
import { StackedDots } from '@/components/icons/stacked-dots';
import { TargetArrow } from '@/components/icons/target-arrow';
import { AnalyticsCard } from '@/components/v2/dashboard/analytics/analytics-card';
import { ANALYTICS_TOOLTIPS } from '@/components/v2/dashboard/analytics/constants/analytics-tooltips';
import { useMetricData } from '@/hooks/use-metric-data';
import type { AnalyticsDashboardData } from '@/types/analytics';

type AnalyticsSectionProps = {
  data: AnalyticsDashboardData | undefined;
  isLoading: boolean;
};

export function AnalyticsSection({ data, isLoading }: AnalyticsSectionProps) {
  const {
    messagesDeliveredData,
    activeSubscribersData,
    totalInteractionsData,
    avgMessagesPerSubscriberData,
  } = useMetricData(data);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-1.5 items-start">
      <AnalyticsCard
        icon={InboxBellFilled}
        value={messagesDeliveredData.value}
        title="Active Applications"
        description={messagesDeliveredData.description}
        percentageChange={messagesDeliveredData.percentageChange}
        trendDirection={messagesDeliveredData.trendDirection}
        isLoading={isLoading}
        infoTooltip={ANALYTICS_TOOLTIPS.MESSAGES_DELIVERED}
      />

      <AnalyticsCard
        icon={RiGroup2Fill}
        value={activeSubscribersData.value}
        title="Onboarded Applicants"
        description={activeSubscribersData.description}
        percentageChange={activeSubscribersData.percentageChange}
        trendDirection={activeSubscribersData.trendDirection}
        isLoading={isLoading}
        infoTooltip={ANALYTICS_TOOLTIPS.ACTIVE_SUBSCRIBERS}
      />

      <AnalyticsCard
        icon={TargetArrow}
        value={totalInteractionsData.value}
        title="Docs Under Review"
        description={totalInteractionsData.description}
        percentageChange={totalInteractionsData.percentageChange}
        trendDirection={totalInteractionsData.trendDirection}
        isLoading={isLoading}
        infoTooltip={ANALYTICS_TOOLTIPS.INTERACTIONS}
      />

      <AnalyticsCard
        icon={StackedDots}
        value={avgMessagesPerSubscriberData.value}
        title="Overdue Applications"
        description={avgMessagesPerSubscriberData.description}
        percentageChange={avgMessagesPerSubscriberData.percentageChange}
        trendDirection={avgMessagesPerSubscriberData.trendDirection}
        isLoading={isLoading}
        infoTooltip={ANALYTICS_TOOLTIPS.AVG_MESSAGES_PER_SUBSCRIBER}
      />
    </div>
  );
}
