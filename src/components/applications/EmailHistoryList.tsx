"use client";

import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { Inbox, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EmailHistoryCategory, EmailThread } from "@/types/email";
import { useClientEmailList } from "@/hooks/useClientEmailHistory";

interface EmailHistoryListProps {
  clientEmail: string;
  category: EmailHistoryCategory;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-pink-500",
];

function avatarColor(from: string): string {
  let hash = 0;
  for (let i = 0; i < from.length; i++) hash = (hash * 31 + from.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function getInitials(from: string): string {
  const name = from.match(/^([^<]+)</)?.[1]?.trim() ?? from;
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function getDisplayName(from: string): string {
  return from.match(/^([^<]+)</)?.[1]?.trim() ?? from;
}

function formatShortDate(dateStr: string | null, fallback: string): string {
  const d = new Date(dateStr ?? fallback);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return format(d, "h:mm a");
  if (d.getFullYear() === now.getFullYear()) return format(d, "MMM d");
  return format(d, "MMM d, yyyy");
}

function getNavId(thread: EmailThread): string {
  return thread.thread_id ? `t-${thread.thread_id}` : `m-${thread._id}`;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-3 w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}

interface ThreadRowProps {
  thread: EmailThread;
  isSelected: boolean;
  showUnreadDot: boolean;
  onClick: () => void;
}

function ThreadRow({ thread, isSelected, showUnreadDot, onClick }: ThreadRowProps) {
  const initials = getInitials(thread.from);
  const name = getDisplayName(thread.from);
  const date = formatShortDate(thread.received_at, thread.created_at);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/3",
        isSelected && "bg-accent",
      )}
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white select-none", avatarColor(thread.from))}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {showUnreadDot && !thread.is_read && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
          )}
          <span className={cn("truncate text-sm", !thread.is_read && showUnreadDot ? "font-semibold text-gray-900 dark:text-gray-100" : "font-medium text-gray-700 dark:text-gray-300")}>
            {name}
          </span>
        </div>
        <p className="truncate text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {thread.subject}
        </p>
      </div>
      <time className="shrink-0 text-xs text-gray-400 dark:text-gray-500 tabular-nums">
        {date}
      </time>
    </button>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function EmailHistoryList({ clientEmail, category, selectedId, onSelect }: EmailHistoryListProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useClientEmailList(clientEmail, category);

  const threads = data?.pages.flatMap((p) => p.data) ?? [];
  const showUnreadDot = category === "all" || category === "received";

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <ListSkeleton />;

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-gray-400">Failed to load emails.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4">
          <Inbox className="size-5 text-gray-300 dark:text-gray-600" />
        </div>
        <p className="text-sm text-gray-400">No emails found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {threads.map((thread) => {
          const navId = getNavId(thread);
          return (
            <ThreadRow
              key={thread._id}
              thread={thread}
              isSelected={selectedId === navId}
              showUnreadDot={showUnreadDot}
              onClick={() => onSelect(navId)}
            />
          );
        })}
      </div>
      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="py-2 flex justify-center">
        {isFetchingNextPage && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        )}
      </div>
    </ScrollArea>
  );
}
