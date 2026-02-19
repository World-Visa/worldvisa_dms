"use client";

import * as React from "react";
import { Bell, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useNotifications, useNotificationMutations } from "@/hooks/useNotifications";
import type { Notification } from "@/types/notifications";
import Link from "next/link";

const DROPDOWN_LIST_SIZE = 8;

function getAvatarInitial(category: Notification["category"]): string {
  return category.charAt(0).toUpperCase();
}

function getAvatarBgClass(category: Notification["category"]): string {
  const map: Record<Notification["category"], string> = {
    general: "bg-muted",
    messages: "bg-violet-100 text-violet-700",
    documents: "bg-amber-100 text-amber-700",
    applications: "bg-sky-100 text-sky-700",
    system: "bg-slate-100 text-slate-700",
  };
  return map[category] ?? "bg-muted";
}

interface NotificationRowProps {
  notification: Notification;
  onMarkAsRead?: (notificationId: string) => void;
}

function NotificationRow({ notification, onMarkAsRead }: NotificationRowProps) {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: false,
  });

  const handleClick = React.useCallback(() => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification._id);
    }
  }, [notification._id, notification.isRead, onMarkAsRead]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors cursor-default",
        "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      <Avatar className="size-9 shrink-0">
        <AvatarFallback
          className={cn(
            "text-xs font-medium",
            getAvatarBgClass(notification.category),
          )}
        >
          {getAvatarInitial(notification.category)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p
          className={cn(
            "text-sm leading-snug cursor-pointer",
            !notification.isRead ? "font-normal text-foreground" : "text-foreground",
          )}
        >
          {notification.message}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5 shrink-0" />
          <span>{timeAgo}</span>
        </div>
      </div>
      {!notification.isRead && (
        <span
          className="mt-2 size-2 shrink-0 rounded-full bg-red-500"
          aria-hidden
        />
      )}
    </div>
  );
}

export function NotificationDropdown() {
  const [open, setOpen] = React.useState(false);
  const { notifications, isLoading, unreadCount } = useNotifications();
  const { updateReadStatus } = useNotificationMutations();

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

  const displayList = React.useMemo(
    () => notifications.slice(0, DROPDOWN_LIST_SIZE),
    [notifications],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 rounded-md"
          aria-label="Notifications"
          aria-expanded={open}
        >
          <Bell className="size-5 text-muted-foreground" strokeWidth={1.6} />
          {unreadCount > 0 && (
            <span
              className="absolute top-1 right-0 size-2 rounded-full bg-red-500"
              aria-hidden
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className={cn(
          "flex w-80 min-w-[320px] max-w-[calc(100vw-2rem)] h-[min(440px,85vh)] flex-col overflow-hidden p-0 rounded-xl border shadow-lg",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        )}
      >
        <div className="flex shrink-0 items-center justify-between px-4 pt-4 pb-2">
          <h3 className="tracking-tight text-foreground">
            Notifications
          </h3>
          <Link href="/v2/notifications" className="text-sm ">
            View all
          </Link>
        </div>
        <Separator className="shrink-0 my-0" />
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-2">
          <div className="pr-2">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : displayList.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              displayList.map((notification, index) => (
                <React.Fragment key={notification._id}>
                  <NotificationRow
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                  {index < displayList.length - 1 && (
                    <Separator className="my-0" />
                  )}
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
