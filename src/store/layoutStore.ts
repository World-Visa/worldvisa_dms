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
  phonePanelOpen: boolean;
  openPhonePanel: () => void;
  closePhonePanel: () => void;
  togglePhonePanel: () => void;
};

export const useLayoutStore = create<LayoutStore>((set) => ({
  sidebarForcedCollapsed: false,
  setSidebarForcedCollapsed: (v) => set({ sidebarForcedCollapsed: v }),
  chatPanel: null,
  openChatPanel: (data) => set({ chatPanel: data, phonePanelOpen: false }),
  closeChatPanel: () => set({ chatPanel: null }),
  phonePanelOpen: false,
  openPhonePanel: () => set({ phonePanelOpen: true, chatPanel: null }),
  closePhonePanel: () => set({ phonePanelOpen: false }),
  togglePhonePanel: () =>
    set((s) =>
      s.phonePanelOpen
        ? { phonePanelOpen: false }
        : { phonePanelOpen: true, chatPanel: null },
    ),
}));
