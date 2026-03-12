import { create } from "zustand";
import { Mail } from "@/components/mail/data";

type ComposeState = "full" | "minimized";

type MailStore = {
  selectedMail: Mail | null;
  setSelectedMail: (mail: Mail | null) => void;

  isComposeOpen: boolean;
  composeState: ComposeState;
  openCompose: () => void;
  closeCompose: () => void;
  minimizeCompose: () => void;
  maximizeCompose: () => void;
};

export const useMailStore = create<MailStore>((set) => ({
  selectedMail: null,
  setSelectedMail: (mail) => set({ selectedMail: mail }),

  isComposeOpen: false,
  composeState: "full",
  openCompose: () => set({ isComposeOpen: true, composeState: "full" }),
  closeCompose: () => set({ isComposeOpen: false }),
  minimizeCompose: () => set({ composeState: "minimized" }),
  maximizeCompose: () => set({ composeState: "full" }),
}));
