import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { notificationSocket } from "@/lib/notificationSocket";
import {
  getNotifications,
  createNotification,
  updateNotificationReadStatus,
  deleteNotification,
  markAllNotificationsAsRead,
} from "@/lib/api/notifications";
import type { Notification } from "@/types/notifications";

const NOTIFICATION_KEYS = {
  all: ["notifications"] as const,
  lists: () => [...NOTIFICATION_KEYS.all, "list"] as const,
  list: (filters: string) => [...NOTIFICATION_KEYS.lists(), { filters }] as const,
  unreadCount: () => [...NOTIFICATION_KEYS.all, "unreadCount"] as const,
} as const;

const MAX_CACHE = 100;

export function useNotifications() {
  const queryClient = useQueryClient();

  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
    isError,
    isFetching,
  } = useQuery({
    queryKey: NOTIFICATION_KEYS.lists(),
    queryFn: async () => {
      const data = await getNotifications();
      return data;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      const err = error as { status?: number };
      if (err.status === 401 || err.status === 403) return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  useEffect(() => {
    const unsubscribeNew = notificationSocket.onNotificationNew((newNotification) => {
      queryClient.setQueryData(NOTIFICATION_KEYS.lists(), (old: Notification[] = []) => {
        if (old.some((n) => n._id === newNotification._id)) return old;
        return [newNotification, ...old].slice(0, MAX_CACHE);
      });
      queryClient.setQueryData(NOTIFICATION_KEYS.unreadCount(), (old: number = 0) => old + 1);
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
    });

    const unsubscribeUpdated = notificationSocket.onNotificationUpdated(({ _id, isRead }) => {
      queryClient.setQueryData(NOTIFICATION_KEYS.lists(), (old: Notification[] = []) =>
        old.map((n) => (n._id === _id ? { ...n, isRead } : n)),
      );
      queryClient.setQueryData(NOTIFICATION_KEYS.unreadCount(), (old: number = 0) => {
        const notifications = (queryClient.getQueryData(NOTIFICATION_KEYS.lists()) as Notification[]) ?? [];
        const n = notifications.find((n) => n._id === _id);
        if (!n) return old;
        if (!n.isRead && isRead) return old - 1;
        if (n.isRead && !isRead) return old + 1;
        return old;
      });
    });

    const unsubscribeDeleted = notificationSocket.onNotificationDeleted(({ _id }) => {
      queryClient.setQueryData(NOTIFICATION_KEYS.lists(), (old: Notification[] = []) => {
        const deleted = old.find((n) => n._id === _id);
        if (deleted && !deleted.isRead) {
          queryClient.setQueryData(NOTIFICATION_KEYS.unreadCount(), (old: number = 0) => Math.max(0, old - 1));
        }
        return old.filter((n) => n._id !== _id);
      });
    });

    return () => {
      unsubscribeNew();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [queryClient]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return {
    notifications: sortedNotifications,
    isLoading,
    isError,
    isFetching,
    error,
    refetch,
    unreadCount,
    hasNotifications: notifications.length > 0,
  };
}

export function useNotificationMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createNotification,
    onSuccess: (newNotification) => {
      queryClient.setQueryData(NOTIFICATION_KEYS.lists(), (old: Notification[] = []) => [newNotification, ...old]);
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
    },
  });

  const updateReadStatusMutation = useMutation({
    mutationFn: updateNotificationReadStatus,
    onMutate: async ({ notificationId, isRead }) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.lists() });
      const previousNotifications = queryClient.getQueryData(NOTIFICATION_KEYS.lists());

      queryClient.setQueryData(NOTIFICATION_KEYS.lists(), (old: Notification[] = []) =>
        old.map((n) => (n._id === notificationId ? { ...n, isRead } : n)),
      );

      const notification = (previousNotifications as Notification[])?.find((n) => n._id === notificationId);
      if (notification) {
        if (!notification.isRead && isRead) {
          queryClient.setQueryData(NOTIFICATION_KEYS.unreadCount(), (old: number = 0) => Math.max(0, old - 1));
        } else if (notification.isRead && !isRead) {
          queryClient.setQueryData(NOTIFICATION_KEYS.unreadCount(), (old: number = 0) => old + 1);
        }
      }

      return { previousNotifications };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(NOTIFICATION_KEYS.lists(), context.previousNotifications);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onMutate: async ({ notificationId }) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.lists() });
      const previousNotifications = queryClient.getQueryData(NOTIFICATION_KEYS.lists());
      const deleted = (previousNotifications as Notification[])?.find((n) => n._id === notificationId);

      queryClient.setQueryData(NOTIFICATION_KEYS.lists(), (old: Notification[] = []) =>
        old.filter((n) => n._id !== notificationId),
      );

      if (deleted && !deleted.isRead) {
        queryClient.setQueryData(NOTIFICATION_KEYS.unreadCount(), (old: number = 0) => Math.max(0, old - 1));
      }

      return { previousNotifications };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(NOTIFICATION_KEYS.lists(), context.previousNotifications);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.lists() });
      const previousNotifications = queryClient.getQueryData(NOTIFICATION_KEYS.lists());

      queryClient.setQueryData(NOTIFICATION_KEYS.lists(), (old: Notification[] = []) =>
        old.map((n) => ({ ...n, isRead: true })),
      );
      queryClient.setQueryData(NOTIFICATION_KEYS.unreadCount(), 0);

      return { previousNotifications };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(NOTIFICATION_KEYS.lists(), context.previousNotifications);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() }),
  });

  return {
    createNotification: createMutation.mutateAsync,
    updateReadStatus: updateReadStatusMutation.mutateAsync,
    deleteNotification: deleteMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateReadStatusMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    createError: createMutation.error,
    updateError: updateReadStatusMutation.error,
    deleteError: deleteMutation.error,
    markAllAsReadError: markAllAsReadMutation.error,
  };
}

export function useNotificationConnection() {
  const [connectionState, setConnectionState] = useState({
    isConnected: false,
    isConnecting: false,
    error: null as string | null,
    lastEvent: null as string | null,
  });

  useEffect(() => {
    return notificationSocket.onConnectionStateChange((state) => {
      setConnectionState({
        isConnected: state.isConnected,
        isConnecting: state.isConnecting,
        error: state.error,
        lastEvent: state.lastEvent,
      });
    });
  }, []);

  return connectionState;
}
