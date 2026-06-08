"use client";

import { RiTaskLine } from "react-icons/ri";
import { DEADLINE_INNER_CARD_RADIUS_PX, DEADLINE_WHITE_CARD_SHADOW } from "../deadline/deadline-tokens";

const FF: React.CSSProperties = { fontFeatureSettings: "'ss11', 'calt' 0" };

interface RecentActiveTaskEmptyProps {
  isClientView?: boolean;
}

export function RecentActiveTaskEmpty({
  isClientView = false,
}: RecentActiveTaskEmptyProps) {
  return (
    <div
      className="relative flex flex-col items-center gap-3 px-4 py-6 shrink-0 w-full overflow-hidden text-center"
      style={{
        borderRadius: DEADLINE_INNER_CARD_RADIUS_PX,
        background: "white",
        boxShadow: DEADLINE_WHITE_CARD_SHADOW,
      }}
    >
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: 40, height: 40, background: "#f5f5f5" }}
      >
        <RiTaskLine className="size-5 text-[#a3a3a3]" />
      </div>

      <div className="flex flex-col gap-1">
        <p
          className="font-medium text-[14px] leading-[20px] tracking-[-0.084px] text-[#171717] select-none"
          style={FF}
        >
          No active tasks
        </p>
        <p
          className="font-medium text-[12px] leading-[18px] tracking-[-0.06px] text-[#a3a3a3] select-none"
          style={FF}
        >
          {isClientView
            ? "Tasks assigned to you will appear here"
            : "Active tasks for this application will appear here"}
        </p>
      </div>

      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{ boxShadow: "inset 0px -1px 1px -0.5px rgba(51,51,51,0.06)" }}
      />
    </div>
  );
}
