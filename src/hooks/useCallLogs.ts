"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { getCallLogs, getCallLogDetail, updateCallNotes } from "@/lib/api/callLogs";
import type { CallLogListFilters, CallLogDetailResponse, CallLogListResponse, UpdateCallNotesPayload } from "@/types/callLog";
import { showSuccessToast } from "@/components/ui/primitives/sonner-helpers";

// ── Query keys ────────────────────────────────────────────────────────────────

export const callLogKeys = {
  all:    () => ["call-logs"]                                              as const,
  list:   (filters: CallLogListFilters) => ["call-logs", "list", filters] as const,
  detail: (callId: string)              => ["call-logs", "detail", callId] as const,
};

// ── List hook ─────────────────────────────────────────────────────────────────

export function useCallLogs(filters: CallLogListFilters = {}) {
  return useQuery({
    queryKey:        callLogKeys.list(filters),
    queryFn:         () => getCallLogs(filters),
    staleTime:       0,
    gcTime:          5 * 60 * 1000,
    retry:           2,
    retryDelay:      (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}

// ── Detail hook ───────────────────────────────────────────────────────────────

export function useCallLogDetail(callId: string | undefined) {
  return useQuery({
    queryKey:  callLogKeys.detail(callId ?? ""),
    queryFn:   () => getCallLogDetail(callId!),
    enabled:   Boolean(callId),
    staleTime: 30 * 1000,
    gcTime:    5 * 60 * 1000,
    retry:     2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    refetchOnWindowFocus: false,
  });
}

// ── Update notes/disposition mutation ────────────────────────────────────────

export function useUpdateCallNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ callId, payload }: { callId: string; payload: UpdateCallNotesPayload }) =>
      updateCallNotes(callId, payload),
    onSuccess: (res: CallLogDetailResponse) => {
      const updated = res?.data?.callLog;
      if (!updated) return;

      queryClient.setQueryData(callLogKeys.detail(updated.call_id), {
        status: "success",
        data:   { callLog: updated },
      });

      queryClient.setQueriesData<CallLogListResponse>(
        { queryKey: ["call-logs", "list"], exact: false },
        (old) => {
          if (!old?.data?.callLogs) return old;
          return {
            ...old,
            data: { callLogs: old.data.callLogs.map((l) => l.call_id === updated.call_id ? updated : l) },
          };
        },
      );
    },
  });
}
