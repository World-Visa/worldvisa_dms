// ─── Report type keys ─────────────────────────────────────────────────────────

export const ReportTypeEnum = {
  ACTIVE_APPLICATIONS: 'activeApplications',
  ONBOARDED_APPLICANTS: 'onboardedApplicants',
  DOCS_UNDER_REVIEW: 'docsUnderReview',
  OVERDUE_APPLICATIONS: 'overdueApplications',
  DELIVERY_TREND: 'deliveryTrend',
  APPLICATIONS_BY_CATEGORY: 'applicationsByCategory',
  INTERACTION_TREND: 'interactionTrend',
  LODGEMENTS_TREND: 'lodgementsTrend',
  ACTIVE_AGENTS: 'activeAgents',
  APPLICATIONS_BY_COUNTRY: 'applicationsByCountry',
} as const;

export type ReportType = (typeof ReportTypeEnum)[keyof typeof ReportTypeEnum];

// ─── Metric card ──────────────────────────────────────────────────────────────

export interface PeriodMetric {
  currentPeriod: number;
  previousPeriod: number;
  changePercent: number;
}

// ─── Delivery trend ───────────────────────────────────────────────────────────

export interface DailyDeliveryPoint {
  date: string;
  timestamp: string;
  email: number;
  chat: number;
  call: number;
  inApp: number;
}

// ─── Applications by deadline category ───────────────────────────────────────

export interface ApplicationCategoryItem {
  label: string;
  count: number;
  fill: string;
}

// ─── Application activity / interaction trend ─────────────────────────────────

export interface DailyInteractionPoint {
  date: string;
  timestamp: string;
  documentsUploaded: number;
  documentsReviewed: number;
  commentsAdded: number;
  qualityChecks: number;
}

// ─── Application lodgements trend ─────────────────────────────────────────────

export interface DailyLodgementPoint {
  date: string;
  timestamp: string;
  lodgements: number;
  reviews: number;
}

// ─── Active agents ────────────────────────────────────────────────────────────

export type AgentStatus = 'online' | 'offline';

export interface ActiveAgent {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  onlineStatus: AgentStatus;
  profileImageUrl: string | null;
}

// ─── Applications by country ──────────────────────────────────────────────────

export interface CountryVolume {
  country: string;
  main: number;
  spouse: number;
  total: number;
  fill: string;
}

// ─── Full analytics response ──────────────────────────────────────────────────

export interface AnalyticsDashboardData {
  period: number;
  generatedAt: string;
  metrics: {
    activeApplications: PeriodMetric;
    onboardedApplicants: PeriodMetric;
    docsUnderReview: PeriodMetric;
    overdueApplications: PeriodMetric;
  };
  deliveryTrend: DailyDeliveryPoint[];
  applicationsByCategory: ApplicationCategoryItem[];
  interactionTrend: DailyInteractionPoint[];
  lodgementTrend: DailyLodgementPoint[];
  activeAgents: ActiveAgent[];
  applicationsByCountry: CountryVolume[];
}
