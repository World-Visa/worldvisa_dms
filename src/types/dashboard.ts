export interface RecentApplication {
  id: string;
  Name: string;
  Email: string;
  Phone: string;
  Application_Stage: string;
  Application_Handled_By: string;
  Qualified_Country?: string;
  DMS_Application_Status: string | null;
  Created_Time: string;
  type: "main" | "spouse";
}

export interface DashboardData {
  totalApplications: {
    total: number;
    main: number;
    spouse: number;
  };
  qualityCheck: {
    total: number;
    main: number;
    spouse: number;
  };
  pendingReviews: number;
  monthlyStats: {
    currentMonth: number;
    previousMonth: number;
    growthPercent: number;
  };
  recentApplications: RecentApplication[];
}
