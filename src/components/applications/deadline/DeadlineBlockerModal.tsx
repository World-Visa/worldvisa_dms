"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DeadlineStatCard } from "./DeadlineStatCard";
import DeadlineExpanded from "./DeadlineExpanded";
import { SPRING_ENTRY, SPRING_LAYOUT, SPRING_PRESS } from "./deadline-motion";
import {
  DEADLINE_INNER_CARD_RADIUS_PX,
  DEADLINE_WHITE_CARD_SHADOW,
} from "./deadline-tokens";
import { ROUTES } from "@/utils/routes";

interface DeadlineBlockerModalProps {
  open: boolean;
  leadId: string;
  currentDeadline?: string;
}

const WHY_STEPS = [
  {
    number: "1",
    text: "Submit an extension request — choose a new target date and assign it to a supervisor.",
  },
  {
    number: "2",
    text: "A supervisor reviews the request and approves or suggests a revised date.",
  },
  {
    number: "3",
    text: "Once approved, the deadline is updated and the application is immediately unlocked.",
  },
] as const;

export function DeadlineBlockerModal({
  open,
  leadId,
  currentDeadline,
}: DeadlineBlockerModalProps) {
  const router = useRouter();
  const [view, setView] = useState<"idle" | "form">("idle");
  const [isWhyOpen, setIsWhyOpen] = useState(false);
  const reduced = useReducedMotion();
  const closeButtonRef = useRef<HTMLButtonElement>(
    null,
  ) as React.MutableRefObject<HTMLButtonElement>;

  return (
    <Dialog open={open} modal>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="p-1 border-0 overflow-hidden sm:max-w-[400px]"
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
          <DialogTitle>Application Deadline Passed</DialogTitle>
        </VisuallyHidden>

        <motion.div
          layout
          className="flex flex-col w-full"
          style={{
            gap: view === "form" ? 4 : 8,
            paddingTop: view === "form" ? 4 : 12,
            paddingLeft: 4,
            paddingRight: 4,
            paddingBottom: 4,
          }}
          transition={SPRING_LAYOUT}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {view === "idle" ? (
              <motion.div
                key="idle"
                className="flex flex-col w-full"
                style={{ gap: 8 }}
                initial={{ opacity: 0, y: reduced ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  scale: 0.97,
                  transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
                }}
                transition={reduced ? { duration: 0.15 } : SPRING_ENTRY}
              >
                {/* ── Header ─────────────────────────────── */}
                <div
                  className="flex flex-col gap-2 pb-1"
                  style={{ paddingLeft: 10, paddingRight: 10, paddingTop: 4 }}
                >
                  <div className="flex items-center justify-between">
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
                      Deadline Passed
                    </span>

                    <motion.button
                      type="button"
                      aria-label="Go back to applications"
                      className="flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#c0d5ff]"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: "#ebebeb",
                        border: "none",
                        cursor: "pointer",
                        color: "#737373",
                      }}
                      whileHover={reduced ? {} : { background: "#e0e0e0" } as never}
                      whileTap={reduced ? {} : { scale: 0.94 }}
                      transition={SPRING_PRESS}
                      onClick={() => router.push(ROUTES.VISA_APPLICATIONS)}
                    >
                      <X size={13} strokeWidth={2.2} />
                    </motion.button>
                  </div>

                  <p
                    className="font-semibold text-[20px] leading-[28px] tracking-[-0.48px] text-[#171717] select-none"
                    style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
                  >
                    Application is on hold
                  </p>

                  <p
                    className="text-[13px] leading-[20px] tracking-[-0.078px] text-[#737373] select-none"
                    style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
                  >
                    Further edits are paused until a new deadline is approved.
                    Request an extension to unlock this application.
                  </p>
                </div>

                {/* ── Stat card ──────────────────────────── */}
                <DeadlineStatCard currentDeadline={currentDeadline} />

                {/* ── Why accordion ──────────────────────── */}
                <div className="flex flex-col" style={{ gap: 0 }}>
                  <motion.button
                    type="button"
                    className="flex items-center gap-1.5 self-start select-none outline-none"
                    style={{
                      paddingLeft: 10,
                      paddingRight: 10,
                      paddingTop: 6,
                      paddingBottom: 6,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onClick={() => setIsWhyOpen((v) => !v)}
                    whileTap={reduced ? {} : { scale: 0.97 }}
                    transition={SPRING_PRESS}
                    aria-expanded={isWhyOpen}
                  >
                    <span
                      className="font-medium text-[12px] leading-[16px] tracking-[-0.06px] text-[#a3a3a3]"
                      style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
                    >
                      Why is this paused?
                    </span>
                    <motion.span
                      animate={{ rotate: isWhyOpen ? 180 : 0 }}
                      transition={SPRING_PRESS}
                      style={{ display: "flex", color: "#a3a3a3" }}
                    >
                      <ChevronDown size={12} strokeWidth={2.2} />
                    </motion.span>
                  </motion.button>

                  <AnimatePresence initial={false}>
                    {isWhyOpen && (
                      <motion.div
                        key="why-panel"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={
                          reduced
                            ? { duration: 0.15 }
                            : { type: "spring", stiffness: 260, damping: 24 }
                        }
                        style={{ overflow: "hidden" }}
                      >
                        <div
                          className="flex flex-col gap-3"
                          style={{
                            borderRadius: DEADLINE_INNER_CARD_RADIUS_PX,
                            background: "white",
                            boxShadow: DEADLINE_WHITE_CARD_SHADOW,
                            paddingTop: 14,
                            paddingBottom: 14,
                            paddingLeft: 14,
                            paddingRight: 14,
                            marginTop: 2,
                          }}
                        >
                          <p
                            className="font-medium text-[12px] leading-[16px] tracking-[-0.06px] text-[#a3a3a3] uppercase select-none"
                            style={{ letterSpacing: "0.04em", fontFeatureSettings: "'ss11', 'calt' 0" }}
                          >
                            How to resume work
                          </p>

                          <div className="flex flex-col gap-3">
                            {WHY_STEPS.map((step) => (
                              <div
                                key={step.number}
                                className="flex items-start gap-3"
                              >
                                <span
                                  className="flex items-center justify-center shrink-0 font-semibold text-[11px] leading-4 text-[#a3a3a3] select-none"
                                  style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 6,
                                    background: "#f5f5f5",
                                    fontFeatureSettings: "'ss11', 'calt' 0",
                                    marginTop: 1,
                                  }}
                                >
                                  {step.number}
                                </span>
                                <p
                                  className="text-[13px] leading-[20px] tracking-[-0.078px] text-[#525252] select-none"
                                  style={{
                                    fontFeatureSettings: "'ss11', 'calt' 0",
                                  }}
                                >
                                  {step.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Primary CTA ────────────────────────── */}
                <motion.button
                  type="button"
                  className="relative flex items-center justify-center w-full overflow-hidden select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#c0d5ff]"
                  style={{
                    height: 44,
                    borderRadius: DEADLINE_INNER_CARD_RADIUS_PX,
                    backgroundImage:
                      "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%)," +
                      "linear-gradient(90deg, #171717 0%, #171717 100%)",
                    boxShadow:
                      "0px 0px 0px 0.75px #171717," +
                      "inset 0px 1px 2px 0px rgba(255,255,255,0.12)",
                    border: "none",
                    cursor: "pointer",
                  }}
                  whileHover={reduced ? {} : { opacity: 0.88 }}
                  whileTap={reduced ? {} : { scale: 0.97 }}
                  transition={SPRING_PRESS}
                  onClick={() => setView("form")}
                >
                  <span
                    className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-white"
                    style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
                  >
                    Request Extension
                  </span>
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                className="flex flex-col w-full"
                style={{ gap: 4 }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
              >
                <DeadlineExpanded
                  onClose={() => setView("idle")}
                  closeButtonRef={closeButtonRef}
                  onRequestSent={() => {}}
                  leadId={leadId}
                  currentDeadline={currentDeadline}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
