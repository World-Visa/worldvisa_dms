"use client";

import { motion, useReducedMotion } from "motion/react";
import { SPRING_PRESS } from "../deadline/deadline-motion";

const FF: React.CSSProperties = { fontFeatureSettings: "'ss11', 'calt' 0" };

interface RecentActiveTaskHeaderActionsProps {
  onViewAll: () => void;
}

export function RecentActiveTaskHeaderActions({
  onViewAll,
}: RecentActiveTaskHeaderActionsProps) {
  const reduced = useReducedMotion();

  return (
    <div
      className="flex items-center justify-between shrink-0 w-full"
      style={{ paddingLeft: 10, paddingRight: 10 }}
    >
      <p
        className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#a3a3a3] select-none"
        style={FF}
      >
        Active task
      </p>

      <motion.button
        type="button"
        onClick={onViewAll}
        aria-label="View all tasks"
        className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#525252] select-none outline-none hover:text-[#171717] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#c0d5ff] rounded-[4px]"
        style={FF}
        whileHover={reduced ? {} : { opacity: 0.72 }}
        whileTap={reduced ? {} : { scale: 0.98 }}
        transition={SPRING_PRESS}
      >
        View all
      </motion.button>
    </div>
  );
}
