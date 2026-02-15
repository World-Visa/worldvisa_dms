import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Notification } from "@/types/notifications";

interface NotificationStore {
  // UI State
  isNotificationPanelOpen: boolean;
  lastReadTimestamp: string | null;
  isNavigating: boolean;

  // Actions
  toggleNotificationPanel: () => void;
  openNotificationPanel: () => void;
  closeNotificationPanel: () => void;
  updateLastReadTimestamp: (timestamp: string) => void;
  setNavigating: (isNavigating: boolean) => void;

  // Preferences
  soundEnabled: boolean;
  desktopNotificationsEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setDesktopNotificationsEnabled: (enabled: boolean) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isNotificationPanelOpen: false,
      lastReadTimestamp: null,
      isNavigating: false,
      soundEnabled: true,
      desktopNotificationsEnabled: false,

      // Actions
      toggleNotificationPanel: () => {
        set((state) => ({
          isNotificationPanelOpen: !state.isNotificationPanelOpen,
        }));
      },

      openNotificationPanel: () => {
        set({ isNotificationPanelOpen: true });
      },

      closeNotificationPanel: () => {
        set({ isNotificationPanelOpen: false });
      },

      updateLastReadTimestamp: (timestamp: string) => {
        set({ lastReadTimestamp: timestamp });
      },

      setNavigating: (isNavigating: boolean) => {
        set({ isNavigating });
      },

      setSoundEnabled: (enabled: boolean) => {
        set({ soundEnabled: enabled });
      },

      setDesktopNotificationsEnabled: (enabled: boolean) => {
        set({ desktopNotificationsEnabled: enabled });
      },
    }),
    {
      name: "notification-preferences",
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        desktopNotificationsEnabled: state.desktopNotificationsEnabled,
        lastReadTimestamp: state.lastReadTimestamp,
      }),
    },
  ),
);
