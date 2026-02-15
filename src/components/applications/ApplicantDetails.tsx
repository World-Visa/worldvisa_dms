import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Application } from "@/types/applications";
import { formatDate } from "@/utils/format";
import { User } from "lucide-react";
import { useState } from "react";
import { ApplicationDeadlineCard } from "./ApplicationDeadlineCard";
import { DeadlineUpdateModal } from "./DeadlineUpdateModal";

interface ApplicantDetailsProps {
  application: Application | undefined;
  isLoading: boolean;
  error: Error | null;
  user: { role?: string } | null;
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
      <div className="flex flex-col lg:flex-row justify-between w-full gap-6 lg:gap-8 lg:items-end">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full">
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <Card className="w-full lg:max-w-xs lg:w-full">
          <CardHeader>
            <CardTitle>Applicant Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-4 lg:gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-full" />
              </div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Applicant Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive">Failed to load applicant details</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!application) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-lexend">Applicant Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground font-lexend">
              No application data available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatValue = (value: string) => {
    if (!value || value === "N/A") return "Not provided";
    return value;
  };

  return (
    <div className="space-y-6">
      <ApplicationDeadlineCard
        deadline={application.Deadline_For_Lodgment}
        user={user}
        onEditDeadline={() => setIsDeadlineModalOpen(true)}
        applicationStage={application.Application_Stage}
      />

      {/* All Application Information in Single Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-bold">Application Information</h3>
          </div>
          <div className="flex items-center">
            <span className="text-xs text-slate-500 dark:text-slate-400 mr-2 uppercase font-bold tracking-tighter">
              Status:
            </span>
            <Badge className="px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-full text-xs font-bold">
              {application?.Application_Stage}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-12">
            {/* Column 1 - Personal Information */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Personal Information
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Full Name
                  </p>
                  <p className="text-sm font-semibold">
                    {formatValue(application.Name)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Email
                  </p>
                  <p className="text-sm font-semibold">
                    {formatValue(application.Email)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Phone
                  </p>
                  <p className="text-sm font-semibold">
                    {formatValue(application.Phone)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Main Applicant
                  </p>
                  <p className="text-sm font-semibold">
                    {formatValue(application.Main_Applicant || "")}
                  </p>
                </div>
                {application.Record_Type !== "spouse_skill_assessment" && (
                  <>
                    <div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                        Spouse Skill Assessment
                      </p>
                      <p className="text-sm font-semibold">
                        {formatValue(application.Spouse_Skill_Assessment ?? "")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                        Spouse Name
                      </p>
                      <p className="text-sm font-semibold">
                        {formatValue(application.Spouse_Name ?? "")}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Column 2 - Visa Details */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Visa Details
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Target Country
                  </p>
                  <p className="text-sm font-semibold">
                    {formatValue(application.Qualified_Country || "")}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Service Type
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-primary text-white text-[10px] font-bold rounded">
                    {formatValue(
                      application.Service_Finalized || "",
                    ).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Suggested ANZSCO
                  </p>
                  <p className="text-sm font-semibold">
                    {formatValue(application.Suggested_Anzsco || "")}
                  </p>
                </div>
              </div>
            </div>

            {/* Column 3 - Application Mgmt */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Application Mgmt
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Handled By
                  </p>
                  <p className="text-sm font-semibold">
                    {formatValue(application.Application_Handled_By)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Created Date
                  </p>
                  <p className="text-sm font-semibold">
                    {application.Created_Time
                      ? formatDate(application.Created_Time, "time")
                      : "Not available"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Assessing Authority
                  </p>
                  <p className="text-sm font-semibold">
                    {formatValue(application.Assessing_Authority || "")}
                  </p>
                </div>
              </div>
            </div>

            {/* Column 4 - Assets & Files */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Assets & Files
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Record Type
                  </p>
                  <p className="text-sm font-semibold">
                    {formatValue(application.Record_Type || "")}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">
                    Total Attachments
                  </p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {application.AttachmentCount || 0} Documents
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deadline Update Modal */}
      <DeadlineUpdateModal
        isOpen={isDeadlineModalOpen}
        onClose={() => setIsDeadlineModalOpen(false)}
        leadId={application.id}
        currentDeadline={application.Deadline_For_Lodgment}
        applicationName={application.Name}
        recordType={application.Record_Type}
      />
    </div>
  );
}
