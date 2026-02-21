"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bell, ClipboardList, FileUp, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification, NotificationSource } from "@/types/notifications";

// ─── Source meta ─────────────────────────────────────────────────────────────

export interface NotificationAction {
  label: string;
  href: string;
}

export function getNotificationAction(n: Notification): NotificationAction | null {
  switch (n.source) {
    case "document_review":
      return {
        label: "View Document",
        href: n.leadId ? `/v2/applications/${n.leadId}` : "/v2/requested-docs",
      };
    case "requested_reviews":
      return { label: "View Review", href: "/v2/requested-docs" };
    case "quality_check":
      return { label: "View QC", href: "/v2/quality-check" };
    case "requested_checklist":
      return { label: "View Checklist", href: "/v2/checklist-requests" };
    default:
      return null;
  }
}

const SOURCE_BADGE: Record<NotificationSource, string> = {
  document_review: "Document",
  requested_reviews: "Review",
  quality_check: "Quality Check",
  requested_checklist: "Checklist",
  general: "General",
};

interface SourceIconProps {
  source: NotificationSource;
  isAdminMessage: boolean;
}

function SourceIcon({ source, isAdminMessage }: SourceIconProps) {
  if (isAdminMessage || source === "requested_reviews") {
    return (
      <div className="relative size-10 shrink-0">
        <Image
          src="/avatars/1.png"
          alt="Admin"
          width={40}
          height={40}
          className="size-10 rounded-full object-cover ring-1 ring-border"
        />
      </div>
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
    <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", cls)}>
      <Icon className="size-4.5" strokeWidth={1.8} />
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export interface NotificationRowProps {
  notification: Notification;
  onMarkAsRead?: (notificationId: string) => void;
}

export function NotificationRow({ notification, onMarkAsRead }: NotificationRowProps) {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
  const action = getNotificationAction(notification);
  const isAdminMessage = notification.category === "admin message";
  const badge = SOURCE_BADGE[notification.source] ?? "General";

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
        "group flex w-full items-start gap-3.5 px-4 py-3.5 transition-colors cursor-default",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        "hover:bg-muted/40",
        !notification.isRead && "border-l-2 border-muted bg-muted/20",
        notification.isRead && "border-l-2 border-transparent",
      )}
    >
      <SourceIcon source={notification.source} isAdminMessage={isAdminMessage} />

      <div className="min-w-0 flex-1 space-y-1">
        {/* Title + time */}
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            "text-sm leading-snug",
            !notification.isRead ? "font-semibold text-foreground" : "font-medium text-foreground/80",
          )}>
            {notification.title ?? badge}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{timeAgo}</span>
        </div>

        {/* Message */}
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {notification.message}
        </p>

        {/* Badge + action */}
        <div className="flex items-center justify-between pt-0.5">
          <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
            {badge}
          </span>
          {action && (
            <Link
              href={action.href}
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-medium text-primary hover:underline focus-visible:outline-none"
            >
              {action.label} →
            </Link>
          )}
        </div>
      </div>

      {!notification.isRead && (
        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
      )}
    </div>
  );
}
