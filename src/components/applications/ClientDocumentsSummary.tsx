import React from "react";
import { ClientDocument } from "@/types/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ClientDocumentsSummaryProps {
  documents: ClientDocument[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

interface StatusConfig {
  title: string;
  status: ClientDocument["status"];
  dot: string;
  activeClasses: string;
  inactiveClasses: string;
}

const STATUS_CONFIG: StatusConfig[] = [
  {
    title: "Pending",
    status: "pending",
    dot: "bg-amber-400",
    activeClasses:
      "border-amber-300 bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    inactiveClasses:
      "border-gray-200 bg-white text-gray-600 hover:border-amber-200 hover:bg-amber-50/50",
  },
  {
    title: "Approved",
    status: "approved",
    dot: "bg-green-500",
    activeClasses:
      "border-green-300 bg-green-50 text-green-800 ring-1 ring-green-200",
    inactiveClasses:
      "border-gray-200 bg-white text-gray-600 hover:border-green-200 hover:bg-green-50/50",
  },
  {
    title: "Rejected",
    status: "rejected",
    dot: "bg-red-500",
    activeClasses:
      "border-red-300 bg-red-50 text-red-800 ring-1 ring-red-200",
    inactiveClasses:
      "border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50/50",
  },
];

export function ClientDocumentsSummary({
  documents,
  isLoading,
  error,
}: ClientDocumentsSummaryProps) {
  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[80, 96, 80].map((w, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          <Skeleton key={i} className="h-8 rounded-md" style={{ width: w }} />
        ))}
      </div>
    );
  }

  if (error || !documents) {
    return null;
  }

  const counts: Record<string, number> = {
    pending: documents.filter((d) => d.status === "pending").length,
    approved: documents.filter((d) => d.status === "approved").length,
    rejected: documents.filter((d) => d.status === "rejected").length,
  };

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Document status summary">
      {STATUS_CONFIG.map(({ title, status, dot, inactiveClasses }) => {
        const count = counts[status] ?? 0;
        return (
          <div
            key={status}
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium cursor-default",
              inactiveClasses,
            )}
          >
            <span className={cn("h-2 w-2 shrink-0 rounded-full", dot)} />
            <span>{title}</span>
            <span className="tabular-nums text-xs font-semibold text-gray-500">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
