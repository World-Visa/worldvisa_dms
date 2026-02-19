"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/format";
import { AlertTriangle, Calendar, Edit3 } from "lucide-react";

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

function getDaysCount(deadline: string): number {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.abs(diffDays);
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
    const passed = isDeadlinePassed(deadline);
    const approaching = isDeadlineApproaching(deadline);
    const days = getDaysCount(deadline);

    const accent = passed
      ? "bg-red-400"
      : approaching
        ? "bg-amber-400"
        : "bg-blue-400";

    const container = passed
      ? "bg-red-50 border-red-100"
      : approaching
        ? "bg-amber-50 border-amber-100"
        : "bg-white border-gray-200";

    const iconBg = passed
      ? "bg-red-100"
      : approaching
        ? "bg-amber-100"
        : "bg-gray-100";

    const iconColor = passed
      ? "text-red-500"
      : approaching
        ? "text-amber-500"
        : "text-gray-500";

    const labelColor = passed
      ? "text-red-400"
      : approaching
        ? "text-amber-400"
        : "text-gray-400";

    const panelBg = passed
      ? "bg-red-100/60"
      : approaching
        ? "bg-amber-100/60"
        : "bg-gray-50";

    const daysColor = passed
      ? "text-red-600"
      : approaching
        ? "text-amber-600"
        : "text-blue-600";

    return (
      <div
        className={cn(
          "rounded-2xl border overflow-hidden flex flex-col h-full",
          container,
        )}
      >
        {/* Top accent strip */}
        <div className={cn("h-1 w-full shrink-0", accent)} />

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 flex-1">
          {/* Header */}
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                iconBg,
              )}
            >
              <Calendar className={cn("h-4 w-4", iconColor)} />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <p
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-widest",
                  labelColor,
                )}
              >
                Application Deadline
              </p>
              {(passed || approaching) && (
                <AlertTriangle className={cn("h-3 w-3 shrink-0", iconColor)} />
              )}
            </div>
          </div>

          {/* Date */}
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 font-medium">
              Target Date
            </p>
            <p className="text-xl font-bold text-slate-800 leading-tight">
              {formatDate(deadline)}
            </p>
          </div>

          {/* Days — focal point */}
          <div
            className={cn(
              "rounded-xl p-4 flex flex-col items-center justify-center flex-1 min-h-[90px]",
              panelBg,
            )}
          >
            <p
              className={cn(
                "text-5xl font-black tabular-nums leading-none",
                daysColor,
              )}
            >
              {days}
            </p>
            <p
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest mt-2",
                labelColor,
              )}
            >
              {passed ? "Days Overdue" : "Days Remaining"}
            </p>
          </div>

          {/* Footer */}
          <div className="flex flex-row items-center md:justify-between justify-start gap-1.5 w-full">
            <p className={cn("text-xs w-full", labelColor)}>
              {passed
                ? "⚠️ Deadline has passed"
                : approaching
                  ? "⚠️ Deadline is approaching"
                  : "Final lodgement target date"}
            </p>
            {canEdit && (
              <Button
                onClick={onEditDeadline}
                variant="link"
                className={cn(
                  "p-0 h-auto text-sm text-foreground font-medium justify-end w-fit",
                )}
              >
                <Edit3 className="h-3 w-3 " />
                Edit Deadline
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No deadline state
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center p-6 text-center gap-4 h-full">
      <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm">
        <Calendar className="h-5 w-5 text-gray-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">No Deadline Set</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Lodgement deadline not configured
        </p>
      </div>
      {canEdit && (
        <Button
          onClick={onEditDeadline}
          size="sm"
          className="bg-white border border-gray-200 text-accent-foreground hover:border-primary shadow-sm text-xs h-8 px-3 font-medium"
        >
          <Edit3 className="h-3.5 w-3.5 mr-1.5" />
          Set Deadline
        </Button>
      )}
    </div>
  );
}
