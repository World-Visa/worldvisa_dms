"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { RiCalendarLine, RiLinkM } from "react-icons/ri";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import {
  formatKanbanCardDate,
  formatTaskStartTime,
  normalizeMeetingUrl,
} from "@/lib/constants/tasks";
import type { ApplicationTask } from "@/types/tasks";
import { DEADLINE_INNER_CARD_RADIUS_PX, DEADLINE_WHITE_CARD_SHADOW } from "../deadline/deadline-tokens";
import { SPRING_PRESS } from "../deadline/deadline-motion";

const FF: React.CSSProperties = { fontFeatureSettings: "'ss11', 'calt' 0" };

interface RecentActiveTaskCardProps {
  task: ApplicationTask;
  onClick: () => void;
}

export function RecentActiveTaskCard({ task, onClick }: RecentActiveTaskCardProps) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const { label: dateLabel, isToday } = formatKanbanCardDate(task.date);
  const timeLabel = formatTaskStartTime(task.timeStart);
  const hasLink = Boolean(task.meetingLink?.trim());
  const meetingUrl = hasLink ? normalizeMeetingUrl(task.meetingLink!) : "";

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={`View task: ${task.title}`}
      className="relative flex flex-col gap-3 px-4 py-4 shrink-0 w-full overflow-hidden text-left outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#c0d5ff]"
      style={{
        borderRadius: DEADLINE_INNER_CARD_RADIUS_PX,
        background: "white",
        boxShadow: DEADLINE_WHITE_CARD_SHADOW,
      }}
      whileHover={reduced ? {} : { y: -1 }}
      whileTap={reduced ? {} : { scale: 0.995 }}
      transition={SPRING_PRESS}
    >
      <div className="flex items-start justify-between gap-3 w-full">
        <p
          className="font-medium text-[16px] leading-[22px] tracking-[-0.096px] text-[#171717] select-none line-clamp-2 min-w-0 flex-1"
          style={FF}
        >
          {task.title}
        </p>
        <TaskStatusBadge status={task.status} />
      </div>

      {task.description?.trim() && (
        <p
          className="font-medium text-[12px] leading-[18px] tracking-[-0.06px] text-[#737373] select-none line-clamp-2 -mt-1"
          style={FF}
        >
          {task.description}
        </p>
      )}

      <div style={{ height: 1, background: "#f5f5f5", borderRadius: 1 }} />

      <div className="flex items-center justify-between w-full gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <RiCalendarLine className="size-3.5 shrink-0 text-[#a3a3a3]" />
          {mounted && isToday ? (
            <span className="rounded-md bg-[#fef2f2] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#dc2626] select-none">
              Today
            </span>
          ) : (
            <span
              className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#525252] select-none tabular-nums"
              style={FF}
            >
              {dateLabel}
            </span>
          )}
          <span className="text-[#e5e5e5] select-none">·</span>
          <span
            className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#525252] select-none tabular-nums"
            style={FF}
          >
            {timeLabel}
          </span>
        </div>

        {hasLink && (
          <a
            href={meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 shrink-0 rounded-md px-1.5 py-0.5 hover:bg-[#f5f5f5] outline-none focus-visible:ring-2 focus-visible:ring-[#c0d5ff]"
            aria-label="Open meeting link"
          >
            <RiLinkM className="size-3.5 text-[#2563eb]" />
          </a>
        )}
      </div>

      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{ boxShadow: "inset 0px -1px 1px -0.5px rgba(51,51,51,0.06)" }}
      />
    </motion.div>
  );
}
