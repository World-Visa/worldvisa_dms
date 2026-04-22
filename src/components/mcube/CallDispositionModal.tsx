"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CheckCircle2, ArrowRight, ArrowLeft, X } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useCallDispositionStore } from "@/store/callDispositionStore";
import { useUpdateCallNotes } from "@/hooks/useCallLogs";
import { AGENT_STATUS_OPTIONS } from "@/lib/constants/callDisposition";
import { formatCallDuration } from "@/lib/constants/callLogs";
import { getInitials } from "@/lib/constants/users";
import { showSuccessToast, showErrorToast } from "@/components/ui/primitives/sonner-helpers";
import {
  DEADLINE_INNER_CARD_RADIUS_PX,
  DEADLINE_WHITE_CARD_SHADOW,
} from "@/components/applications/deadline/deadline-tokens";
import {
  SPRING_ENTRY,
  SPRING_LAYOUT,
  SPRING_PRESS,
} from "@/components/applications/deadline/deadline-motion";
import type { CallAgentStatus } from "@/types/callLog";

const OUTCOME_OPTIONS = AGENT_STATUS_OPTIONS.filter((o) => o.value !== "none");

export function CallDispositionModal() {
  const { isModalOpen, closable, pendingCall, closeDispositionModal, clearPendingCall } =
    useCallDispositionStore();

  const [view, setView] = useState<"outcome" | "note">("outcome");
  const [callAgentStatus, setCallAgentStatus] = useState<CallAgentStatus | "">("");
  const [callNote, setCallNote] = useState("");
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const reduced = useReducedMotion();
  const { mutate, isPending } = useUpdateCallNotes();

  useEffect(() => {
    if (pendingCall) {
      setCallAgentStatus(pendingCall.call_agent_status ?? "");
      setCallNote(pendingCall.call_note ?? "");
      setView("outcome");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCall?._id]);

  useEffect(() => {
    if (view === "note") {
      const id = setTimeout(() => noteRef.current?.focus(), 60);
      return () => clearTimeout(id);
    }
  }, [view]);

  function handleDismiss() {
    if (!closable) return;
    setCallAgentStatus("");
    setCallNote("");
    setView("outcome");
    closeDispositionModal();
    setTimeout(clearPendingCall, 200);
  }

  function handleSave() {
    if (!pendingCall || !callAgentStatus || !callNote.trim() || isPending) return;
    mutate(
      {
        callId: pendingCall.call_id,
        payload: {
          call_agent_status: callAgentStatus as CallAgentStatus,
          call_note: callNote.trim(),
        },
      },
      {
        onSuccess: () => {
          showSuccessToast("Call disposition saved");
          setCallAgentStatus("");
          setCallNote("");
          setView("outcome");
          closeDispositionModal();
          setTimeout(clearPendingCall, 200);
        },
        onError: (error) => showErrorToast(`Failed to save: ${error.message}`),
      },
    );
  }

  if (!pendingCall) return null;

  const caller = pendingCall.client_name ?? pendingCall.customer_phone ?? "Unknown Caller";
  const initials = getInitials(caller);
  const duration = formatCallDuration(pendingCall.answered_duration);
  const canGoNext = callAgentStatus !== "";
  const canSave = callNote.trim().length > 0 && !isPending;

  return (
    <Dialog open={isModalOpen} modal>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => { if (!closable) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (!closable) e.preventDefault(); else handleDismiss(); }}
        className="p-1 border-0 overflow-hidden sm:max-w-[360px]"
        style={{
          borderRadius: 24,
          background: "#f7f7f7",
          boxShadow:
            "0px 24px 48px -8px rgba(0,0,0,0.18)," +
            "0px 8px 16px -4px rgba(0,0,0,0.08)," +
            "0px 0px 0px 1px rgba(0,0,0,0.06)",
        }}
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>Log Call Disposition</DialogTitle>
        </VisuallyHidden>

        <motion.div
          layout
          className="flex flex-col w-full"
          style={{ paddingLeft: 4, paddingRight: 4, paddingBottom: 4 }}
          transition={SPRING_LAYOUT}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {view === "outcome" ? (
              <motion.div
                key="outcome"
                className="flex flex-col w-full"
                style={{ gap: 8, paddingTop: 12 }}
                initial={{ opacity: 0, y: reduced ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  scale: 0.97,
                  transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
                }}
                transition={reduced ? { duration: 0.15 } : SPRING_ENTRY}
              >
                {/* ── Modal header ───────────────────────── */}
                <div
                  className="flex flex-col gap-2"
                  style={{ paddingLeft: 10, paddingRight: 10, paddingTop: 4 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <p
                        className="font-semibold text-[20px] leading-[28px] tracking-[-0.48px] text-[#171717] select-none"
                        style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
                      >
                        Log this call
                      </p>

                      <p
                        className="text-[13px] leading-[20px] tracking-[-0.078px] text-[#737373] select-none"
                        style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
                      >
                        Select an outcome and add a note before closing.
                      </p>
                    </div>

                    {closable && (
                      <motion.button
                        type="button"
                        aria-label="Close"
                        className="flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#c0d5ff]"
                        style={{ width: 28, height: 28, borderRadius: 8, background: "#ebebeb", border: "none", cursor: "pointer", color: "#737373" }}
                        whileHover={reduced ? {} : { background: "#e0e0e0" } as never}
                        whileTap={reduced ? {} : { scale: 0.94 }}
                        transition={SPRING_PRESS}
                        onClick={handleDismiss}
                      >
                        <X size={13} strokeWidth={2.2} />
                      </motion.button>
                    )}
                  </div>


                </div>

                {/* iPhone-style caller card */}
                <div
                  style={{
                    borderRadius: DEADLINE_INNER_CARD_RADIUS_PX,
                    background: "white",
                    boxShadow: DEADLINE_WHITE_CARD_SHADOW,
                    paddingTop: 20,
                    paddingBottom: 20,
                    paddingLeft: 14,
                    paddingRight: 14,
                  }}
                >
                  <div className="flex flex-col items-center gap-3">
                    {/* Avatar */}
                    <div
                      className="flex items-center justify-center shrink-0 font-semibold select-none overflow-hidden"
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: "#f0f0f0",
                        border: "2.5px solid #e5e5e5",
                        fontSize: 22,
                        letterSpacing: "-0.5px",
                        color: "#525252",
                        fontFeatureSettings: "'ss11', 'calt' 0",
                      }}
                    >
                      {pendingCall.client_image_url ? (
                        <Image
                          src={pendingCall.client_image_url}
                          alt={caller}
                          width={64}
                          height={64}
                          className="object-cover"
                          style={{ borderRadius: "50%" }}
                        />
                      ) : (
                        initials
                      )}
                    </div>

                    {/* Name + phone */}
                    <div className="flex flex-col items-center gap-0.5">
                      <p
                        className="font-semibold text-[17px] leading-[24px] tracking-[-0.34px] text-[#171717] select-none text-center"
                        style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
                      >
                        {caller}
                      </p>
                      <p
                        className="text-[12px] leading-[16px] tracking-[-0.06px] text-[#a3a3a3] select-none"
                        style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
                      >
                        {pendingCall.customer_phone}
                      </p>
                    </div>

                    {/* Call Ended + duration row */}
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium leading-4 select-none"
                        style={{
                          background: "#fef2f2",
                          color: "#ef4444",
                          fontFeatureSettings: "'ss11', 'calt' 0",
                        }}
                      >
                        <span
                          className="rounded-full shrink-0"
                          style={{ width: 5, height: 5, background: "#ef4444" }}
                          aria-hidden
                        />
                        Call Ended
                      </span>

                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full select-none"
                        style={{ background: "#f5f5f5", border: "1px solid #ebebeb" }}
                      >
                        <span
                          className="rounded-full shrink-0"
                          style={{ width: 5, height: 5, background: "#d4d4d4" }}
                          aria-hidden
                        />
                        <span
                          className="text-[12px] leading-[16px] tracking-[-0.06px] font-medium text-[#737373]"
                          style={{ fontFeatureSettings: "'ss11', 'calt' 0", fontVariantNumeric: "tabular-nums" }}
                        >
                          {duration}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Outcome chips */}
                <div
                  style={{
                    borderRadius: DEADLINE_INNER_CARD_RADIUS_PX,
                    background: "white",
                    boxShadow: DEADLINE_WHITE_CARD_SHADOW,
                    paddingTop: 14,
                    paddingBottom: 14,
                    paddingLeft: 14,
                    paddingRight: 14,
                  }}
                >
                  <p
                    className="font-medium text-[11px] leading-[16px] uppercase text-[#a3a3a3] mb-2.5 select-none"
                    style={{ letterSpacing: "0.06em", fontFeatureSettings: "'ss11', 'calt' 0" }}
                  >
                    Call Outcome <span style={{ color: "#ef4444" }}>*</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {OUTCOME_OPTIONS.map((opt) => {
                      const selected = callAgentStatus === opt.value;
                      return (
                        <motion.button
                          key={opt.value}
                          type="button"
                          className="relative flex items-center gap-1.5 select-none outline-none focus-visible:ring-2 focus-visible:ring-[#c0d5ff]"
                          style={{
                            paddingLeft: 10,
                            paddingRight: 10,
                            paddingTop: 5,
                            paddingBottom: 5,
                            borderRadius: 10,
                            border: selected ? "none" : "1px solid #e5e5e5",
                            background: selected ? "#171717" : "transparent",
                            cursor: "pointer",
                          }}
                          whileTap={reduced ? {} : { scale: 0.95 }}
                          transition={SPRING_PRESS}
                          onClick={() => setCallAgentStatus(opt.value)}
                        >
                          <AnimatePresence>
                            {selected && (
                              <motion.span
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.6 }}
                                transition={SPRING_PRESS}
                                style={{ display: "flex", color: "white" }}
                              >
                                <CheckCircle2 size={11} strokeWidth={2.2} />
                              </motion.span>
                            )}
                          </AnimatePresence>
                          <span
                            className="text-[12px] leading-[16px] tracking-[-0.06px] font-medium"
                            style={{
                              fontFeatureSettings: "'ss11', 'calt' 0",
                              color: selected ? "white" : "#525252",
                            }}
                          >
                            {opt.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Next */}
                <motion.button
                  type="button"
                  className="relative flex items-center justify-center gap-1.5 w-full overflow-hidden select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#c0d5ff]"
                  style={{
                    height: 44,
                    borderRadius: DEADLINE_INNER_CARD_RADIUS_PX,
                    backgroundColor: canGoNext ? "transparent" : "#ebebeb",
                    backgroundImage: canGoNext
                      ? "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%)," +
                        "linear-gradient(90deg, #171717 0%, #171717 100%)"
                      : "none",
                    boxShadow: canGoNext
                      ? "0px 0px 0px 0.75px #171717,inset 0px 1px 2px 0px rgba(255,255,255,0.16)"
                      : "none",
                    border: "none",
                    cursor: canGoNext ? "pointer" : "not-allowed",
                  }}
                  whileHover={canGoNext && !reduced ? { opacity: 0.88 } : {}}
                  whileTap={canGoNext && !reduced ? { scale: 0.97 } : {}}
                  transition={SPRING_PRESS}
                  onClick={() => { if (canGoNext) setView("note"); }}
                  disabled={!canGoNext}
                >
                  <span
                    className="font-medium text-[13px] leading-[20px] tracking-[-0.078px]"
                    style={{ fontFeatureSettings: "'ss11', 'calt' 0", color: canGoNext ? "white" : "#a3a3a3" }}
                  >
                    Next
                  </span>
                  {canGoNext && <ArrowRight size={13} strokeWidth={2.2} color="white" />}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="note"
                className="flex flex-col w-full"
                style={{ gap: 8, paddingTop: 12 }}
                initial={{ opacity: 0, y: reduced ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
                transition={reduced ? { duration: 0.15 } : SPRING_ENTRY}
              >
                {/* Header row */}
                <div
                  className="flex items-center gap-2"
                  style={{ paddingLeft: 6, paddingRight: 6, paddingTop: 4 }}
                >
                  <motion.button
                    type="button"
                    aria-label="Back"
                    className="flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#c0d5ff]"
                    style={{ width: 28, height: 28, borderRadius: 8, background: "#ebebeb", border: "none", cursor: "pointer", color: "#737373" }}
                    whileHover={reduced ? {} : { background: "#e0e0e0" } as never}
                    whileTap={reduced ? {} : { scale: 0.94 }}
                    transition={SPRING_PRESS}
                    onClick={() => setView("outcome")}
                  >
                    <ArrowLeft size={13} strokeWidth={2.2} />
                  </motion.button>

                  <p
                    className="font-semibold text-[15px] leading-[22px] tracking-[-0.3px] text-[#171717] select-none flex-1"
                    style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
                  >
                    Add a note
                  </p>

                  {closable && (
                    <motion.button
                      type="button"
                      aria-label="Close"
                      className="flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#c0d5ff]"
                      style={{ width: 28, height: 28, borderRadius: 8, background: "#ebebeb", border: "none", cursor: "pointer", color: "#737373" }}
                      whileHover={reduced ? {} : { background: "#e0e0e0" } as never}
                      whileTap={reduced ? {} : { scale: 0.94 }}
                      transition={SPRING_PRESS}
                      onClick={handleDismiss}
                    >
                      <X size={13} strokeWidth={2.2} />
                    </motion.button>
                  )}
                </div>

                {/* Note card */}
                <div
                  style={{
                    borderRadius: DEADLINE_INNER_CARD_RADIUS_PX,
                    background: "white",
                    boxShadow: DEADLINE_WHITE_CARD_SHADOW,
                    paddingTop: 14,
                    paddingBottom: 14,
                    paddingLeft: 14,
                    paddingRight: 14,
                  }}
                >
                  <p
                    className="font-medium text-[11px] leading-[16px] uppercase text-[#a3a3a3] mb-2.5 select-none"
                    style={{ letterSpacing: "0.06em", fontFeatureSettings: "'ss11', 'calt' 0" }}
                  >
                    Note <span style={{ color: "#ef4444" }}>*</span>
                  </p>
                  <textarea
                    ref={noteRef}
                    rows={4}
                    placeholder="Add a note about this call…"
                    value={callNote}
                    onChange={(e) => setCallNote(e.target.value)}
                    className="placeholder:text-[#a3a3a3] focus:border-[#a3a3a3] transition-colors"
                    style={{
                      width: "100%",
                      resize: "none",
                      border: "1px solid #e5e5e5",
                      borderRadius: 10,
                      padding: "8px 10px",
                      fontSize: 13,
                      lineHeight: "20px",
                      letterSpacing: "-0.078px",
                      fontFamily: "inherit",
                      color: "#171717",
                      background: "transparent",
                      outline: "none",
                      fontFeatureSettings: "'ss11', 'calt' 0",
                    }}
                  />
                </div>

                {/* Save */}
                <motion.button
                  type="button"
                  className="relative flex items-center justify-center w-full overflow-hidden select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#c0d5ff]"
                  style={{
                    height: 44,
                    borderRadius: DEADLINE_INNER_CARD_RADIUS_PX,
                    backgroundColor: canSave ? "transparent" : "#ebebeb",
                    backgroundImage: canSave
                      ? "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%)," +
                        "linear-gradient(90deg, #171717 0%, #171717 100%)"
                      : "none",
                    boxShadow: canSave
                      ? "0px 0px 0px 0.75px #171717,inset 0px 1px 2px 0px rgba(255,255,255,0.16)"
                      : "none",
                    border: "none",
                    cursor: canSave ? "pointer" : "not-allowed",
                    opacity: isPending ? 0.7 : 1,
                  }}
                  whileHover={canSave && !reduced ? { opacity: 0.88 } : {}}
                  whileTap={canSave && !reduced ? { scale: 0.97 } : {}}
                  transition={SPRING_PRESS}
                  onClick={handleSave}
                  disabled={!canSave}
                >
                  <span
                    className="font-medium text-[13px] leading-[20px] tracking-[-0.078px]"
                    style={{ fontFeatureSettings: "'ss11', 'calt' 0", color: canSave ? "white" : "#a3a3a3" }}
                  >
                    {isPending ? "Saving…" : "Save & Close"}
                  </span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
