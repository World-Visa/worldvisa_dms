import { memo, useCallback, useEffect, useState, useMemo } from "react";
import { Check, X, Bell, Loader2 } from "lucide-react";
import {
  useNotifications,
  useNotificationMutations,
} from "@/hooks/useNotifications";
import { useNotificationStore } from "@/store/notificationStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationItem } from "./NotificationItem";

export const NotificationPanel = memo(() => {
  const { notifications, isLoading, unreadCount } = useNotifications();

  const { updateReadStatus, deleteNotification, markAllAsRead } =
    useNotificationMutations();

  const { isNotificationPanelOpen, closeNotificationPanel, isNavigating } =
    useNotificationStore();

  // Tab state
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isNotificationPanelOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isNotificationPanelOpen]);

  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await updateReadStatus({ notificationId, isRead: true });
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    },
    [updateReadStatus]
  );

  const handleDelete = useCallback(
    async (notificationId: string) => {
      try {
        await deleteNotification({ notificationId });
      } catch (error) {
        console.error("Failed to delete notification:", error);
      }
    },
    [deleteNotification]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, [markAllAsRead]);

  // Memoized filtered notifications for better performance
  const filteredNotifications = useMemo(() => {
    return activeTab === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;
  }, [notifications, activeTab]);

  // Memoized unread count check
  const hasUnreadNotifications = useMemo(() => {
    return notifications.some((n) => !n.isRead);
  }, [notifications]);

  if (!isNotificationPanelOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={closeNotificationPanel}
        onWheel={(e) => {
          e.preventDefault();
        }}
      />

      {/* Notification Panel */}
      <Card
        className="fixed right-4 top-16 z-50 w-[420px] max-h-[85vh] shadow-2xl border-0 bg-white rounded-lg"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => {
          e.stopPropagation();
        }}
      >
        <CardHeader className="px-4 border-b border-gray-200 bg-white">
          {/* Header with title and actions */}
          <div className="flex items-center justify-between mb-1">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Notifications
            </CardTitle>
            <div className="flex items-center space-x-1">
              {hasUnreadNotifications && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs cursor-pointer h-7 px-2 text-gray-600 hover:text-green-600 hover:bg-green-50"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={closeNotificationPanel}
                className="h-7 w-7 cursor-pointer text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab("unread")}
                className={`px-3 py-1.5 cursor-pointer text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === "unread"
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Unread {unreadCount}
              </button>
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 cursor-pointer text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === "all"
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                All {notifications.length}
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 bg-white flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mb-4"></div>
              <p className="text-gray-500 text-sm">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="rounded-full bg-gray-100 p-6 mb-4">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-base mb-2 text-gray-900">
                {activeTab === "unread"
                  ? "No unread notifications"
                  : "No notifications yet"}
              </h3>
              <p className="text-gray-500 text-sm max-w-xs">
                {activeTab === "unread"
                  ? "All caught up! No unread notifications."
                  : "You'll see new notifications here when they arrive"}
              </p>
            </div>
          ) : (
            <div className="max-h-[calc(85vh-160px)] overflow-y-auto">
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))}
                {/* Add padding at the bottom to ensure last item is fully visible */}
                <div className="h-4"></div>
              </div>
            </div>
          )}
        </CardContent>

        {/* Navigation Loading Overlay */}
        {isNavigating && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600 font-medium">
                Navigating to application...
              </p>
            </div>
          </div>
        )}
      </Card>
    </>
  );
});

NotificationPanel.displayName = "NotificationPanel";
