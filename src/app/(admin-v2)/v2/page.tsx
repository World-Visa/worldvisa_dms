import { PrimaryApplication } from "@/components/v2/dashboard/primary-application";
import { NetWorth } from "@/components/v2/dashboard/net-worth";
import { MonthlyCashFlow } from "@/components/v2/dashboard/monthly-cash-flow";
import { SavingsRate } from "@/components/v2/dashboard/savings-rate";
import { RecentApplicationsTable } from "@/components/v2/dashboard/recent-applications-table";
import { TeamMembers } from "@/components/v2/dashboard/team-members";

export default function Page() {
  return (
    <div>
        <div className="flex flex-col gap-4 **:data-[slot=card]:shadow-xs">
            <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:gap-2 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
              <PrimaryApplication />
              <NetWorth />
              <MonthlyCashFlow />
              <SavingsRate />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,13fr)_minmax(280px,7fr)]">
              <div className="min-w-0 *:data-[slot=card]:shadow-xs">
                <RecentApplicationsTable />
              </div>
              <TeamMembers />
            </div>
          </div>
    </div>
  );
}