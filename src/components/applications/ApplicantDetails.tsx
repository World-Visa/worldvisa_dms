import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Application } from "@/types/applications";
import { formatDate } from "@/utils/format";
import { BadgeCheck, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ApplicationDeadlineCard, shouldShowDeadlineCard } from "./ApplicationDeadlineCard";
import { ApplicationDeadlineCardSkeleton } from "./ApplicationDeadlineCardSkeleton";
import { DeadlineUpdateModal } from "./DeadlineUpdateModal";
import { CopyButton } from "@/components/ui/primitives/copy-button";

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

/** Same layout as loaded ApplicantDetails: real labels, skeleton values (used by full-page skeletons). */
export function ApplicantDetailsLoadingPlaceholder({
  isSpouseApplication = false,
}: {
  isSpouseApplication?: boolean;
}) {
  const showDeadlineColumnWhileLoading = shouldShowDeadlineCard(undefined);

  return (
    <div className="flex gap-6 items-stretch">
      <div
        className={cn(
          "min-w-0 bg-white border border-gray-200 rounded-2xl overflow-hidden",
          showDeadlineColumnWhileLoading ? "flex-7" : "flex-1",
        )}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              Application Information
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {!isSpouseApplication && (
              <Skeleton className="h-6 w-28 rounded-full" />
            )}
            <Skeleton className="h-6 w-36 rounded-full" />
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
            <div className="space-y-4">
              <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pb-2 border-b border-gray-100">
                Personal Information
              </h4>
              <div className="space-y-3">
                <LabeledValueSkeleton label="Full Name" />
                <LabeledValueSkeleton label="Email" />
                <LabeledValueSkeleton label="Phone" />
                {isSpouseApplication ? (
                  <LabeledValueSkeleton label="Main Applicant" />
                ) : (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">
                      Spouse Skill Assessment
                    </p>
                    <Skeleton className="h-4 w-full max-w-[200px]" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pb-2 border-b border-gray-100">
                Visa Details
              </h4>
              <div className="space-y-3">
                <LabeledValueSkeleton label="Target Country" />
                <div>
                  <p className="text-xs text-gray-400 mb-1">Service Type</p>
                  <Skeleton className="h-5 w-20 rounded" />
                </div>
                <LabeledValueSkeleton label="Suggested ANZSCO" />
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pb-2 border-b border-gray-100">
                Application Mgmt
              </h4>
              <div className="space-y-3">
                <LabeledValueSkeleton label="Handled By" />
                <div>
                  <p className="text-xs text-gray-400 mb-1">Created Date</p>
                  <Skeleton className="h-4 w-44 max-w-full" />
                </div>
                <LabeledValueSkeleton label="Assessing Authority" />
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pb-2 border-b border-gray-100">
                Assets & Files
              </h4>
              <div className="space-y-3">
                <LabeledValueSkeleton label="Record Type" />
                <div>
                  <p className="text-xs text-gray-400 mb-1">Total Documents</p>
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showDeadlineColumnWhileLoading && (
        <div className="flex-3 min-w-0">
          <ApplicationDeadlineCardSkeleton />
        </div>
      )}
    </div>
  );
}

interface InfoFieldProps {
  label: string;
  value: string;
}

function InfoField({ label, value }: InfoFieldProps) {
  const isProvided = value !== "Not provided";

  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <div className="group flex items-center gap-0.5 min-w-0">
        <p
          className="text-sm font-medium text-slate-800 truncate min-w-0 flex-1"
          title={isProvided ? value : undefined}
        >
          {value}
        </p>
        {isProvided && (
          <CopyButton
            valueToCopy={value}
            size="2xs"
            className="shrink-0 p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted/70"
            aria-label={`Copy ${label}`}
          />
        )}
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
  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);

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

  const formatValue = (value: string) => {
    if (!value || value === "N/A") return "Not provided";
    return value;
  };
  const showDeadlineCard = shouldShowDeadlineCard(application.Application_Stage);

  return (
    <>
      <div className="flex gap-6 items-stretch">
        {/* Left — Application Information (70%) */}
        <div
          className={cn(
            "min-w-0 bg-white border border-gray-200 rounded-2xl overflow-hidden",
            showDeadlineCard ? "flex-7" : "flex-1",
          )}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-medium text-foreground-900">
                Application Information
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {application.Record_Type !== "spouse_skill_assessment" && (
                <Badge
                  variant="default"
                  className="bg-primary-blue h-6 flex items-center gap-1.5 px-2 rounded-full text-xs font-medium"
                >
                  <BadgeCheck size={12} className="text-white" />
                  {application?.Package_Finalize || "Not provided"}
                </Badge>
              )}
              <Badge className="h-6 px-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-xs font-semibold hover:bg-emerald-50">
                {application?.Application_Stage}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
              {/* Column 1 — Personal Information */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pb-2 border-b border-gray-100">
                  Personal Information
                </h4>
                <div className="space-y-3">
                  <InfoField label="Full Name" value={formatValue(application.Name)} />
                  <InfoField label="Email" value={formatValue(application.Email)} />
                  <InfoField label="Phone" value={formatValue(application.Phone)} />
                  {application.Record_Type === "spouse_skill_assessment" ? (
                    <InfoField
                      label="Main Applicant"
                      value={formatValue(application.Main_Applicant || "")}
                    />
                  ) : (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">
                        Spouse Skill Assessment
                      </p>
                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        {!application.Spouse_Skill_Assessment &&
                        !application.Spouse_Name ? (
                          <span className="text-sm font-medium text-slate-800">
                            Not provided
                          </span>
                        ) : (
                          <>
                            <span className="text-sm font-medium text-slate-800">
                              {formatValue(application.Spouse_Skill_Assessment ?? "")}
                            </span>
                            <span className="text-sm font-medium text-slate-800">
                              {" — "}
                            </span>
                            {application.spouse_lead_id &&
                            (application.Spouse_Name ?? "").trim() !== "" ? (
                              <Link
                                href={`/v2/spouse-skill-assessment-applications/${application.spouse_lead_id}`}
                                className="text-sm font-medium text-primary hover:underline truncate min-w-0"
                                aria-label={`View spouse application: ${application.Spouse_Name}`}
                              >
                                {formatValue(application.Spouse_Name ?? "")}
                              </Link>
                            ) : (
                              <span className="text-sm font-medium text-slate-800 truncate min-w-0">
                                {formatValue(application.Spouse_Name ?? "")}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2 — Visa Details */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pb-2 border-b border-gray-100">
                  Visa Details
                </h4>
                <div className="space-y-3">
                  <InfoField
                    label="Target Country"
                    value={formatValue(application.Qualified_Country || "")}
                  />
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Service Type</p>
                    <span className="text-foreground-900 text-sm font-medium">
                      {formatValue(application.Service_Finalized || "")}
                    </span>
                  </div>
                  <InfoField
                    label="Suggested ANZSCO"
                    value={formatValue(application.Suggested_Anzsco || "")}
                  />
                </div>
              </div>

              {/* Column 3 — Application Mgmt */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pb-2 border-b border-gray-100">
                  Application Mgmt
                </h4>
                <div className="space-y-3">
                  <InfoField
                    label="Handled By"
                    value={formatValue(application.Application_Handled_By)}
                  />
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Created Date</p>
                    <p className="text-sm font-medium text-slate-800">
                      {application.Created_Time
                        ? formatDate(application.Created_Time, "time")
                        : "Not available"}
                    </p>
                  </div>
                  <InfoField
                    label="Assessing Authority"
                    value={formatValue(application.Assessing_Authority || "")}
                  />
                  {application.last_communication_activity && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Last Communication</p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-slate-800">
                          {formatDate(application.last_communication_activity, "datetime")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Column 4 — Assets & Files */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pb-2 border-b border-gray-100">
                  Assets & Files
                </h4>
                <div className="space-y-3">
                  <InfoField
                    label="Record Type"
                    value={formatValue(application.Record_Type || "")}
                  />
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Total Documents</p>
                    <p className="text-sm font-medium text-slate-800">
                      {application.AttachmentCount || 0} documents
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showDeadlineCard && (
          <div className="flex-3 min-w-0">
            <ApplicationDeadlineCard
              deadline={application.Deadline_For_Lodgment}
              user={user}
              onEditDeadline={() => setIsDeadlineModalOpen(true)}
              applicationStage={application.Application_Stage}
            />
          </div>
        )}
      </div>

      <DeadlineUpdateModal
        isOpen={isDeadlineModalOpen}
        onClose={() => setIsDeadlineModalOpen(false)}
        leadId={application.id}
        currentDeadline={application.Deadline_For_Lodgment}
        applicationName={application.Name}
        recordType={application.Record_Type}
      />
    </>
  );
}
