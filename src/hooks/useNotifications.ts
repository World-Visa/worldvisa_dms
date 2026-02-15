import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo, useRef } from "react";
import { notificationSocket } from "@/lib/notificationSocket";
import { MONITORING_CONFIG } from "@/lib/config/notifications";
import {
  getNotifications,
  createNotification,
  updateNotificationReadStatus,
  deleteNotification,
  markAllNotificationsAsRead,
} from "@/lib/api/notifications";
import type { Notification } from "@/types/notifications";

// Enhanced error handling
interface NotificationError extends Error {
  code?: string;
  status?: number;
  retryable?: boolean;
}

// Enhanced query keys with better organization
const NOTIFICATION_KEYS = {
  all: ["notifications"] as const,
  lists: () => [...NOTIFICATION_KEYS.all, "list"] as const,
  list: (filters: string) =>
    [...NOTIFICATION_KEYS.lists(), { filters }] as const,
  unreadCount: () => [...NOTIFICATION_KEYS.all, "unreadCount"] as const,
} as const;

// Performance optimization: Debounce function (currently unused)
// function useDebounce<T>(value: T, delay: number): T {
//   const [debouncedValue, setDebouncedValue] = useState<T>(value);

//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedValue(value);
//     }, delay);

//     return () => {
//       clearTimeout(handler);
//     };
//   }, [value, delay]);

//   return debouncedValue;
// }

/**
 * Enhanced hook for fetching notifications with real-time updates and performance optimizations
 */
