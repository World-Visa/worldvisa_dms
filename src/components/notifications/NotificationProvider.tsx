'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { notificationSocket } from '@/lib/notificationSocket';
import { useNotificationStore } from '@/store/notificationStore';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { desktopNotificationsEnabled, soundEnabled } = useNotificationStore();

  // Initialize notification system when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      notificationSocket.connect();
      
      // Request notification permission
      if (desktopNotificationsEnabled && 'Notification' in window) {
        Notification.requestPermission();
      }
    } else {
      notificationSocket.disconnect();
    }
  }, [isAuthenticated, desktopNotificationsEnabled]);

  // Set up desktop notifications
  useEffect(() => {
    if (!desktopNotificationsEnabled || !('Notification' in window)) return;

    const unsubscribeNew = notificationSocket.onNotificationNew((notification) => {
      if (Notification.permission === 'granted') {
        const notificationInstance = new Notification(notification.message, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: notification._id,
          data: notification,
        });

        notificationInstance.onclick = () => {
          window.focus();
          if (notification.link) {
            window.open(notification.link, '_blank');
          }
        };
      }
    });

    return unsubscribeNew;
  }, [desktopNotificationsEnabled]);

  // Set up sound notifications
  useEffect(() => {
    if (!soundEnabled) return;

    const unsubscribeNew = notificationSocket.onNotificationNew(() => {
      // Play notification sound
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(() => {
        // Ignore errors if audio can't play
      });
    });

    return unsubscribeNew;
  }, [soundEnabled]);

  return <>{children}</>;
}