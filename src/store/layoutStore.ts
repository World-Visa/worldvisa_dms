import { create } from "zustand";

export type ChatPanelData = {
  applicationId: string;
  applicationHandledBy: string;
  leadId: string;
  clientName?: string;
};

type LayoutStore = {
  sidebarForcedCollapsed: boolean;
  setSidebarForcedCollapsed: (v: boolean) => void;
  chatPanel: ChatPanelData | null;
  openChatPanel: (data: ChatPanelData) => void;
  closeChatPanel: () => void;
};

export const useLayoutStore = create<LayoutStore>((set) => ({
  sidebarForcedCollapsed: false,
  setSidebarForcedCollapsed: (v) => set({ sidebarForcedCollapsed: v }),
  chatPanel: null,
  openChatPanel: (data) => set({ chatPanel: data }),
  closeChatPanel: () => set({ chatPanel: null }),
}));
