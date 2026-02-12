export interface DeadlineStatsSummary {
  total: number;
  approaching: number;
  overdue: number;
  noDeadline: number;
}

export interface DeadlineStatsDetails {
  approaching: unknown[];
  overdue: unknown[];
  noDeadline: unknown[];
}

/** API returns { data: DeadlineStatsData }. Use only data. */
export interface DeadlineStatsData {
  summary: DeadlineStatsSummary;
  details: DeadlineStatsDetails;
}
