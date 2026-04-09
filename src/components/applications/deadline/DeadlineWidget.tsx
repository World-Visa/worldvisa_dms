/* ─────────────────────────────────────────────────────────
 * DEADLINE WIDGET — ANIMATION STORYBOARD
 *
 * INITIAL ENTRANCE:
 *    0ms   container springs in (opacity 0→1, y 16→0)
 *   80ms   header fades up
 *  200ms   stat card springs in
 *
 * EXTENSION OPEN (click "Request Extension"):
 *    0ms   container layout-morphs height (spring stiffness:240 damping:22)
 *          closed view exits — fade + scale 0.97 (150ms ease-in)
 *  120ms   DeadlineExpanded panels enter (staggered springs)
 *
 * CLOSE (click ×):
 *    0ms   expanded panels exit (staggered)
 *  ~200ms  container collapses, closed view re-enters
 *
 * REQUESTED:
 *    "Request Extension" → "Request Pending" (non-interactive, grey pill)
 * ───────────────────────────────────────────────────────── */

"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import DeadlineExpanded from "./DeadlineExpanded";
import { DeadlineExtensionOutcomeCard } from "./DeadlineExtensionOutcomeCard";
import { DeadlineStatCard } from "./DeadlineStatCard";
import { RequestExtensionButton } from "./RequestExtensionButton";
import {
  buildOutcomeViewModel,
  pickLatestDeadlineExtension,
} from "./deadline-outcome-model";
import { SPRING_ENTRY, SPRING_LAYOUT } from "./deadline-motion";
import { useApprovalRequestsByLead } from "@/hooks/useAdminApprovalRequests";
import type { DeadlineExtensionEntry } from "@/types/applications";

interface DeadlineWidgetProps {
  leadId: string;
  currentDeadline?: string;
  /** From visa application document after an extension is approved (see `deadline_extensions`). */
  deadlineExtensions?: DeadlineExtensionEntry[];
  /** Client view hides request CTA and non-approved messaging. */
  isClientView?: boolean;
}

export default function DeadlineWidget({
  leadId,
  currentDeadline,
  deadlineExtensions,
  isClientView = false,
}: DeadlineWidgetProps) {
  const [view, setView] = useState<"closed" | "extended">("closed");
  const [outcomeDetailOpen, setOutcomeDetailOpen] = useState(false);
  const reduced = useReducedMotion();

  const requestTriggerRef = useRef<HTMLButtonElement>(null);
  const expandedCloseRef = useRef<HTMLButtonElement>(null) as React.MutableRefObject<HTMLButtonElement>;

  const { data: leadRequests } = useApprovalRequestsByLead(leadId, {});

  const { isPending, outcome } = useMemo(() => {
    const list = leadRequests?.data ?? [];
    const filtered = list.filter(
      (r) =>
        r.fieldName === "Deadline_For_Lodgment" &&
        r.recordType === "visa_application",
    );
    const sorted = [...filtered].sort((a, b) => {
      const ta = new Date(a.updatedAt || a.createdAt).getTime();
      const tb = new Date(b.updatedAt || b.createdAt).getTime();
      return tb - ta;
    });
    const latest = sorted[0];
    const pending = latest?.status === "pending";
    const resolved =
      latest && (latest.status === "approved" || latest.status === "rejected")
        ? latest
        : undefined;
    return { isPending: pending, outcome: resolved };
  }, [leadRequests]);

  const latestDeadlineExtension = useMemo(
    () => pickLatestDeadlineExtension(deadlineExtensions),
    [deadlineExtensions],
  );

  const outcomeView = useMemo(
    () => buildOutcomeViewModel(isPending, outcome, latestDeadlineExtension),
    [isPending, outcome, latestDeadlineExtension],
  );

  const visibleOutcomeView = useMemo(() => {
    if (!outcomeView) return null;
    if (isClientView && outcomeView.variant === "rejected") return null;
    return outcomeView;
  }, [isClientView, outcomeView]);

  useEffect(() => {
    setOutcomeDetailOpen(false);
  }, [visibleOutcomeView?.key]);

  useEffect(() => {
    if (view === "extended") {
      const id = setTimeout(() => expandedCloseRef.current?.focus(), 50);
      return () => clearTimeout(id);
    } else {
      requestTriggerRef.current?.focus();
    }
  }, [view]);

  return (
    <motion.div
      layout
      className="flex flex-col overflow-hidden rounded-[24px] w-full"
      style={{
        background: "#f7f7f7",
        willChange: "transform",
        gap: view === "extended" ? 4 : 12,
        paddingTop: view === "extended" ? 4 : 12,
        paddingLeft: 4,
        paddingRight: 4,
        paddingBottom: 4,
      }}
      transition={SPRING_LAYOUT}
      initial={{ opacity: 0, y: reduced ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {view === "closed" ? (
          <motion.div
            key="closed"
            className="flex flex-col w-full"
            style={{ gap: 12 }}
            exit={{
              opacity: 0,
              scale: 0.97,
              transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
            }}
          >
            <motion.div
              className="flex items-center justify-between shrink-0 w-full"
              style={{ paddingLeft: 10, paddingRight: 10 }}
              initial={{ opacity: 0, y: reduced ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduced ? { duration: 0.15 } : { ...SPRING_ENTRY, delay: 0.08 }}
            >
              <p
                className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#a3a3a3] select-none"
                style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
              >
                Deadline
              </p>
              {!isClientView && (
                <RequestExtensionButton
                  requested={isPending}
                  onClick={() => setView("extended")}
                  triggerRef={requestTriggerRef}
                />
              )}
            </motion.div>

            <div className="flex flex-col gap-1 w-full">
              <AnimatePresence initial={false} mode="popLayout">
                {!outcomeDetailOpen && (
                  <motion.div
                    key="deadline-stat"
                    layout
                    className="w-full"
                    initial={{ opacity: 0, y: reduced ? 0 : 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{
                      opacity: 0,
                      y: reduced ? 0 : -10,
                      transition: { duration: reduced ? 0.12 : 0.2, ease: [0.4, 0, 1, 1] },
                    }}
                    transition={
                      reduced ? { duration: 0.15 } : { ...SPRING_ENTRY, delay: 0.16 }
                    }
                  >
                    <DeadlineStatCard currentDeadline={currentDeadline} />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {visibleOutcomeView ? (
                  <DeadlineExtensionOutcomeCard
                    key={visibleOutcomeView.key}
                    model={visibleOutcomeView}
                    reduced={!!reduced}
                    detailOpen={outcomeDetailOpen}
                    onOpenDetail={() => setOutcomeDetailOpen(true)}
                    onCloseDetail={() => setOutcomeDetailOpen(false)}
                  />
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="extended"
            className="flex flex-col w-full"
            style={{ gap: 4 }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
          >
            <DeadlineExpanded
              onClose={() => setView("closed")}
              closeButtonRef={expandedCloseRef}
              onRequestSent={() => {}}
              leadId={leadId}
              currentDeadline={currentDeadline}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
