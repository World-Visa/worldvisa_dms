"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/constants/users";
import type { DeadlineOutcomeViewModel } from "./deadline-outcome-model";
import { SPRING_OUTCOME } from "./deadline-motion";
import { OutcomeReasonClamp } from "./OutcomeReasonClamp";
import {
  DEADLINE_EXPANDED_PANEL_GRAY,
  DEADLINE_WHITE_CARD_SHADOW,
} from "./deadline-tokens";

export function DeadlineExtensionOutcomeCard({
  model,
  reduced,
  detailOpen,
  onOpenDetail,
  onCloseDetail,
}: {
  model: DeadlineOutcomeViewModel;
  reduced: boolean;
  detailOpen: boolean;
  onOpenDetail: () => void;
  onCloseDetail: () => void;
}) {
  const isApproved = model.variant === "approved";
  const fromExtensionDoc =
    model.extensionNewDateLabel != null ||
    model.extensionPreviousDateLabel != null ||
    model.requestedBy != null ||
    model.approvedAtLabel != null;
  const hasDateShift =
    model.extensionPreviousDateLabel != null || model.extensionNewDateLabel != null;
  const sectionTitle =
    model.variant === "rejected"
      ? "Reason for rejection"
      : fromExtensionDoc
        ? "Extension approved"
        : "Reason for extension";
  const footerLabel = isApproved ? "Approved by" : "Rejected by";
  const initials = getInitials(
    model.actorUsername,
    model.actorFullName ?? model.actorDisplayName,
  );

  const panelBg = detailOpen ? "white" : DEADLINE_EXPANDED_PANEL_GRAY;
  const panelShadow = detailOpen ? DEADLINE_WHITE_CARD_SHADOW : undefined;
  const dividerColor = detailOpen ? "#f5f5f5" : "rgba(0,0,0,0.08)";
  const insetVignette = detailOpen
    ? "inset 0px -1px 1px -0.5px rgba(51,51,51,0.06)"
    : "inset 0px -1px 1px -0.5px rgba(51,51,51,0.05)";

  return (
    <motion.div
      layout
      className="relative flex flex-col gap-2 shrink-0 w-full overflow-hidden rounded-[16px] py-2 px-3"
      style={{ background: panelBg, boxShadow: panelShadow }}
      initial={{ opacity: 0, y: reduced ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : -6, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } }}
      transition={reduced ? { duration: 0.15 } : SPRING_OUTCOME}
    >
      <p
        className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#a3a3a3] select-none"
        style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
      >
        {sectionTitle}
      </p>

      <OutcomeReasonClamp
        bodyText={model.bodyText}
        detailOpen={detailOpen}
        onViewMore={onOpenDetail}
        onViewLess={onCloseDetail}
      />

      <div style={{ height: 1, background: dividerColor, borderRadius: 1 }} />

      <div className="flex flex-col gap-1.5 pb-0.5">
        <div className="flex items-center gap-2 min-w-0 text-xs justify-between">
          <span
            className="font-medium text-[11px] leading-[10px] text-[#a3a3a3] shrink-0 select-none"
            style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
          >
            {footerLabel}
          </span>
          <div className="flex items-center gap-1 min-w-0">
            <Avatar
              className={`h-4 w-4 shrink-0 border ${detailOpen ? "border-[#f5f5f5]" : "border-white/80"}`}
            >
              <AvatarImage src={model.actorAvatarUrl ?? undefined} alt={model.actorDisplayName} />
              <AvatarFallback className="text-[10px] font-medium bg-white text-[#171717]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span
              className="font-medium text-[11px] leading-[10px] text-[#171717] truncate min-w-0 select-none"
              style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
            >
              {model.actorDisplayName}
            </span>
          </div>
        </div>
      </div>

      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{ boxShadow: insetVignette }}
      />
    </motion.div>
  );
}
