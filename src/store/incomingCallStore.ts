import { create } from "zustand";
import type { CallLog } from "@/types/callLog";

interface IncomingCallState {
  call: CallLog | null;
  isVisible: boolean;
  show: (call: CallLog) => void;
  dismiss: () => void;
}

export const useIncomingCallStore = create<IncomingCallState>((set) => ({
  call: null,
  isVisible: false,
  show: (call) => set({ call, isVisible: true }),
  dismiss: () => set({ isVisible: false }),
}));
