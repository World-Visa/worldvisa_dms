"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ClipboardList, FileUp, ShieldCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useNotifications, useNotificationMutations } from "@/hooks/useNotifications";
import { getNotificationAction } from "@/components/v2/notifications/NotificationRow";
import type { Notification, NotificationSource } from "@/types/notifications";

const DROPDOWN_LIST_SIZE = 8;

const SOURCE_BADGE: Record<NotificationSource, string> = {
  document_review: "Document",
  requested_reviews: "Review",
  quality_check: "Quality Check",
  requested_checklist: "Checklist",
  general: "General",
};

function DropdownIcon({
  source,
  isAdminMessage,
}: {
  source: NotificationSource;
  isAdminMessage: boolean;
}) {
  if (isAdminMessage || source === "requested_reviews") {
    return (
      <Image
        src="/avatars/1.png"
        alt="Admin"
        width={36}
        height={36}
        className="size-9 shrink-0 rounded-full object-cover ring-1 ring-border"
      />
    );
  }

  const map: Record<NotificationSource, { Icon: React.ElementType; cls: string }> = {
    document_review: { Icon: FileUp, cls: "bg-amber-50 text-amber-600 ring-1 ring-amber-200" },
    requested_reviews: { Icon: FileUp, cls: "bg-violet-50 text-violet-600 ring-1 ring-violet-200" },
    quality_check: { Icon: ShieldCheck, cls: "bg-sky-50 text-sky-600 ring-1 ring-sky-200" },
    requested_checklist: { Icon: ClipboardList, cls: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200" },
    general: { Icon: Bell, cls: "bg-slate-50 text-slate-500 ring-1 ring-slate-200" },
  };

  const { Icon, cls } = map[source] ?? map.general;

  return (
    <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", cls)}>
      <Icon className="size-4" strokeWidth={1.8} />
    </div>
  );
}

interface DropdownRowProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onClose: () => void;
}

function DropdownRow({ notification, onMarkAsRead, onClose }: DropdownRowProps) {
  const router = useRouter();
  const action = getNotificationAction(notification);
  const isAdminMessage = notification.category === "admin message";
  const badge = SOURCE_BADGE[notification.source] ?? "General";
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: false });

  const handleRowClick = React.useCallback(() => {
    if (!notification.isRead) onMarkAsRead(notification._id);
  }, [notification._id, notification.isRead, onMarkAsRead]);

  const handleAction = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!notification.isRead) onMarkAsRead(notification._id);
      onClose();
      if (action) router.push(action.href);
    },
    [action, notification._id, notification.isRead, onMarkAsRead, onClose, router],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleRowClick();
        }
      }}
      className={cn(
        "flex w-full items-start gap-3 px-3 py-2.5 transition-colors cursor-default",
        "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        !notification.isRead && "border-l-2 border-muted bg-muted/20",
        notification.isRead && "border-l-2 border-transparent",
      )}
    >
      <DropdownIcon source={notification.source} isAdminMessage={isAdminMessage} />

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-start justify-between gap-1.5">
          <p
            className={cn(
              "text-xs leading-snug",
              !notification.isRead
                ? "font-semibold text-foreground"
                : "font-medium text-foreground/80",
            )}
          >
            {notification.title ?? badge}
          </p>
          <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
            {timeAgo}
          </span>
        </div>

        <p className="line-clamp-1 text-[11px] leading-relaxed text-muted-foreground">
          {notification.message}
        </p>

        {action && (
          <button
            type="button"
            onClick={handleAction}
            className="text-[11px] font-medium text-primary hover:underline focus-visible:outline-none"
          >
            {action.label} →
          </button>
        )}
      </div>

      {!notification.isRead && (
        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
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
      } catch {
        // silently fail — optimistic update already applied
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
              className="absolute top-1 right-0.5 size-2 rounded-full bg-red-500"
              aria-hidden
            />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className={cn(
          "flex w-80 min-w-[320px] max-w-[calc(100vw-2rem)] h-[min(460px,85vh)] flex-col overflow-hidden p-0 rounded-xl border shadow-lg",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-4 pt-3.5 pb-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <Link
            href="/v2/notifications"
            onClick={() => setOpen(false)}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
          </Link>
        </div>

        <Separator className="shrink-0" />

        {/* List */}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              Loading…
            </div>
          ) : displayList.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10">
              <Bell className="size-8 text-muted-foreground/40" strokeWidth={1.4} />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {displayList.map((notification) => (
                <DropdownRow
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onClose={() => setOpen(false)}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
