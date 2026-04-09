"use client";

import { computeDaysLeft, formatDeadlineDate } from "./deadline-date-utils";
import { DEADLINE_INNER_CARD_RADIUS_PX, DEADLINE_WHITE_CARD_SHADOW } from "./deadline-tokens";

export function DeadlineStatCard({ currentDeadline }: { currentDeadline?: string }) {
  const daysLeft = computeDaysLeft(currentDeadline);
  const dateLabel = formatDeadlineDate(currentDeadline);
  const isOverdue = daysLeft !== null && daysLeft < 0;

  return (
    <div
      className="relative flex flex-col gap-3 px-4 py-4 shrink-0 w-full overflow-hidden"
      style={{
        borderRadius: DEADLINE_INNER_CARD_RADIUS_PX,
        background: "white",
        boxShadow: DEADLINE_WHITE_CARD_SHADOW,
      }}
    >
      <div className="flex items-baseline gap-2">
        <span
          className="font-medium select-none"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 40,
            lineHeight: "44px",
            letterSpacing: "-1.2px",
            color: isOverdue ? "#ef4444" : "#171717",
            fontVariantNumeric: "tabular-nums",
            fontFeatureSettings: "'ss11', 'calt' 0",
          }}
        >
          {daysLeft === null ? "—" : Math.abs(daysLeft)}
        </span>
        <span
          className="font-medium text-[16px] leading-[24px] tracking-[-0.096px] select-none"
          style={{
            fontFeatureSettings: "'ss11', 'calt' 0",
            color: "#a3a3a3",
          }}
        >
          {daysLeft === null ? "" : isOverdue ? "days passed" : "days left"}
        </span>
      </div>

      <div style={{ height: 1, background: "#f5f5f5", borderRadius: 1 }} />

      <div className="flex items-center justify-between w-full">
        <span
          className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#a3a3a3] select-none"
          style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
        >
          Target Date
        </span>
        <span
          className="font-medium text-[14px] leading-[20px] tracking-[-0.084px] text-[#171717] select-none"
          style={{ fontFeatureSettings: "'ss11', 'calt' 0", fontVariantNumeric: "tabular-nums" }}
        >
          {dateLabel}
        </span>
      </div>

      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{
          boxShadow: "inset 0px -1px 1px -0.5px rgba(51,51,51,0.06)",
        }}
      />
    </div>
  );
}
