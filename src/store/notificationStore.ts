import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificationStore {
  soundEnabled: boolean;
  desktopNotificationsEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setDesktopNotificationsEnabled: (enabled: boolean) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      soundEnabled: true,
      desktopNotificationsEnabled: false,

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
      }),
    },
  ),
);
