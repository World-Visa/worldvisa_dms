import { create } from "zustand";
import type { CallLog } from "@/types/callLog";

type CallDispositionStore = {
  pendingCall: CallLog | null;
  isModalOpen: boolean;
  /** When true, a close button is shown and the modal can be dismissed without saving. */
  closable: boolean;
  openDispositionModal: (call: CallLog, closable?: boolean) => void;
  closeDispositionModal: () => void;
  clearPendingCall: () => void;
};

export const useCallDispositionStore = create<CallDispositionStore>((set) => ({
  pendingCall:           null,
  isModalOpen:           false,
  closable:              false,
  openDispositionModal:  (call, closable = false) => set({ pendingCall: call, isModalOpen: true, closable }),
  closeDispositionModal: () => set({ isModalOpen: false }),
  clearPendingCall:      () => set({ pendingCall: null }),
}));
