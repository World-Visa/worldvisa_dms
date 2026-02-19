import { Document } from "@/types/applications";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, AlertCircle, FileUp, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type DocumentStatus = Document["status"];

interface DocumentsSummaryProps {
  documents: Document[] | undefined;
  isLoading: boolean;
  error: Error | null;
  selectedStatus?: DocumentStatus | null;
  onStatusClick?: (status: DocumentStatus | null) => void;
}

interface StatusConfig {
  title: string;
  status: DocumentStatus;
  icon: typeof Clock;
  dot: string;
  activeClasses: string;
  inactiveClasses: string;
}

const STATUS_CONFIG: StatusConfig[] = [
  {
    title: "Pending",
    status: "pending",
    icon: Clock,
    dot: "bg-amber-400",
    activeClasses:
      "border-amber-300 bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    inactiveClasses:
      "border-gray-200 bg-white text-gray-600 hover:border-amber-200 hover:bg-amber-50/50",
  },
  {
    title: "Approved",
    status: "approved",
    icon: CheckCircle,
    dot: "bg-green-500",
    activeClasses:
      "border-green-300 bg-green-50 text-green-800 ring-1 ring-green-200",
    inactiveClasses:
      "border-gray-200 bg-white text-gray-600 hover:border-green-200 hover:bg-green-50/50",
  },
  {
    title: "Reviewed",
    status: "reviewed",
    icon: AlertCircle,
    dot: "bg-blue-500",
    activeClasses:
      "border-blue-300 bg-blue-50 text-blue-800 ring-1 ring-blue-200",
    inactiveClasses:
      "border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50/50",
  },
  {
    title: "Requested",
    status: "request_review",
    icon: FileUp,
    dot: "bg-orange-400",
    activeClasses:
      "border-orange-300 bg-orange-50 text-orange-800 ring-1 ring-orange-200",
    inactiveClasses:
      "border-gray-200 bg-white text-gray-600 hover:border-orange-200 hover:bg-orange-50/50",
  },
  {
    title: "Rejected",
    status: "rejected",
    icon: XCircle,
    dot: "bg-red-500",
    activeClasses:
      "border-red-300 bg-red-50 text-red-800 ring-1 ring-red-200",
    inactiveClasses:
      "border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50/50",
  },
];

export function DocumentsSummary({
  documents,
  isLoading,
  error,
  selectedStatus = null,
  onStatusClick,
}: DocumentsSummaryProps) {
  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[80, 96, 80, 96, 80].map((w, i) => (
          <Skeleton key={i} className="h-8 rounded-md" style={{ width: w }} />
        ))}
      </div>
    );
  }

  if (error || !documents) {
    return null;
  }

  const counts: Record<DocumentStatus, number> = {
    pending: documents.filter((d) => d.status === "pending").length,
    approved: documents.filter((d) => d.status === "approved").length,
    reviewed: documents.filter((d) => d.status === "reviewed").length,
    request_review: documents.filter((d) => d.status === "request_review").length,
    rejected: documents.filter((d) => d.status === "rejected").length,
  };

  const isInteractive = typeof onStatusClick === "function";

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Document status filters">
      {STATUS_CONFIG.map(({ title, status, dot, activeClasses, inactiveClasses }) => {
        const count = counts[status];
        const isActive = selectedStatus === status;

        return (
          <button
            key={status}
            type="button"
            role={isInteractive ? "checkbox" : undefined}
            aria-checked={isInteractive ? isActive : undefined}
            aria-label={isInteractive ? `Filter by ${title}: ${count} documents` : undefined}
            disabled={!isInteractive}
            onClick={() => {
              if (isInteractive) {
                onStatusClick(isActive ? null : status);
              }
            }}
            onKeyDown={(e) => {
              if (isInteractive && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onStatusClick(isActive ? null : status);
              }
            }}
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-all duration-150",
              isInteractive ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-400" : "cursor-default",
              isActive ? activeClasses : inactiveClasses,
            )}
          >
            <span className={cn("h-2 w-2 shrink-0 rounded-full", dot)} />
            <span>{title}</span>
            <span
              className={cn(
                "tabular-nums text-xs font-semibold transition-colors",
                isActive ? "opacity-90" : "text-gray-500",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
