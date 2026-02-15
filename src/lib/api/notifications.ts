import { fetcher } from "@/lib/fetcher";
import {
  NOTIFICATION_API_BASE_URL,
  NOTIFICATION_ENDPOINTS,
} from "@/lib/config/notifications";
import type {
  Notification,
  NotificationCreateRequest,
  NotificationUpdateRequest,
  NotificationDeleteRequest,
  NotificationApiResponse,
} from "@/types/notifications";

/**
 * Get all notifications for the current user
 */
export async function getNotifications(): Promise<Notification[]> {
  const response = await fetcher<NotificationApiResponse<Notification[]>>(
    `${NOTIFICATION_API_BASE_URL}${NOTIFICATION_ENDPOINTS.LIST}`,
  );

  return response.data || [];
}

/**
 * Create a new notification
 */
export async function createNotification(
  notification: NotificationCreateRequest,
): Promise<Notification> {
  const response = await fetcher<NotificationApiResponse<Notification>>(
    `${NOTIFICATION_API_BASE_URL}${NOTIFICATION_ENDPOINTS.CREATE}`,
    {
      method: "POST",
      body: JSON.stringify(notification),
    },
  );

  if (!response.data) {
    throw new Error(response.message || "Failed to create notification");
  }

  return response.data;
}

/**
 * Mark notification as read/unread
 */
export async function updateNotificationReadStatus(
  request: NotificationUpdateRequest,
): Promise<Notification> {
  const response = await fetcher<NotificationApiResponse<Notification>>(
    `${NOTIFICATION_API_BASE_URL}${NOTIFICATION_ENDPOINTS.UPDATE_READ_STATUS}`,
    {
      method: "PUT",
      body: JSON.stringify(request),
    },
  );

  if (!response.data) {
    throw new Error(response.message || "Failed to update notification");
  }

  return response.data;
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  request: NotificationDeleteRequest,
): Promise<void> {
  await fetcher<NotificationApiResponse<void>>(
    `${NOTIFICATION_API_BASE_URL}${NOTIFICATION_ENDPOINTS.DELETE}`,
    {
      method: "DELETE",
      body: JSON.stringify(request),
    },
  );
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  // This would need to be implemented on the backend
  // For now, we'll mark them individually
  const notifications = await getNotifications();
  const unreadNotifications = notifications.filter((n) => !n.isRead);

  await Promise.allSettled(
    unreadNotifications.map((notification) =>
      updateNotificationReadStatus({
        notificationId: notification._id,
        isRead: true,
      }),
    ),
  );
}
