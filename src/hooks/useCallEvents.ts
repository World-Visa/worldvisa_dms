"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { showNotificationToast } from "@/components/ui/primitives/sonner-helpers";
import { notificationSocket } from "@/lib/notificationSocket";
import { callLogKeys } from "@/hooks/useCallLogs";
import { useLayoutStore } from "@/store/layoutStore";
import { useCallDispositionStore } from "@/store/callDispositionStore";
import type { CallLog, CallLogListResponse } from "@/types/callLog";

export function useCallEvents() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // ── Broadcast: keep call-log list cache up to date for all staff ──────────
    const unsubNew = notificationSocket.onCallLogNew((doc: CallLog) => {
      queryClient.setQueriesData<CallLogListResponse>(
        { queryKey: callLogKeys.all(), exact: false },
        (old) => {
          if (!old?.data?.callLogs) return old;
          return {
            ...old,
            results: old.results + 1,
            pagination: {
              ...old.pagination,
              totalRecords: old.pagination.totalRecords + 1,
            },
            data: { callLogs: [doc, ...old.data.callLogs] },
          };
        },
      );
    });

    const unsubUpdated = notificationSocket.onCallLogUpdated((doc: CallLog) => {
      queryClient.setQueriesData<CallLogListResponse>(
        { queryKey: callLogKeys.all(), exact: false },
        (old) => {
          if (!old?.data?.callLogs) return old;
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
      queryClient.setQueryData(callLogKeys.detail(doc.call_id), {
        status: "success",
        data:   { callLog: doc },
      });
    });

    // ── Targeted: action triggers for the specific agent only ─────────────────
    const unsubInbound = notificationSocket.onCallInbound((doc: CallLog) => {
      useLayoutStore.getState().openPhonePanel();
      if (doc.direction === "inbound") {
        const caller = doc.client_name ?? doc.customer_phone ?? "Unknown";
        showNotificationToast("Incoming call", `From: ${caller}`, undefined, { duration: 30_000 });
      }
    });

    const unsubHangup = notificationSocket.onCallHangup((doc: CallLog) => {
      useCallDispositionStore.getState().openDispositionModal(doc);
    });

    return () => {
      unsubNew();
      unsubUpdated();
      unsubInbound();
      unsubHangup();
    };
  }, [queryClient]);
}
