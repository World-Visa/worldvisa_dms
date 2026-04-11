"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getCallLogs, getCallLogDetail } from "@/lib/api/callLogs";
import type { CallLogListFilters } from "@/types/callLog";

// ── Query keys ────────────────────────────────────────────────────────────────

export const callLogKeys = {
  all:    () => ["call-logs"]                         as const,
  list:   (filters: CallLogListFilters) => ["call-logs", "list", filters]   as const,
  detail: (callId: string)              => ["call-logs", "detail", callId]  as const,
};

// ── List hook ─────────────────────────────────────────────────────────────────

export function useCallLogs(filters: CallLogListFilters = {}) {
  return useQuery({
    queryKey:        callLogKeys.list(filters),
    queryFn:         () => getCallLogs(filters),
    staleTime:       0,                   // always re-fetch — real-time fills the gap
    gcTime:          5 * 60 * 1000,       // 5 min
    retry:           2,
    retryDelay:      (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,    // no flicker on filter / page change
  });
}

// ── Detail hook ───────────────────────────────────────────────────────────────

export function useCallLogDetail(callId: string | undefined) {
  return useQuery({
    queryKey:  callLogKeys.detail(callId ?? ""),
    queryFn:   () => getCallLogDetail(callId!),
    enabled:   Boolean(callId),
    staleTime: 30 * 1000,   // 30 s — detail is fairly stable
    gcTime:    5 * 60 * 1000,
    retry:     2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    refetchOnWindowFocus: false,
  });
}
