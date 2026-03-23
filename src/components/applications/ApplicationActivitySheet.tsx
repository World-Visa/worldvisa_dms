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
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardX,
  Clock,
  Edit3,
  Eye,
  FileText,
  Filter,
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
import { Button } from "../ui/button";

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
    { id: "emails", label: "Emails", types: ["email_sent", "email_received"] },
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
  icon: LucideIcon;
  label: string;
}

const ACTIVITY_STYLE: Record<ActivityType, ActivityStyle> = {
  application_created: { icon: FileText, label: "application created" },
  document_uploaded: { icon: Upload, label: "document uploaded" },
  document_reuploaded: { icon: RefreshCw, label: "document reuploaded" },
  document_status_changed: { icon: CheckCircle, label: "document status changed" },
  comment_added: { icon: MessageCircle, label: "comment added" },
  comment_edited: { icon: Edit3, label: "comment edited" },
  comment_deleted: { icon: Trash2, label: "comment deleted" },
  review_requested: { icon: Eye, label: "review requested" },
  review_status_updated: { icon: CheckCircle, label: "review status updated" },
  review_cancelled: { icon: XCircle, label: "review cancelled" },
  review_message_added: { icon: MessageSquare, label: "review message added" },
  quality_check_requested: { icon: ClipboardCheck, label: "quality check requested" },
  quality_check_removed: { icon: ClipboardX, label: "quality check removed" },
  checklist_created: { icon: ListChecks, label: "checklist item added" },
  checklist_updated: { icon: ListChecks, label: "checklist item updated" },
  checklist_deleted: { icon: Trash2, label: "checklist item deleted" },
  note_added: { icon: StickyNote, label: "note added" },
  note_updated: { icon: StickyNote, label: "note updated" },
  note_deleted: { icon: Trash2, label: "note deleted" },
  email_sent: { icon: Send, label: "email sent" },
  email_received: { icon: Inbox, label: "email received" },
};

// ─── Grouping ─────────────────────────────────────────────────────────────────

interface ActivityGroup {
  groupId: string;
  activity_type: ActivityType;
  logs: ActivityLog[];
}

function groupConsecutiveLogs(logs: ActivityLog[]): ActivityGroup[] {
  const groups: ActivityGroup[] = [];
  for (const log of logs) {
    const last = groups[groups.length - 1];
    if (last && last.activity_type === log.activity_type) {
      last.logs.push(log);
    } else {
      groups.push({
        groupId: log._id,
        activity_type: log.activity_type,
        logs: [log],
      });
    }
  }
  return groups;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSmartDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  const timeStr = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isToday) return `Today · ${timeStr}`;
  if (isYesterday) return `Yesterday · ${timeStr}`;

  const isSameYear = date.getFullYear() === now.getFullYear();
  const dateStr = date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(isSameYear ? {} : { year: "numeric" }),
  });

  return `${dateStr} · ${timeStr}`;
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
        <div key={i} className="flex gap-3.5">
          <div className="shrink-0 flex flex-col items-center">
            <Skeleton className="h-6 w-6 rounded-full mt-3.5" />
          </div>
          <div className="flex-1 rounded-2xl border border-zinc-100 bg-white px-4 py-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityTimelineEmpty({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
        <Clock className="h-4 w-4 text-zinc-400" />
      </div>
      <p className="text-sm font-semibold text-zinc-800">No activity found</p>
      <p className="text-[12px] text-zinc-400 mt-1.5 max-w-[200px] leading-relaxed">
        {hasFilter
          ? "No events match this filter. Try a different category."
          : "No events have been recorded for this application yet."}
      </p>
    </div>
  );
}

// Timeline node — uniform monochrome circle with icon
function TimelineNode({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0 border border-gray-300">
      <Icon className="w-3 h-3 text-[#222222]" strokeWidth={2} />
    </div>
  );
}

// Single log card
function ActivityLogCard({
  log,
  compact = false,
}: {
  log: ActivityLog;
  compact?: boolean;
}) {
  const company = getCompanyLabel(log.document_category);

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-zinc-100 transition-all duration-200 hover:border-zinc-200 ",
        compact ? "px-3.5 py-3" : "px-4 py-3.5",
      )}
    >
      {/* Actor + timestamp */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Actor avatar initials */}
          {/* <div className="w-5 h-5 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
            <span className="text-[9px] font-bold text-zinc-600 uppercase leading-none">
              {log.actor_name.slice(0, 2)}
            </span>
          </div> */}
          <span className="text-[12.5px] capitalize font-semibold text-[#222222] truncate max-w-[130px]">
            {log.actor_name}
          </span>
          {log.actor_role && (
            <span className="text-[11px] text-zinc-400 truncate hidden sm:block">
              {log.actor_role}
            </span>
          )}
          {log.actor_type === "client" && (
            <span className="shrink-0 text-[9.5px] font-semibold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded-full tracking-wide uppercase">
              Client
            </span>
          )}
        </div>

        <span className="text-[11px] text-zinc-400 whitespace-nowrap shrink-0 tabular-nums">
          {formatSmartDate(log.createdAt)}
        </span>
      </div>

      {/* Summary */}
      <p
        className={cn(
          "text-zinc-600 leading-relaxed",
          compact ? "text-[12px]" : "text-[13px]",
        )}
      >
        {log.summary}
      </p>

      {/* Company badge */}
      {company && (
        <div className="mt-2.5">
          <span className="text-[10.5px] text-zinc-500 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-full font-medium">
            {company}
          </span>
        </div>
      )}
    </div>
  );
}

