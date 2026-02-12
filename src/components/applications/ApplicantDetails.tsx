import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Application } from "@/types/applications";
import { formatDate } from "@/utils/format";
import {
  Briefcase,
  Calendar,
  FileText,
  Globe,
  Mail,
  Phone,
  Target,
  User,
  Clock,
  Edit3,
  AlertTriangle,
  Library,
} from "lucide-react";
import { useState } from "react";
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

  // Check if deadline is approaching (within 30 days)
  const isDeadlineApproaching = (deadline: string) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  // Check if deadline has passed
  const isDeadlinePassed = (deadline: string) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    return deadlineDate < today;
  };

  // Calculate days remaining
  const getDaysRemaining = (deadline: string) => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? "Overdue" : diffDays;
  };

  // Get conditional styles based on deadline status
  const getDeadlineStyles = (deadline: string) => {
    const passed = isDeadlinePassed(deadline);
    const approaching = isDeadlineApproaching(deadline);

    if (passed) {
      return {
        container: "bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30",
        iconContainer: "bg-red-500/10 dark:bg-red-500/20",
        icon: "text-red-600 dark:text-red-400",
        label: "text-red-600/70 dark:text-red-400/70",
        date: "text-slate-800 dark:text-white",
        subtitle: "text-red-600/60 dark:text-red-400/60",
        days: "text-red-600 dark:text-red-400",
      };
    } else if (approaching) {
      return {
        container: "bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30",
        iconContainer: "bg-orange-500/10 dark:bg-orange-500/20",
        icon: "text-orange-600 dark:text-orange-400",
        label: "text-orange-600/70 dark:text-orange-400/70",
        date: "text-slate-800 dark:text-white",
        subtitle: "text-orange-600/60 dark:text-orange-400/60",
        days: "text-orange-600 dark:text-orange-400",
      };
    } else {
      return {
        container: "bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30",
        iconContainer: "bg-blue-500/10 dark:bg-blue-500/20",
        icon: "text-blue-600 dark:text-blue-400",
        label: "text-blue-600/70 dark:text-blue-400/70",
        date: "text-slate-800 dark:text-white",
        subtitle: "text-blue-600/60 dark:text-blue-400/60",
        days: "text-blue-600 dark:text-blue-400",
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Deadline Card - Prominent Display */}
      {application.Deadline_For_Lodgment ? (() => {
        const deadline = application.Deadline_For_Lodgment;
        const styles = getDeadlineStyles(deadline);
        const daysRemaining = getDaysRemaining(deadline);
        const passed = isDeadlinePassed(deadline);
        const approaching = isDeadlineApproaching(deadline);

        return (
          <div className={`${styles.container} rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6`}>
            <div className="flex items-center space-x-5">
              <div className={`w-12 h-12 ${styles.iconContainer} rounded-xl flex items-center justify-center relative`}>
                <Calendar className={`h-6 w-6 ${styles.icon}`} />
              </div>
              <div>
                <p className={`${styles.label} text-sm font-medium uppercase tracking-wider flex items-center gap-2`}>
                  Application Deadline
                  {passed && (
                    <AlertTriangle className={`h-4 w-4 ${styles.icon}`} />
                  )}
                  {approaching && !passed && (
                    <AlertTriangle className={`h-4 w-4 ${styles.icon}`} />
                  )}
                </p>
                <h2 className={`${styles.date} text-2xl font-bold`}>
                  {formatDate(deadline)}
                </h2>
                <p className={`${styles.subtitle} text-xs`}>
                  {passed
                    ? "⚠️ Deadline has passed"
                    : approaching
                      ? "⚠️ Deadline approaching"
                      : "Final lodgement target date"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className={`${styles.days} text-3xl font-black`}>
                  {daysRemaining}
                </p>
                <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest">
                  Days Remaining
                </p>
              </div>
              {(user?.role === "admin" ||
                user?.role === "team_leader" ||
                user?.role === "master_admin") && (
                  <Button
                    onClick={() => setIsDeadlineModalOpen(true)}
                    className="bg-white hover:bg-gray-50 px-4 py-2 rounded-lg text-sm text-gray-900 font-semibold shadow-sm border border-slate-200 cursor-pointer transition-colors flex items-center gap-2"
                  >
                    Edit Deadline
                  </Button>
                )}
            </div>
          </div>
        );
      })() : (
        // Show a card when no deadline is set, with option to set one
        <div className="bg-gray-50 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-800/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="w-12 h-12 bg-gray-500/10 dark:bg-gray-500/20 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-gray-600/70 dark:text-gray-400/70 text-sm font-medium uppercase tracking-wider">
                Application Deadline
              </p>
              <h2 className="text-slate-800 dark:text-white text-2xl font-bold">
                No deadline set
              </h2>
              <p className="text-gray-600/60 dark:text-gray-400/60 text-xs">
                Application lodgement deadline not configured
              </p>
            </div>
          </div>
          {(user?.role === "admin" ||
            user?.role === "team_leader" ||
            user?.role === "master_admin") && (
              <Button
                onClick={() => setIsDeadlineModalOpen(true)}
                className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Set Deadline
              </Button>
            )}
        </div>
      )}

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
                    {formatValue(application.Service_Finalized || "").toUpperCase()}
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
