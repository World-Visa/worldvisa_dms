"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { notificationSocket } from "@/lib/notificationSocket";
import { useNotificationStore } from "@/store/notificationStore";
import { usePresence } from "@/hooks/usePresence";
import { usePresenceEmitter } from "@/hooks/usePresenceEmitter";
import { showNotificationToast } from "@/components/ui/primitives/sonner-helpers";
import type { NotificationNewEvent } from "@/types/notifications";
import { getNotificationAction } from "@/lib/constants/notifications";

function getActionFromEvent(event: NotificationNewEvent) {
  return getNotificationAction({
    ...event,
    user: "",
  } as Parameters<typeof getNotificationAction>[0]);
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { desktopNotificationsEnabled, soundEnabled } = useNotificationStore();

  usePresence();
  usePresenceEmitter();

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

  useEffect(() => {
    const isClient = user?.role === "client";

    const unsubscribe = notificationSocket.onNotificationNew((notification) => {
      const action = getActionFromEvent(notification);
      showNotificationToast(
        notification.title ?? "New notification",
        notification.message,
        action && !isClient ? { label: action.label, onClick: () => router.push(action.href) } : undefined,
      );
    });

    return unsubscribe;
  }, [router, user?.role]);

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

  useEffect(() => {
    if (!soundEnabled) return;

    const unsubscribe = notificationSocket.onNotificationNew(() => {
      const audio = new Audio("/sound/notification.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {
      });
    });

    return unsubscribe;
  }, [soundEnabled]);

  return <>{children}</>;
}
