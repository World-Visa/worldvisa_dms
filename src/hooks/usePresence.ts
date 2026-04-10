"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { notificationSocket } from "@/lib/notificationSocket";
import type { AdminUsersV2Response } from "@/hooks/useAdminUsersV2";
import type { Conversation } from "@/types/chat";

export function usePresence(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    // ── presence:update — single user status change ──────────────────────────
    const unsubUpdate = notificationSocket.onPresenceUpdate(({ userId, status, lastSeen }) => {
      const isOnline = status !== 'offline';

      queryClient.setQueriesData<AdminUsersV2Response>(
        { queryKey: ["admin-users-v2"], exact: false },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              users: old.data.users.map((u) =>
                u._id === userId
                  ? { ...u, online_status: isOnline, presence_status: status, lastSeen }
                  : u,
              ),
            },
          };
        },
      );

      queryClient.setQueriesData<{ data: Conversation }>(
        { queryKey: ["chat", "conversation"], exact: false },
        (old) => {
          if (!old?.data.members) return old;
          return {
            ...old,
            data: {
              ...old.data,
              members: old.data.members.map((m) =>
                m.id === userId
                  ? { ...m, online_status: isOnline, presence_status: status, lastSeen }
                  : m,
              ),
            },
          };
        },
      );
    });

    // ── presence:snapshot — bulk initial state after subscribe ───────────────
    const unsubSnapshot = notificationSocket.onPresenceSnapshot(({ presences }) => {
      queryClient.setQueriesData<AdminUsersV2Response>(
        { queryKey: ["admin-users-v2"], exact: false },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              users: old.data.users.map((u) => {
                const p = presences[u._id];
                if (!p) return u;
                return {
                  ...u,
                  online_status: p.status !== 'offline',
                  presence_status: p.status,
                  lastSeen: p.lastSeen,
                };
              }),
            },
          };
        },
      );

      queryClient.setQueriesData<{ data: Conversation }>(
        { queryKey: ["chat", "conversation"], exact: false },
        (old) => {
          if (!old?.data.members) return old;
          return {
            ...old,
            data: {
              ...old.data,
              members: old.data.members.map((m) => {
                const p = presences[m.id];
                if (!p) return m;
                return {
                  ...m,
                  online_status: p.status !== 'offline',
                  presence_status: p.status,
                  lastSeen: p.lastSeen,
                };
              }),
            },
          };
        },
      );
    });

    return () => {
      unsubUpdate();
      unsubSnapshot();
    };
  }, [queryClient]);
}
