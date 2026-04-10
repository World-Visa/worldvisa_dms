/**
 * Backward-compatibility shim — re-exports DMS analytics types.
 * Chart components import directly from here so all type definitions
 * remain centralised in @/types/analytics.
 */
export type {
  // DMS native names used by our chart components
  DailyDeliveryPoint,
  ApplicationCategoryItem,
  DailyInteractionPoint,
  DailyLodgementPoint,
  ActiveAgent,
  CountryVolume,
  PeriodMetric,
  AnalyticsDashboardData,
  AgentStatus,
} from '@/types/analytics';

export { ReportTypeEnum } from '@/types/analytics';
