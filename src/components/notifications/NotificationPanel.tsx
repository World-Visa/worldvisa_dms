"use client";

import { memo, useCallback, useState, useMemo } from "react";
import { Check, Bell, Loader2 } from "lucide-react";
import {
  useNotifications,
  useNotificationMutations,
} from "@/hooks/useNotifications";
import { useNotificationStore } from "@/store/notificationStore";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { NotificationItem } from "./NotificationItem";
import { cn } from "@/lib/utils";

export const NotificationPanel = memo(() => {
  const { notifications, isLoading, unreadCount } = useNotifications();
  const { updateReadStatus, deleteNotification, markAllAsRead } =
    useNotificationMutations();
  const { isNavigating } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<"unread" | "all">("all");

  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await updateReadStatus({ notificationId, isRead: true });
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    },
    [updateReadStatus],
  );

  const handleDelete = useCallback(
    async (notificationId: string) => {
      try {
        await deleteNotification({ notificationId });
      } catch (error) {
        console.error("Failed to delete notification:", error);
      }
    },
    [deleteNotification],
  );

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, [markAllAsRead]);

  const filteredNotifications = useMemo(() => {
    return activeTab === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;
  }, [notifications, activeTab]);

  const hasUnread = useMemo(
    () => notifications.some((n) => !n.isRead),
    [notifications],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <SheetHeader className="space-y-0 border-b border-gray-200 px-5 pb-0 pt-5">
        <div className="flex items-center justify-between mb-4">
          <SheetTitle className="text-base font-semibold tracking-tight text-gray-900">
            Notifications
          </SheetTitle>
          <SheetDescription className="sr-only">
            View and manage your notifications
          </SheetDescription>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-7 cursor-pointer gap-1.5 px-2.5 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            >
              <Check className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Segmented tabs */}
        <div className="flex">
          <button
            type="button"
            onClick={() => setActiveTab("unread")}
            className={cn(
              "relative cursor-pointer px-3 pb-2.5 text-sm font-medium transition-colors",
              activeTab === "unread"
                ? "text-gray-900"
                : "text-gray-400 hover:text-gray-600",
            )}
          >
            Unread
            {unreadCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-900 px-1.5 text-[10px] font-semibold text-white tabular-nums">
                {unreadCount}
              </span>
            )}
            {activeTab === "unread" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "relative cursor-pointer px-3 pb-2.5 text-sm font-medium transition-colors",
              activeTab === "all"
                ? "text-gray-900"
                : "text-gray-400 hover:text-gray-600",
            )}
          >
            All
            <span className="ml-1.5 text-xs text-gray-400 tabular-nums">
              {notifications.length}
            </span>
            {activeTab === "all" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 rounded-full" />
            )}
          </button>
        </div>
      </SheetHeader>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="flex items-start gap-3 px-5 py-3.5">
                <Skeleton className="h-2 w-2 rounded-full mt-1.5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4">
              <Bell className="h-6 w-6 text-gray-400" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-gray-900">
              {activeTab === "unread" ? "All caught up" : "No notifications"}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {activeTab === "unread"
                ? "You have no unread notifications."
                : "Notifications will appear here when they arrive."}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div>
              {filteredNotifications.map((notification, index) => (
                <div key={notification._id}>
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                  {index < filteredNotifications.length - 1 && (
                    <Separator className="mx-5" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Navigation loading overlay */}
      {isNavigating && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-gray-900" />
            <p className="text-xs font-medium text-gray-500">Navigating...</p>
          </div>
        </div>
      )}
    </div>
  );
});

NotificationPanel.displayName = "NotificationPanel";