export function useNotifications() {
  const queryClient = useQueryClient();
  const isInitialized = useRef(false);

  // Fetch notifications with enhanced error handling and retry logic
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
      try {
        const data = await getNotifications();
        isInitialized.current = true;
        return data;
      } catch (error) {
        const notificationError = error as NotificationError;
        console.error("Failed to fetch notifications:", notificationError);
        throw notificationError;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      const notificationError = error as NotificationError;
      // Don't retry on authentication errors
      if (
        notificationError.status === 401 ||
        notificationError.status === 403
      ) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Enhanced real-time listeners with better performance
  useEffect(() => {
    console.log("🔔 useNotifications: Setting up event listeners");
    console.log(
      "🔔 useNotifications: Hook is running, queryClient:",
      !!queryClient,
    );

    const unsubscribeNew = notificationSocket.onNotificationNew(
      (newNotification) => {
        console.log(
          "🔔 useNotifications: Received new notification:",
          newNotification,
        );
        console.log(
          "🔔 useNotifications: Callback function called successfully",
        );
        console.log(
          "🔔 useNotifications: Current cache before update:",
          queryClient.getQueryData(NOTIFICATION_KEYS.lists()),
        );

        queryClient.setQueryData(
          NOTIFICATION_KEYS.lists(),
          (old: Notification[] = []) => {
            console.log("🔔 useNotifications: Old cache data:", old);
            // Prevent duplicates with more efficient check
            const exists = old.some((n) => n._id === newNotification._id);
            if (exists) {
              console.log(
                "🔔 useNotifications: Notification already exists, skipping",
              );
              return old;
            }

            // Add to beginning and limit to prevent memory issues
            const updated = [newNotification, ...old];
            console.log("🔔 useNotifications: Updated cache data:", updated);
            return updated.slice(0, MONITORING_CONFIG.MAX_NOTIFICATIONS_CACHE);
          },
        );

        // Update unread count cache
        queryClient.setQueryData(
          NOTIFICATION_KEYS.unreadCount(),
          (old: number = 0) => {
            console.log(
              "🔔 useNotifications: Updating unread count from",
              old,
              "to",
              old + 1,
            );
            return old + 1;
          },
        );

        console.log(
          "🔔 useNotifications: Cache after update:",
          queryClient.getQueryData(NOTIFICATION_KEYS.lists()),
        );

        // Force invalidation to trigger re-render
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
        console.log(
          "🔔 useNotifications: Cache invalidated to trigger re-render",
        );
      },
    );

    const unsubscribeUpdated = notificationSocket.onNotificationUpdated(
      ({ _id, isRead }) => {
        queryClient.setQueryData(
          NOTIFICATION_KEYS.lists(),
          (old: Notification[] = []) => {
            return old.map((notification) =>
              notification._id === _id
                ? { ...notification, isRead }
                : notification,
            );
          },
        );

        // Update unread count cache
        queryClient.setQueryData(
          NOTIFICATION_KEYS.unreadCount(),
          (old: number = 0) => {
            const notifications =
              (queryClient.getQueryData(
                NOTIFICATION_KEYS.lists(),
              ) as Notification[]) || [];
            const notification = notifications.find(
              (n: Notification) => n._id === _id,
            );
            if (!notification) return old;

            const wasUnread = !notification.isRead;
            const isNowUnread = !isRead;

            if (wasUnread && !isNowUnread) return old - 1;
            if (!wasUnread && isNowUnread) return old + 1;
            return old;
          },
        );
      },
    );

    const unsubscribeDeleted = notificationSocket.onNotificationDeleted(
      ({ _id }) => {
        queryClient.setQueryData(
          NOTIFICATION_KEYS.lists(),
          (old: Notification[] = []) => {
            const deletedNotification = old.find((n) => n._id === _id);
            const updated = old.filter(
              (notification) => notification._id !== _id,
            );

            // Update unread count if deleted notification was unread
            if (deletedNotification && !deletedNotification.isRead) {
              queryClient.setQueryData(
                NOTIFICATION_KEYS.unreadCount(),
                (old: number = 0) => Math.max(0, old - 1),
              );
            }

            return updated;
          },
        );
      },
    );

    return () => {
      console.log("🔔 useNotifications: Cleaning up event listeners");
      console.log(
        "🔔 useNotifications: About to unsubscribe from new notifications",
      );
      unsubscribeNew();
      console.log(
        "🔔 useNotifications: About to unsubscribe from updated notifications",
      );
      unsubscribeUpdated();
      console.log(
        "🔔 useNotifications: About to unsubscribe from deleted notifications",
      );
      unsubscribeDeleted();
      console.log("🔔 useNotifications: All event listeners cleaned up");
    };
  }, [queryClient]);

  // Connect to socket when component mounts
  useEffect(() => {
    notificationSocket.connect();

    // Monitor connection state
    const unsubscribeConnection = notificationSocket.onConnectionStateChange(
      (state) => {
        // If socket connection fails, set up polling as fallback
        if (state.error && !state.isConnected) {
          // Poll for new notifications every 30 seconds as fallback
          const pollInterval = setInterval(() => {
            refetch();
          }, 30000);

          return () => clearInterval(pollInterval);
        }
      },
    );

    return () => {
      unsubscribeConnection();
      // Don't disconnect on unmount - keep connection alive
    };
  }, [refetch]);

  // Memoized unread count for better performance
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Memoized sorted notifications
  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      // Unread notifications first
      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1;
      }
      // Then by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notifications]);

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

/**
 * Enhanced hook for notification mutations with better error handling
 */
export function useNotificationMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createNotification,
    onSuccess: (newNotification) => {
      // Optimistically add to cache
      queryClient.setQueryData(
        NOTIFICATION_KEYS.lists(),
        (old: Notification[] = []) => [newNotification, ...old],
      );
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
    },
    onError: (error) => {
      console.error("Failed to create notification:", error);
    },
  });

  const updateReadStatusMutation = useMutation({
    mutationFn: updateNotificationReadStatus,
    onMutate: async ({ notificationId, isRead }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: NOTIFICATION_KEYS.lists(),
      });

      // Snapshot previous value
      const previousNotifications = queryClient.getQueryData(
        NOTIFICATION_KEYS.lists(),
      );

      // Optimistically update
      queryClient.setQueryData(
        NOTIFICATION_KEYS.lists(),
        (old: Notification[] = []) => {
          return old.map((notification) =>
            notification._id === notificationId
              ? { ...notification, isRead }
              : notification,
          );
        },
      );

      // Update unread count optimistically
      const notification = (previousNotifications as Notification[])?.find(
        (n) => n._id === notificationId,
      );
      if (notification) {
        const wasUnread = !notification.isRead;
        const isNowUnread = !isRead;

        if (wasUnread && !isNowUnread) {
          queryClient.setQueryData(
            NOTIFICATION_KEYS.unreadCount(),
            (old: number = 0) => Math.max(0, old - 1),
          );
        } else if (!wasUnread && isNowUnread) {
          queryClient.setQueryData(
            NOTIFICATION_KEYS.unreadCount(),
            (old: number = 0) => old + 1,
          );
        }
      }

      return { previousNotifications };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          NOTIFICATION_KEYS.lists(),
          context.previousNotifications,
        );
      }
      console.error("Failed to update notification read status:", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onMutate: async ({ notificationId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: NOTIFICATION_KEYS.lists(),
      });

      // Snapshot previous value
      const previousNotifications = queryClient.getQueryData(
        NOTIFICATION_KEYS.lists(),
      );

      // Find the notification being deleted
      const deletedNotification = (
        previousNotifications as Notification[]
      )?.find((n) => n._id === notificationId);

      // Optimistically remove from list
      queryClient.setQueryData(
        NOTIFICATION_KEYS.lists(),
        (old: Notification[] = []) => {
          return old.filter(
            (notification) => notification._id !== notificationId,
          );
        },
      );

      // Update unread count if deleted notification was unread
      if (deletedNotification && !deletedNotification.isRead) {
        queryClient.setQueryData(
          NOTIFICATION_KEYS.unreadCount(),
          (old: number = 0) => Math.max(0, old - 1),
        );
      }

      return { previousNotifications };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          NOTIFICATION_KEYS.lists(),
          context.previousNotifications,
        );
      }
      console.error("Failed to delete notification:", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: NOTIFICATION_KEYS.lists(),
      });

      // Snapshot previous value
      const previousNotifications = queryClient.getQueryData(
        NOTIFICATION_KEYS.lists(),
      );

      // Optimistically mark all as read
      queryClient.setQueryData(
        NOTIFICATION_KEYS.lists(),
        (old: Notification[] = []) => {
          return old.map((notification) => ({ ...notification, isRead: true }));
        },
      );

      // Reset unread count
      queryClient.setQueryData(NOTIFICATION_KEYS.unreadCount(), 0);

      return { previousNotifications };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          NOTIFICATION_KEYS.lists(),
          context.previousNotifications,
        );
      }
      console.error("Failed to mark all notifications as read:", err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() });
    },
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
    // Error states
    createError: createMutation.error,
    updateError: updateReadStatusMutation.error,
    deleteError: deleteMutation.error,
    markAllAsReadError: markAllAsReadMutation.error,
  };
}

