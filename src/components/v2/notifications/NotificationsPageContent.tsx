"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { useNotifications, useNotificationMutations } from "@/hooks/useNotifications";
import type { Notification } from "@/types/notifications";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NotificationRow } from "./NotificationRow";
import {
  NotificationsFilters,
  type StatusFilter,
  type TypeFilter,
} from "./NotificationsFilters";

const PAGE_SIZE = 10;

function filterAndSort(
  notifications: Notification[],
  searchQuery: string,
  statusFilter: StatusFilter,
  typeFilter: TypeFilter,
): Notification[] {
  const q = searchQuery.trim().toLowerCase();
  let list = notifications.filter((n) => {
    if (statusFilter === "unread" && n.isRead) return false;
    if (statusFilter === "read" && !n.isRead) return false;
    if (typeFilter !== "all" && n.source !== typeFilter) return false;
    if (q && !n.message.toLowerCase().includes(q) && !(n.title ?? "").toLowerCase().includes(q)) return false;
    return true;
  });
  list = [...list].sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return list;
}

export function NotificationsPageContent() {
  const { notifications, isLoading, isError, error, unreadCount } = useNotifications();
  const { markAllAsRead, updateReadStatus, isMarkingAllAsRead } = useNotificationMutations();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>("all");
  const [page, setPage] = React.useState(1);

  const filtered = React.useMemo(
    () => filterAndSort(notifications, searchQuery, statusFilter, typeFilter),
    [notifications, searchQuery, statusFilter, typeFilter],
  );

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const pageItems = filtered.slice(start, end);

  React.useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const handleMarkAsRead = React.useCallback(
    async (notificationId: string) => {
      try {
        await updateReadStatus({ notificationId, isRead: true });
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    },
    [updateReadStatus],
  );

  const handleMarkAllAsRead = React.useCallback(async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }, [markAllAsRead]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-medium tracking-tight text-foreground">
          Notifications
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="gap-2"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || isMarkingAllAsRead}
            aria-label="Mark all notifications as read"
          >
            {isMarkingAllAsRead ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Mark All as Read
          </Button>
        </div>
      </div>

      {/* Filters */}
      <NotificationsFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
      />

      {/* Content */}
      <div className="rounded-lg border bg-card shadow-xs">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-8 animate-spin" aria-hidden />
            <span className="sr-only">Loading notifications</span>
          </div>
        ) : isError ? (
          <div className="px-4 py-8 text-center text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load notifications."}
          </div>
        ) : pageItems.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {notifications.length === 0
              ? "No notifications"
              : "No notifications match your filters."}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-border" aria-label="Notification list">
              {pageItems.map((notification) => (
                <li key={notification._id}>
                  <NotificationRow
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                </li>
              ))}
            </ul>

            {/* Pagination */}
            <Separator className="mt-0" />
            <div className="flex flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {total === 0 ? 0 : start + 1} to {end} of {total} notification
                {total !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  Previous
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
