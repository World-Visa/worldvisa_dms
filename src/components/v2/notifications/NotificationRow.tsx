"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { FileText, MessageCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/notifications";
import Link from "next/link";

const CATEGORY_DISPLAY: Record<
  Notification["category"],
  { label: string; icon: React.ElementType; bgClass: string }
> = {
  applications: {
    label: "Ticket",
    icon: FileText,
    bgClass: "bg-sky-100 text-sky-700",
  },
  messages: {
    label: "Message",
    icon: MessageCircle,
    bgClass: "bg-emerald-100 text-emerald-700",
  },
  documents: {
    label: "Document",
    icon: FileText,
    bgClass: "bg-amber-100 text-amber-700",
  },
  system: {
    label: "Team",
    icon: Users,
    bgClass: "bg-violet-100 text-violet-700",
  },
  general: {
    label: "Team",
    icon: Users,
    bgClass: "bg-slate-100 text-slate-700",
  },
};

const DEFAULT_CATEGORY_META = CATEGORY_DISPLAY.general;

function getCategoryMeta(category: Notification["category"] | undefined) {
  if (category && category in CATEGORY_DISPLAY) {
    return CATEGORY_DISPLAY[category];
  }
  return DEFAULT_CATEGORY_META;
}

export interface NotificationRowProps {
  notification: Notification;
  onMarkAsRead?: (notificationId: string) => void;
}

export function NotificationRow({ notification, onMarkAsRead }: NotificationRowProps) {
  const meta = getCategoryMeta(notification.category);
  const Icon = meta.icon;
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  const handleClick = React.useCallback(() => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification._id);
    }
  }, [notification._id, notification.isRead, onMarkAsRead]);

  const content = (
    <>
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          meta.bgClass,
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p
          className={cn(
            "text-sm leading-snug",
            !notification.isRead ? "font-semibold text-foreground" : "font-medium text-foreground",
          )}
        >
          {notification.message}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
        <span className="text-xs text-muted-foreground">{meta.label}</span>
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
        {notification.link && (
          <Link
            href={notification.link}
            className="mt-1 text-xs font-medium text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            View
          </Link>
        )}
      </div>
    </>
  );

  const rowClassName = cn(
    "flex w-full items-start gap-4 rounded-lg px-4 py-3 transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    !notification.isRead ? "bg-amber-50/80 dark:bg-amber-950/20" : "bg-background",
  );

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
      className={cn(rowClassName, "cursor-default hover:bg-muted/50")}
    >
      {content}
    </div>
  );
}