// Grouped item — collapsible when count > 1
function ActivityGroupItem({ group }: { group: ActivityGroup }) {
  const [expanded, setExpanded] = useState(false);
  const style = ACTIVITY_STYLE[group.activity_type] ?? {
    icon: ChevronRight,
    label: "event",
  };
  const count = group.logs.length;
  const isGrouped = count > 1;

  // Single item
  if (!isGrouped) {
    return (
      <li className="relative flex gap-3.5 pb-3 last:pb-0">
        <div className="relative z-10 shrink-0 flex flex-col items-center pt-[14px]">
          <TimelineNode icon={style.icon} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <ActivityLogCard log={group.logs[0]} />
        </div>
      </li>
    );
  }

  // Grouped variant — logs[0] is newest, logs[count-1] is oldest
  const newestLog = group.logs[0];
  const oldestLog = group.logs[count - 1];

  return (
    <li className="relative flex gap-3.5 pb-3 last:pb-0">
      <div className="relative z-10 shrink-0 flex flex-col items-center pt-[14px]">
        <TimelineNode icon={style.icon} />
      </div>

      <div className="flex-1 min-w-0 pt-0.5 space-y-2">
        {/* Group header card */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full text-left bg-white rounded-xl border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-200 px-4 py-3.5 cursor-pointer"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {/* Count pill */}
              <span className="shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-zinc-900 text-white text-[10px] font-bold tabular-nums">
                {count}
              </span>
              <span className="text-[12.5px] font-semibold text-zinc-900">
                {style.label}s
              </span>
              <span className="text-[11.5px] text-zinc-400 hidden sm:block truncate">
                · {newestLog.actor_name}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-zinc-400 whitespace-nowrap tabular-nums">
                {formatSmartDate(oldestLog.createdAt)}
              </span>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-zinc-400 transition-transform duration-300",
                  expanded && "rotate-180",
                )}
              />
            </div>
          </div>

          {!expanded && (
            <p className="mt-1.5 text-[12px] text-zinc-400 leading-relaxed line-clamp-1">
              {newestLog.summary}
              {count > 1 && (
                <span className="text-zinc-300"> +{count - 1} more</span>
              )}
            </p>
          )}
        </button>

        {/* Expanded children */}
        {expanded && (
          <div className="space-y-2 pl-5 border-l border-gray-300 ml-3">
            {group.logs.map((log) => (
              <ActivityLogCard key={log._id} log={log} compact />
            ))}
          </div>
        )}
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
  const [showFilters, setShowFilters] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setActiveFilter("all");
      setShowFilters(false);
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

  const groups = useMemo(() => groupConsecutiveLogs(logs), [logs]);

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
        <SheetHeader className="px-4 border-b border-zinc-100 shrink-0 bg-white">
          {/* Title row */}
          <SheetTitle className="text-xl font-semibold text-[#222222] tracking-tight">
            Activity Log
          </SheetTitle>
          <SheetDescription className="text-sm text-gray-400 leading-relaxed">
            Full history of events for this application
          </SheetDescription>

          {/* Filter toggle + underline tabs */}
          <div className="pt-3">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowFilters((prev) => !prev)}
                aria-expanded={showFilters}
                className="text-sm font-medium text-gray-700 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Filter className="w-4 h-4 mr-1" />
                {showFilters ? "Hide filters" : "Filters"}
              </Button>
            </div>

            <div
              className={cn(
                "border-b border-gray-200 overflow-x-auto scrollbar-hide transition-all duration-300 ease-out",
                showFilters
                  ? "mt-2 max-h-16 opacity-100 translate-y-0"
                  : "max-h-0 opacity-0 -translate-y-1 pointer-events-none",
              )}
            >
              <div className="flex items-end gap-0 min-w-max">
                {FILTER_GROUPS.map((group, index) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setActiveFilter(group.id)}
                    style={{
                      transitionDelay: showFilters ? `${index * 45}ms` : "0ms",
                    }}
                    className={cn(
                      "relative -mb-px border-b-2 px-3 py-2 text-sm transition-all duration-300 whitespace-nowrap cursor-pointer",
                      showFilters
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-1",
                      activeFilter === group.id
                        ? "border-gray-900 text-gray-900 font-semibold"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium",
                    )}
                  >
                    {group.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable timeline body */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          {isLoading && <ActivityTimelineSkeleton />}

          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                <AlertCircle className="h-4 w-4 text-zinc-400" />
              </div>
              <p className="text-sm font-semibold text-zinc-800">
                Failed to load activity
              </p>
              <p className="text-[12px] text-zinc-400 mt-1.5">
                Please close and try again.
              </p>
            </div>
          )}

          {!isLoading && !isError && logs.length === 0 && (
            <ActivityTimelineEmpty hasFilter={activeFilter !== "all"} />
          )}

          {!isLoading && !isError && groups.length > 0 && (
            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-[11px] top-[26px] bottom-6 w-px bg-gray-200" />

              <ol className="relative space-y-0">
                {groups.map((group) => (
                  <ActivityGroupItem key={group.groupId} group={group} />
                ))}
              </ol>

              <div ref={sentinelRef} className="h-1" />

              {isFetchingNextPage && (
                <div className="flex items-center justify-center gap-2 py-5 text-[11.5px] text-zinc-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading more…
                </div>
              )}

              {!hasNextPage && !isFetchingNextPage && logs.length > 0 && (
                <div className="flex items-center gap-3 py-6">
                  <div className="flex-1 h-px bg-zinc-200" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-zinc-300" />
                    <span className="text-[11px] text-zinc-400 font-medium">
                      All caught up
                    </span>
                    <div className="w-1 h-1 rounded-full bg-zinc-300" />
                  </div>
                  <div className="flex-1 h-px bg-zinc-200" />
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
