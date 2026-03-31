"use client";

import { Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Loading placeholder matching ApplicationDeadlineCard layout (labels visible, values skeleton).
 */
export function ApplicationDeadlineCardSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white overflow-hidden flex flex-col h-full",
        className,
      )}
    >
      <div className="h-1 w-full shrink-0 bg-blue-400" />
      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-gray-100">
            <Calendar className="h-4 w-4 text-gray-500" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Application Deadline
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 font-medium">
            Target Date
          </p>
          <Skeleton className="h-7 w-40 max-w-full" />
        </div>
        <div className="rounded-xl p-4 flex flex-col items-center justify-center flex-1 min-h-[90px] bg-gray-50">
          <Skeleton className="h-14 w-20 rounded-md" />
          <p className="text-[10px] font-bold uppercase tracking-widest mt-2 text-gray-400">
            Days Remaining
          </p>
        </div>
        <div className="flex flex-row items-center justify-between gap-2 w-full">
          <p className="text-xs text-gray-400">Final lodgement target date</p>
          <Skeleton className="h-4 w-24 shrink-0" />
        </div>
      </div>
    </div>
  );
}
