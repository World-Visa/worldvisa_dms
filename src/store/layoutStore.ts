import { create } from "zustand";

type LayoutStore = {
  sidebarForcedCollapsed: boolean;
  setSidebarForcedCollapsed: (v: boolean) => void;
};

export const useLayoutStore = create<LayoutStore>((set) => ({
  sidebarForcedCollapsed: false,
  setSidebarForcedCollapsed: (v) => set({ sidebarForcedCollapsed: v }),
}));
