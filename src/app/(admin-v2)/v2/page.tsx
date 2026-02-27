"use client";

import { PrimaryApplication } from "@/components/v2/dashboard/primary-application";
import { PendingReviews } from "@/components/v2/dashboard/pending-reviews";
import { MonthlyApplications } from "@/components/v2/dashboard/monthly-applications";
import { QualityCheckCard } from "@/components/v2/dashboard/quality-check-card";
import { RecentApplicationsTable } from "@/components/v2/dashboard/recent-applications-table";
import { TeamMembers } from "@/components/v2/dashboard/team-members";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export default function Page() {
  const { data, isLoading } = useDashboardStats();

  return (
    <div>
      <div className="flex flex-col gap-4 **:data-[slot=card]:shadow-xs">
        <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:gap-2 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
          <PrimaryApplication
            total={data?.totalApplications.total}
            main={data?.totalApplications.main}
            spouse={data?.totalApplications.spouse}
            isLoading={isLoading}
          />
          <PendingReviews
            count={data?.pendingReviews}
            isLoading={isLoading}
          />
          <MonthlyApplications
            currentMonth={data?.monthlyStats.currentMonth}
            previousMonth={data?.monthlyStats.previousMonth}
            growthPercent={data?.monthlyStats.growthPercent}
            isLoading={isLoading}
          />
          <QualityCheckCard
            total={data?.qualityCheck.total}
            main={data?.qualityCheck.main}
            spouse={data?.qualityCheck.spouse}
            isLoading={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,13fr)_minmax(280px,7fr)]">
          <div className="min-w-0 *:data-[slot=card]:shadow-xs">
            <RecentApplicationsTable
              data={data?.recentApplications}
              isLoading={isLoading}
            />
          </div>
          <TeamMembers />
        </div>
      </div>
    </div>
  );
}
