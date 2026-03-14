import { create } from "zustand";
import type { EmailThread } from "@/types/email";

type ComposeState = "full" | "minimized";

interface ComposeDraft {
  to: string;
  subject: string;
  inReplyTo: string;
  threadId: string;
}

type MailStore = {
  selectedMail: EmailThread | null;
  setSelectedMail: (mail: EmailThread | null) => void;

  isComposeOpen: boolean;
  composeState: ComposeState;
  openCompose: () => void;
  closeCompose: () => void;
  minimizeCompose: () => void;
  maximizeCompose: () => void;

  composeDraft: ComposeDraft | null;
  setComposeDraft: (draft: ComposeDraft) => void;
  clearComposeDraft: () => void;
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

  composeDraft: null,
  setComposeDraft: (draft) => set({ composeDraft: draft }),
  clearComposeDraft: () => set({ composeDraft: null }),
}));
