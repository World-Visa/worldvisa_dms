import { create } from "zustand";
import type { CallLog } from "@/types/callLog";

type CallDispositionStore = {
  /** The call that just hung up and is awaiting agent disposition */
  pendingCall: CallLog | null;
  isModalOpen: boolean;
  openDispositionModal: (call: CallLog) => void;
  closeDispositionModal: () => void;
  clearPendingCall: () => void;
};

export const useCallDispositionStore = create<CallDispositionStore>((set) => ({
  pendingCall:           null,
  isModalOpen:           false,
  openDispositionModal:  (call) => set({ pendingCall: call, isModalOpen: true }),
  closeDispositionModal: ()     => set({ isModalOpen: false }),
  clearPendingCall:      ()     => set({ pendingCall: null }),
}));
