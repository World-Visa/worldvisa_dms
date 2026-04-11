"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { notificationSocket } from "@/lib/notificationSocket";
import { callLogKeys } from "@/hooks/useCallLogs";
import type { CallLog, CallLogListResponse } from "@/types/callLog";

/**
 * Subscribes to real-time call-log socket events and keeps React Query
 * cache up-to-date without a full network refetch.
 *
 * Mount once on the call-logs page. Cleans up on unmount.
 *
 *   call-log:new     → prepend to ALL cached list queries + invalidate totals
 *   call-log:updated → replace matching record in ALL cached list queries
 *                     + update the cached detail entry if it's open
 */
export function useCallLogRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubNew = notificationSocket.onCallLogNew((doc: CallLog) => {
      // Prepend to every cached call-log list
      queryClient.setQueriesData<CallLogListResponse>(
        { queryKey: callLogKeys.all(), exact: false },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            results: old.results + 1,
            pagination: {
              ...old.pagination,
              totalRecords: old.pagination.totalRecords + 1,
            },
            data: {
              callLogs: [doc, ...old.data.callLogs],
            },
          };
        },
      );
    });

    const unsubUpdated = notificationSocket.onCallLogUpdated((doc: CallLog) => {
      // Replace matching record in every cached list
      queryClient.setQueriesData<CallLogListResponse>(
        { queryKey: callLogKeys.all(), exact: false },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              callLogs: old.data.callLogs.map((log) =>
                log.call_id === doc.call_id ? doc : log,
              ),
            },
          };
        },
      );

      // Also update detail cache if this call is currently open
      queryClient.setQueryData(callLogKeys.detail(doc.call_id), {
        status: "success",
        data:   { callLog: doc },
      });
    });

    return () => {
      unsubNew();
      unsubUpdated();
    };
  }, [queryClient]);
}
