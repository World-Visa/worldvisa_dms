import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Application } from "@/types/applications";
import { shouldShowDeadlineCard } from "./ApplicationDeadlineCard";
import { ApplicationInfoCard } from "./ApplicationInfoCard";
import DeadlineWidget from "./deadline/DeadlineWidget";
import { DeadlineWidgetSkeleton } from "./deadline/DeadlineWidgetSkeleton";

interface ApplicantDetailsProps {
  application: Application | undefined;
  isLoading: boolean;
  error: Error | null;
  user: { role?: string } | null;
  isSpouseApplication?: boolean;
  suppressErrorUI?: boolean;
}

function LabeledValueSkeleton({ label, className }: { label: string; className?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <Skeleton className={cn("h-4 max-w-[220px]", className ?? "w-full")} />
    </div>
  );
}

export function ApplicantDetailsLoadingPlaceholder({
  isSpouseApplication = false,
}: {
  isSpouseApplication?: boolean;
}) {
  return (
    <div className="flex gap-2 items-stretch w-full min-w-0">
      {/* Gray outer container — matches ApplicationInfoCard */}
      <div
        className={cn("min-w-0 flex flex-col flex-1")}
        style={{
          background: "#f7f7f7",
          border: "1px solid #e5e7eb",
          borderRadius: 24,
          boxShadow:
            "0px 4px 6px -1px rgba(0,0,0,0.07)," +
            "0px 2px 4px -1px rgba(0,0,0,0.04)",
          gap: 6,
          paddingTop: 12,
          paddingLeft: 4,
          paddingRight: 4,
          paddingBottom: 4,
        }}
      >
        {/* Header row skeleton */}
        <div className="flex items-center justify-between" style={{ paddingLeft: 10, paddingRight: 10 }}>
          <Skeleton className="h-4 w-44" />
          <div className="flex items-center gap-2">
            {!isSpouseApplication && <Skeleton className="h-5 w-28 rounded-full" />}
            <Skeleton className="h-5 w-32 rounded-full" />
          </div>
        </div>

        {/* White card skeleton */}
        <div
          style={{
            borderRadius: "16px 16px 20px 20px",
            background: "white",
            boxShadow:
              "0px 4px 8px -2px rgba(51,51,51,0.06)," +
              "0px 2px 4px 0px rgba(51,51,51,0.04)," +
              "0px 1px 2px 0px rgba(51,51,51,0.04)," +
              "0px 0px 0px 1px #f5f5f5",
            padding: 12,
          }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-5">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-2.5 w-28 mb-1" />
              <LabeledValueSkeleton label="Full Name" />
              <LabeledValueSkeleton label="Email" />
              <LabeledValueSkeleton label="Phone" />
              {isSpouseApplication ? (
                <LabeledValueSkeleton label="Main Applicant" />
              ) : (
                <LabeledValueSkeleton label="Spouse Skill Assessment" />
              )}
            </div>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-2.5 w-20 mb-1" />
              <LabeledValueSkeleton label="Target Country" />
              <div>
                <p className="text-xs text-gray-400 mb-1">Service Type</p>
                <Skeleton className="h-4 w-28" />
              </div>
              <LabeledValueSkeleton label="Suggested ANZSCO" />
            </div>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-2.5 w-28 mb-1" />
              <LabeledValueSkeleton label="Handled By" />
              <div>
                <p className="text-xs text-gray-400 mb-1">Created Date</p>
                <Skeleton className="h-4 w-44 max-w-full" />
              </div>
              <LabeledValueSkeleton label="Assessing Authority" />
            </div>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-2.5 w-20 mb-1" />
              <LabeledValueSkeleton label="Record Type" />
              <div>
                <p className="text-xs text-gray-400 mb-1">Total Documents</p>
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-[358px]">
        <DeadlineWidgetSkeleton />
      </div>
    </div>
  );
}


export function ApplicantDetails({
  application,
  isLoading,
  error,
  user,
  isSpouseApplication = false,
  suppressErrorUI = false,
}: ApplicantDetailsProps) {

  if (isLoading) {
    return (
      <ApplicantDetailsLoadingPlaceholder
        isSpouseApplication={isSpouseApplication}
      />
    );
  }

  if (error && !suppressErrorUI) {
    return <ErrorState title="Failed to load applicant details" message={error.message} />;
  }

  if (!application) {
    return (
      <div className="flex gap-6">
        <div className="flex-7 min-w-0 bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-muted-foreground text-sm">No application data available</p>
        </div>
      </div>
    );
  }

  const showDeadlineCard = shouldShowDeadlineCard(application.Application_Stage);

  return (
    <>
      <div className="flex gap-2 items-stretch w-full min-w-0 ">
        <div className={cn("min-w-0", showDeadlineCard ? "flex-7" : "flex-1")}>
          <ApplicationInfoCard
            application={application}
            isSpouseApplication={isSpouseApplication}
            user={user}
          />
        </div>

        <div className="w-[358px]">
          <DeadlineWidget
            leadId={application.id}
            currentDeadline={application.Deadline_For_Lodgment}
            deadlineExtensions={application.deadline_extensions}
          />
        </div>
      </div>

    </>
  );
}
