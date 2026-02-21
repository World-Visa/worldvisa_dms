import { VisaApplication } from "./applications";

export interface DeadlineStatsSummary {
  total: number;
  approaching: number;
  overdue: number;
  noDeadline: number;
  future: number;
}

export interface DeadlinePagination {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
}

export interface DeadlineCategoryData {
  data: VisaApplication[];
  pagination: DeadlinePagination;
}

export interface DeadlineStatsDetails {
  approaching: DeadlineCategoryData;
  overdue: DeadlineCategoryData;
  noDeadline: DeadlineCategoryData;
  future: DeadlineCategoryData;
}

/** API returns { data: DeadlineStatsData }. Use only data. */
export interface DeadlineStatsData {
  summary: DeadlineStatsSummary;
  details: DeadlineStatsDetails;
}

export interface DeadlineStatsParams {
  type: "visa" | "spouse";
  approachingPage?: number;
  approachingLimit?: number;
  overduePage?: number;
  overdueLimit?: number;
  noDeadlinePage?: number;
  noDeadlineLimit?: number;
  futurePage?: number;
  futureLimit?: number;
}
