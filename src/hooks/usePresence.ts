"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { notificationSocket } from "@/lib/notificationSocket";
import type { AdminUsersV2Response } from "@/hooks/useAdminUsersV2";
import type { Conversation } from "@/types/chat";

export function usePresence(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    return notificationSocket.onPresenceUpdate(({ userId, online }) => {
      // Patch all admin user list cache entries (all page/filter combinations)
      queryClient.setQueriesData<AdminUsersV2Response>(
        { queryKey: ["admin-users-v2"], exact: false },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              users: old.data.users.map((u) =>
                u._id === userId ? { ...u, online_status: online } : u,
              ),
            },
          };
        },
      );

      // Patch all open conversation detail entries (ChatThread members)
      queryClient.setQueriesData<{ data: Conversation }>(
        { queryKey: ["chat", "conversation"], exact: false },
        (old) => {
          if (!old?.data.members) return old;
          return {
            ...old,
            data: {
              ...old.data,
              members: old.data.members.map((m) =>
                m.id === userId ? { ...m, online_status: online } : m,
              ),
            },
          };
        },
      );
    });
  }, [queryClient]);
}