/**
 * Enhanced hook for notification connection state with metrics
 */
export function useNotificationConnection() {
  const [connectionState, setConnectionState] = useState({
    isConnected: false,
    isConnecting: false,
    error: null as string | null,
    lastEvent: null as string | null,
  });

  const [metrics, setMetrics] = useState(notificationSocket.getMetrics());

  useEffect(() => {
    const unsubscribe = notificationSocket.onConnectionStateChange((state) => {
      setConnectionState({
        isConnected: state.isConnected,
        isConnecting: state.isConnecting,
        error: state.error,
        lastEvent: state.lastEvent,
      });
    });

    // Update metrics periodically
    const metricsInterval = setInterval(() => {
      setMetrics(notificationSocket.getMetrics());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(metricsInterval);
    };
  }, []);

  return {
    ...connectionState,
    metrics,
  };
}

/**
 * Hook for notification statistics and analytics
 */
export function useNotificationStats() {
  const { notifications, unreadCount } = useNotifications();
  const { metrics } = useNotificationConnection();

  return useMemo(() => {
    const totalNotifications = notifications.length;
    const readCount = totalNotifications - unreadCount;
    const unreadPercentage =
      totalNotifications > 0 ? (unreadCount / totalNotifications) * 100 : 0;

    // Group by type
    const byType = notifications.reduce(
      (acc, notification) => {
        acc[notification.type] = (acc[notification.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Group by category
    const byCategory = notifications.reduce(
      (acc, notification) => {
        acc[notification.category] = (acc[notification.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total: totalNotifications,
      unread: unreadCount,
      read: readCount,
      unreadPercentage: Math.round(unreadPercentage),
      byType,
      byCategory,
      connectionMetrics: metrics,
    };
  }, [notifications, unreadCount, metrics]);
}
