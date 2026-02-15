"use client";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/format";
import { Calendar, Edit3, AlertTriangle } from "lucide-react";

const STAGES_WITH_DEADLINE = [
  "Stage 1 Documentation: Approved",
  "Stage 1 Documentation: Rejected",
  "Stage 1 Milestone Completed",
  "Stage 1 Documentation Reviewed",
  "Skill Assessment Stage",
] as const;

interface ApplicationDeadlineCardProps {
  deadline: string | undefined;
  user: { role?: string } | null;
  onEditDeadline: () => void;
  applicationStage?: string;
}

function isDeadlineApproaching(deadline: string) {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 30 && diffDays >= 0;
}

function isDeadlinePassed(deadline: string) {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const today = new Date();
  return deadlineDate < today;
}

function getDaysRemaining(deadline: string) {
  if (!deadline) return null;
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays < 0 ? "Overdue" : diffDays;
}

function getDeadlineStyles(deadline: string) {
  const passed = isDeadlinePassed(deadline);
  const approaching = isDeadlineApproaching(deadline);

  if (passed) {
    return {
      container:
        "bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30",
      iconContainer: "bg-red-500/10 dark:bg-red-500/20",
      icon: "text-red-600 dark:text-red-400",
      label: "text-red-600/70 dark:text-red-400/70",
      date: "text-slate-800 dark:text-white",
      subtitle: "text-red-600/60 dark:text-red-400/60",
      days: "text-red-600 dark:text-red-400",
    };
  }
  if (approaching) {
    return {
      container:
        "bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30",
      iconContainer: "bg-orange-500/10 dark:bg-orange-500/20",
      icon: "text-orange-600 dark:text-orange-400",
      label: "text-orange-600/70 dark:text-orange-400/70",
      date: "text-slate-800 dark:text-white",
      subtitle: "text-orange-600/60 dark:text-orange-400/60",
      days: "text-orange-600 dark:text-orange-400",
    };
  }
  return {
    container:
      "bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30",
    iconContainer: "bg-blue-500/10 dark:bg-blue-500/20",
    icon: "text-blue-600 dark:text-blue-400",
    label: "text-blue-600/70 dark:text-blue-400/70",
    date: "text-slate-800 dark:text-white",
    subtitle: "text-blue-600/60 dark:text-blue-400/60",
    days: "text-blue-600 dark:text-blue-400",
  };
}

export function ApplicationDeadlineCard({
  deadline,
  user,
  onEditDeadline,
  applicationStage,
}: ApplicationDeadlineCardProps) {
  if (
    applicationStage !== undefined &&
    !STAGES_WITH_DEADLINE.includes(
      applicationStage as (typeof STAGES_WITH_DEADLINE)[number],
    )
  ) {
    return null;
  }

  const canEdit =
    user?.role === "admin" ||
    user?.role === "team_leader" ||
    user?.role === "master_admin";

  if (deadline) {
    const styles = getDeadlineStyles(deadline);
    const daysRemaining = getDaysRemaining(deadline);
    const passed = isDeadlinePassed(deadline);
    const approaching = isDeadlineApproaching(deadline);

    return (
      <div
        className={`${styles.container} rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6`}
      >
        <div className="flex items-center space-x-5">
          <div
            className={`w-12 h-12 ${styles.iconContainer} rounded-xl flex items-center justify-center relative`}
          >
            <Calendar className={`h-6 w-6 ${styles.icon}`} />
          </div>
          <div>
            <p
              className={`${styles.label} text-sm font-medium uppercase tracking-wider flex items-center gap-2`}
            >
              Application Deadline
              {passed && <AlertTriangle className={`h-4 w-4 ${styles.icon}`} />}
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
          {canEdit && (
            <Button
              onClick={onEditDeadline}
              className="bg-white hover:bg-gray-50 px-4 py-2 rounded-lg text-sm text-gray-900 font-semibold shadow-sm border border-slate-200 cursor-pointer transition-colors flex items-center gap-2"
            >
              Edit Deadline
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
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
      {canEdit && (
        <Button
          onClick={onEditDeadline}
          className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors flex items-center gap-2"
        >
          <Edit3 className="h-4 w-4" />
          Set Deadline
        </Button>
      )}
    </div>
  );
}
