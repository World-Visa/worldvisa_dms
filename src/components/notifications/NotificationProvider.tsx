"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { notificationSocket } from "@/lib/notificationSocket";
import { useNotificationStore } from "@/store/notificationStore";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const { desktopNotificationsEnabled, soundEnabled } = useNotificationStore();

  // Initialize the notifications hook to set up event listeners
  useEffect(() => {
    console.log("🔔 NotificationProvider: About to call useNotifications hook");
    // We don't need to call useNotifications here since it's already called in NotificationBell and NotificationPanel
    // The issue was that calling it here was causing multiple registrations
    console.log(
      "🔔 NotificationProvider: Skipping useNotifications call to prevent multiple registrations",
    );
  }, []);

  // Initialize notification system when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      notificationSocket.connect();

      // Request notification permission
      if (desktopNotificationsEnabled && "Notification" in window) {
        Notification.requestPermission().then((permission) => {});
      }
    } else {
      notificationSocket.disconnect();
    }
  }, [isAuthenticated, desktopNotificationsEnabled]);

  // Set up desktop notifications
  useEffect(() => {
    if (!desktopNotificationsEnabled || !("Notification" in window)) return;

    const unsubscribeNew = notificationSocket.onNotificationNew(
      (notification) => {
        if (Notification.permission === "granted") {
          const notificationInstance = new Notification(notification.message, {
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            tag: notification._id,
            data: notification,
          });

          notificationInstance.onclick = () => {
            window.focus();
            if (notification.link) {
              window.open(notification.link, "_blank");
            }
          };
        }
      },
    );

    return unsubscribeNew;
  }, [desktopNotificationsEnabled]);

  // Set up sound notifications
  useEffect(() => {
    if (!soundEnabled) {
      return;
    }

    const unsubscribeNew = notificationSocket.onNotificationNew(
      (notification) => {
        // Play notification sound
        const audio = new Audio("/sound/notification.mp3");
        audio.volume = 0.5; // Set volume to 50%
        audio.play().catch((error) => {
          console.warn("Failed to play notification sound:", error);
        });
      },
    );

    return unsubscribeNew;
  }, [soundEnabled]);

  return <>{children}</>;
}
