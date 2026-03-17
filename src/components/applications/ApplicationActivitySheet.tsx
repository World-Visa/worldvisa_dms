"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useApplicationActivity } from "@/hooks/useApplicationActivity";
import type {
  ActivityFilterGroup,
  ActivityLog,
  ActivityType,
} from "@/lib/api/getApplicationActivity";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ClipboardCheck,
  ClipboardX,
  Clock,
  Edit3,
  Eye,
  FileText,
  Inbox,
  ListChecks,
  Loader2,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  Send,
  StickyNote,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";

// ─── Filter groups ────────────────────────────────────────────────────────────

const FILTER_GROUPS: Array<{
  id: ActivityFilterGroup;
  label: string;
  types: ActivityType[];
}> = [
  { id: "all", label: "All", types: [] },
  {
    id: "documents",
    label: "Docs",
    types: [
      "document_uploaded",
      "document_reuploaded",
      "document_status_changed",
    ],
  },
  {
    id: "emails",
    label: "Emails",
    types: ["email_sent", "email_received"],
  },
  {
    id: "quality_check",
    label: "QC",
    types: ["quality_check_requested", "quality_check_removed"],
  },
  {
    id: "notes",
    label: "Notes",
    types: ["note_added", "note_updated", "note_deleted"],
  },
  {
    id: "comments",
    label: "Comments",
    types: ["comment_added", "comment_edited", "comment_deleted"],
  },
  {
    id: "reviews",
    label: "Reviews",
    types: [
      "review_requested",
      "review_status_updated",
      "review_cancelled",
      "review_message_added",
    ],
  },
  {
    id: "checklists",
    label: "Checklists",
    types: ["checklist_created", "checklist_updated", "checklist_deleted"],
  },
];

// ─── Activity style map ───────────────────────────────────────────────────────

interface ActivityStyle {
  dot: string; // tiny semantic dot — the only color element
  icon: LucideIcon;
}

