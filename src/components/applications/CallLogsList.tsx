"use client";

import { useEffect, useMemo, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives/skeleton";
import { cn } from "@/lib/utils";
import type { CallDirection, CallLog } from "@/types/callLog";
import { useInfiniteCallLogs } from "@/hooks/useInfiniteCallLogs";
import { CallListBlank } from "@/components/call-logs/call-list-blank";
import { StatusBadge, StatusBadgeIcon } from "@/components/ui/primitives/status-badge";
import { CALL_DIRECTION_BADGE, CALL_STATUS_BADGE, CALL_STATUS_FALLBACK } from "@/lib/constants/callLogs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/primitives/avatar";
import { getInitials } from "@/lib/constants/users";
import { PhoneIncoming } from "@/components/icons/phone-incoming";
import { PhoneOutgoing } from "@/components/icons/phone-outgoing";

type CallLogsCategory = "all" | CallDirection;

interface CallLogsListProps {
  q: string;
  direction: CallLogsCategory;
  selectedCallId: string | null;
  onSelect: (log: CallLog) => void;
  limit?: number;
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return d.toLocaleString("en-IN", sameDay ? { hour: "2-digit", minute: "2-digit", hour12: true } : { day: "2-digit", month: "short" });
}

function ListSkeleton() {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-3 w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function CallRow({ log, isSelected, onClick }: { log: CallLog; isSelected: boolean; onClick: () => void }) {
  const clientName = log.client_name ?? log.customer_phone;
  const statusCfg = CALL_STATUS_BADGE[log.status] ?? CALL_STATUS_FALLBACK;
  const dirCfg = CALL_DIRECTION_BADGE[log.direction];
  const DirectionIcon = log.direction === "inbound" ? PhoneIncoming : PhoneOutgoing;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/3",
        isSelected && "bg-accent",
      )}
    >
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={log.client_image_url ?? undefined} alt={clientName} />
        <AvatarFallback className="text-[11px] font-semibold">{getInitials(clientName)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-200 capitalize">
            {clientName}
          </span>
        </div>
        <p className="truncate text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {log.customer_phone}
        </p>
      </div>

      <div className="shrink-0 flex flex-col items-end gap-1">
        <time className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
          {formatShortDate(log.start_time)}
        </time>
        <div className="flex items-center gap-1.5">
          <StatusBadge variant="light">
            <DirectionIcon className="-mx-0.5 size-3.5" />
            {dirCfg.label}
          </StatusBadge>
          <StatusBadge variant="light" status={statusCfg.status}>
            <StatusBadgeIcon as={statusCfg.icon} />
            {statusCfg.label}
          </StatusBadge>
        </div>
      </div>
    </button>
  );
}

export function CallLogsList({ q, direction, selectedCallId, onSelect, limit = 10 }: CallLogsListProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const queryDirection = direction === "all" ? undefined : direction;
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useInfiniteCallLogs({
      q,
      direction: queryDirection,
      limit,
    });

  const callLogs = useMemo(() => data?.pages.flatMap((p) => p.data.callLogs) ?? [], [data]);

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
        <p className="text-sm text-gray-400">Failed to load call logs.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  if (callLogs.length === 0) {
    return (
      <CallListBlank
        title="No call logs found"
        description="Try switching to Incoming/Outgoing, or check the full call logs page."
        actionHref="/v2/call-logs"
        actionLabel="Open Call Logs"
      />
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {callLogs.map((log) => (
          <CallRow
            key={log._id}
            log={log}
            isSelected={selectedCallId === log.call_id}
            onClick={() => onSelect(log)}
          />
        ))}
      </div>

      <div ref={sentinelRef} className="py-2 flex justify-center">
        {isFetchingNextPage && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        )}
      </div>
    </ScrollArea>
  );
}

