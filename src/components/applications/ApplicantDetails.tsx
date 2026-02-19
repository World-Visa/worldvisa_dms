import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Application } from "@/types/applications";
import { formatDate } from "@/utils/format";
import { BadgeCheck, Check, Copy, User } from "lucide-react";
import { useState } from "react";
import { ApplicationDeadlineCard } from "./ApplicationDeadlineCard";
import { DeadlineUpdateModal } from "./DeadlineUpdateModal";

interface ApplicantDetailsProps {
  application: Application | undefined;
  isLoading: boolean;
  error: Error | null;
  user: { role?: string } | null;
}

interface InfoFieldProps {
  label: string;
  value: string;
}

function InfoField({ label, value }: InfoFieldProps) {
  const [copied, setCopied] = useState(false);
  const isProvided = value !== "Not provided";

  const handleCopy = () => {
    if (!isProvided) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <div className="group flex items-center gap-1.5 min-w-0">
        <p
          className={cn(
            "text-sm font-medium text-slate-800 truncate min-w-0 flex-1",
            isProvided && "cursor-pointer hover:text-slate-600 transition-colors",
          )}
          title={isProvided ? value : undefined}
          onClick={isProvided ? handleCopy : undefined}
        >
          {value}
        </p>
        {isProvided && (
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={`Copy ${label}`}
          >
            {copied ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                <Check className="h-3 w-3" />
                Copied!
              </span>
            ) : (
              <Copy className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
            )}
          </button>
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
}: ApplicantDetailsProps) {
  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex gap-6 items-stretch">
        <div className="flex-7 min-w-0 bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-3 w-20" />
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="space-y-1">
                      <Skeleton className="h-3 w-14" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-3 min-w-0">
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex gap-6">
        <div className="flex-7 min-w-0 bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-destructive text-sm">Failed to load applicant details</p>
          <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
        </div>
      </div>
    );
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

  return (
    <>
      <div className="flex gap-6 items-stretch">
        {/* Left — Application Information (70%) */}
        <div className="flex-7 min-w-0 bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* Header */}
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
                    <InfoField
                      label="Spouse Skill Assessment"
                      value={`${formatValue(application.Spouse_Skill_Assessment ?? "")} — ${formatValue(application.Spouse_Name ?? "")}`}
                    />
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
                    <span className="inline-block px-2 py-0.5 bg-primary text-white text-[10px] font-bold rounded">
                      {formatValue(
                        application.Service_Finalized || "",
                      ).toUpperCase()}
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

        {/* Right — Application Deadline (30%) */}
        <div className="flex-3 min-w-0">
          <ApplicationDeadlineCard
            deadline={application.Deadline_For_Lodgment}
            user={user}
            onEditDeadline={() => setIsDeadlineModalOpen(true)}
            applicationStage={application.Application_Stage}
          />
        </div>
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