const ACTIVITY_STYLE: Record<ActivityType, ActivityStyle> = {
  application_created: { dot: "bg-blue-400", icon: FileText },
  document_uploaded: { dot: "bg-amber-400", icon: Upload },
  document_reuploaded: { dot: "bg-amber-300", icon: RefreshCw },
  document_status_changed: { dot: "bg-amber-500", icon: CheckCircle },
  comment_added: { dot: "bg-sky-400", icon: MessageCircle },
  comment_edited: { dot: "bg-sky-300", icon: Edit3 },
  comment_deleted: { dot: "bg-rose-300", icon: Trash2 },
  review_requested: { dot: "bg-teal-400", icon: Eye },
  review_status_updated: { dot: "bg-teal-500", icon: CheckCircle },
  review_cancelled: { dot: "bg-teal-300", icon: XCircle },
  review_message_added: { dot: "bg-teal-400", icon: MessageSquare },
  quality_check_requested: { dot: "bg-emerald-400", icon: ClipboardCheck },
  quality_check_removed: { dot: "bg-emerald-300", icon: ClipboardX },
  checklist_created: { dot: "bg-orange-400", icon: ListChecks },
  checklist_updated: { dot: "bg-orange-300", icon: ListChecks },
  checklist_deleted: { dot: "bg-rose-300", icon: Trash2 },
  note_added: { dot: "bg-slate-400", icon: StickyNote },
  note_updated: { dot: "bg-slate-300", icon: StickyNote },
  note_deleted: { dot: "bg-rose-300", icon: Trash2 },
  email_sent: { dot: "bg-violet-400", icon: Send },
  email_received: { dot: "bg-violet-300", icon: Inbox },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return "just now";
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getCompanyLabel(category: string | null | undefined): string | null {
  if (!category) return null;
  const suffix = " Company Documents";
  if (category.endsWith(suffix)) return category.slice(0, -suffix.length).trim();
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActivityTimelineSkeleton() {
  return (
    <div className="space-y-3 pt-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="shrink-0 flex flex-col items-center">
            <Skeleton className="h-5 w-5 rounded-full mt-0.5" />
          </div>
          <div className="flex-1 rounded-lg border border-zinc-100 bg-white px-3.5 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-2.5 w-12" />
            </div>
            <Skeleton className="h-3.5 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityTimelineEmpty({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
        <Clock className="h-4 w-4 text-zinc-400" />
      </div>
      <p className="text-sm font-medium text-zinc-700">No activity found</p>
      <p className="text-xs text-zinc-400 mt-1 max-w-[200px] leading-relaxed">
        {hasFilter
          ? "No events match this filter. Try selecting a different category."
          : "No events have been recorded for this application yet."}
      </p>
    </div>
  );
}

function ActivityTimelineItem({ log }: { log: ActivityLog }) {
  const style = ACTIVITY_STYLE[log.activity_type] ?? {
    dot: "bg-zinc-400",
    icon: ChevronRight,
  };
  const IconComponent = style.icon;

  return (
    <li className="relative flex gap-3 pb-3 last:pb-0">
      {/* Timeline node — white ring with semantic color dot inside */}
      <div className="relative z-10 shrink-0 flex flex-col items-center">
        <div className="w-5 h-5 rounded-full bg-white border border-zinc-200 flex items-center justify-center mt-0.5 shadow-[0_0_0_3px_#f4f4f5]">
          <div className={cn("w-2 h-2 rounded-full", style.dot)} />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 min-w-0 rounded-lg border border-zinc-100 bg-white px-3.5 py-2.5 hover:border-zinc-200 transition-colors duration-150 mb-0.5">
        {/* Top row: actor + timestamp */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <IconComponent className="w-3 h-3 text-zinc-400 shrink-0" />
            <span className="text-xs font-medium text-zinc-800 truncate max-w-[110px]">
              {log.actor_name}
            </span>
            {log.actor_role && (
              <span className="text-xs text-zinc-400 truncate hidden sm:block">
                · {log.actor_role}
              </span>
            )}
            {log.actor_type === "client" && (
              <span className="shrink-0 text-[10px] font-medium text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                Client
              </span>
            )}
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[11px] text-zinc-400 whitespace-nowrap cursor-default shrink-0 tabular-nums">
                {formatRelativeTime(log.createdAt)}
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="left"
              className="bg-zinc-900 text-white text-xs border-0 px-2 py-1"
            >
              {formatFullDate(log.createdAt)}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Summary */}
        <p className="text-sm text-zinc-600 leading-snug">{log.summary}</p>

        {/* Company badge */}
        {(() => {
          const company = getCompanyLabel(log.document_category);
          return company ? (
            <p className="mt-1.5">
              <span className="text-[11px] text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded font-medium">
                {company}
              </span>
            </p>
          ) : null;
        })()}
      </div>
    </li>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ApplicationActivitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
}

export function ApplicationActivitySheet({
  open,
  onOpenChange,
  applicationId,
}: ApplicationActivitySheetProps) {
  const [activeFilter, setActiveFilter] = useState<ActivityFilterGroup>("all");
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setActiveFilter("all");
    }
  }, [open]);

  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useApplicationActivity(applicationId, activeFilter, 20, open);

  const allLogs = useMemo(
    () => data?.pages.flatMap((p) => p.data.logs) ?? [],
    [data],
  );

  const logs = useMemo(() => {
    if (activeFilter === "all") return allLogs;
    const group = FILTER_GROUPS.find((g) => g.id === activeFilter);
    if (!group || group.types.length === 0) return allLogs;
    return allLogs.filter((log) => group.types.includes(log.activity_type));
  }, [allLogs, activeFilter]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const totalRecords = data?.pages[0]?.data.pagination.totalRecords;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col sm:max-w-lg p-0 gap-0 overflow-hidden bg-zinc-50"
      >
        {/* Fixed header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-zinc-200 shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-100 flex items-center justify-center shrink-0">
              <Clock className="h-3.5 w-3.5 text-zinc-500" />
            </div>
            <SheetTitle className="text-sm font-semibold text-zinc-900">
              Activity Log
            </SheetTitle>
            {totalRecords !== undefined && (
              <span className="ml-auto text-xs text-zinc-400 tabular-nums">
                {totalRecords} events
              </span>
            )}
          </div>
          <SheetDescription className="text-xs text-zinc-400 mt-1">
            Full history of events for this application
          </SheetDescription>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-1 pt-2">
            {FILTER_GROUPS.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveFilter(group.id)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer",
                  activeFilter === group.id
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700",
                )}
              >
                {group.label}
              </button>
            ))}
          </div>
        </SheetHeader>

        {/* Scrollable timeline body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading && <ActivityTimelineSkeleton />}

          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center mb-3">
                <AlertCircle className="h-4 w-4 text-red-400" />
              </div>
              <p className="text-sm font-medium text-zinc-700">
                Failed to load activity
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Please close and try again.
              </p>
            </div>
          )}

          {!isLoading && !isError && logs.length === 0 && (
            <ActivityTimelineEmpty hasFilter={activeFilter !== "all"} />
          )}

          {!isLoading && !isError && logs.length > 0 && (
            <div className="relative">
              {/* Continuous vertical connector line */}
              <div className="absolute left-[9px] top-3 bottom-3 w-px bg-zinc-200" />

              <ol className="relative space-y-0">
                {logs.map((log) => (
                  <ActivityTimelineItem key={log._id} log={log} />
                ))}
              </ol>

              <div ref={sentinelRef} className="h-1" />

              {isFetchingNextPage && (
                <div className="flex items-center justify-center gap-2 py-4 text-xs text-zinc-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading more events…
                </div>
              )}

              {!hasNextPage && !isFetchingNextPage && logs.length > 0 && (
                <div className="flex items-center gap-3 py-5">
                  <div className="flex-1 h-px bg-zinc-200" />
                  <span className="text-xs text-zinc-400 whitespace-nowrap">
                    All caught up
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
