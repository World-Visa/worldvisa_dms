"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { notificationSocket } from "@/lib/notificationSocket";
import { useNotificationStore } from "@/store/notificationStore";
import { getNotificationAction } from "@/components/v2/notifications/NotificationRow";
import type { NotificationNewEvent } from "@/types/notifications";

// Cast socket event to Notification-compatible shape for getNotificationAction
function getActionFromEvent(event: NotificationNewEvent) {
  return getNotificationAction({
    ...event,
    user: "",
    // getNotificationAction only reads source, leadId — safe cast
  } as Parameters<typeof getNotificationAction>[0]);
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { desktopNotificationsEnabled, soundEnabled } = useNotificationStore();

  // Connect / disconnect socket on auth change
  useEffect(() => {
    if (isAuthenticated) {
      notificationSocket.connect();

      if (desktopNotificationsEnabled && "Notification" in window) {
        Notification.requestPermission();
      }
    } else {
      notificationSocket.disconnect();
    }
  }, [isAuthenticated, desktopNotificationsEnabled]);

  // Real-time Sonner toast on new notification
  useEffect(() => {
    const unsubscribe = notificationSocket.onNotificationNew((notification) => {
      const action = getActionFromEvent(notification);
      toast(notification.title ?? "New notification", {
        description: notification.message,
        duration: 6000,
        action: action
          ? {
              label: action.label,
              onClick: () => router.push(action.href),
            }
          : undefined,
      });
    });

    return unsubscribe;
  }, [router]);

  // Desktop (browser) notifications
  useEffect(() => {
    if (!desktopNotificationsEnabled || !("Notification" in window)) return;

    const unsubscribe = notificationSocket.onNotificationNew((notification) => {
      if (Notification.permission === "granted") {
        const instance = new Notification(notification.title ?? notification.message, {
          body: notification.title ? notification.message : undefined,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: notification._id,
        });

        instance.onclick = () => {
          window.focus();
          const action = getActionFromEvent(notification);
          if (action) router.push(action.href);
        };
      }
    });

    return unsubscribe;
  }, [desktopNotificationsEnabled, router]);

  // Sound notifications
  useEffect(() => {
    if (!soundEnabled) return;

    const unsubscribe = notificationSocket.onNotificationNew(() => {
      const audio = new Audio("/sound/notification.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Browser may block autoplay — ignore silently
      });
    });

    return unsubscribe;
  }, [soundEnabled]);

  return <>{children}</>;
}
