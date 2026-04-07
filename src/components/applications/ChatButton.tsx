"use client";

import { motion, useReducedMotion } from "motion/react";
import { RiMessage3Fill } from "react-icons/ri";
import { useJiggle } from "@/hooks/useJiggle";

const SPRING_PRESS = { type: "spring" as const, stiffness: 500, damping: 28 };

interface ChatButtonProps {
  onClick?: () => void;
  unreadCount?: number;
  label?: string;
}

export function ChatButton({ onClick, unreadCount = 0, label = "Start Chat" }: ChatButtonProps) {
  const reduced = useReducedMotion();
  const jiggle = useJiggle(unreadCount);

  return (
    <div className="relative shrink-0">
      <motion.button
        type="button"
        onClick={onClick}
        className="relative flex items-center gap-1.5 justify-center overflow-hidden rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#c0d5ff]"
        style={{
          padding: 6,
          backgroundImage:
            "linear-gradient(180deg, rgba(255,255,255,0.153) 6.6667%, rgba(255,255,255,0) 103.33%)," +
            "linear-gradient(90deg, #171717 0%, #171717 100%)",
          boxShadow:
            "0px 0px 0px 0.75px #171717," +
            "inset 0px 1px 2px 0px rgba(255,255,255,0.16)",
        }}
        whileHover={reduced ? {} : { opacity: 0.88 }}
        whileTap={reduced ? {} : { scale: 0.98 }}
        transition={SPRING_PRESS}
      >
        <motion.span
          className="origin-top flex items-center"
          animate={jiggle ? { rotate: [0, 15, -15, 11, -11, 7.5, -7.5, 3.75, -3.75, 1.5, 0] } : { rotate: 0 }}
          transition={{ duration: 3, ease: "easeInOut" }}
        >
          <RiMessage3Fill className="size-3.5 text-white" />
        </motion.span>
        <p
          className="font-medium text-xs leading-[20px] tracking-[-0.084px] text-white select-none"
          style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
        >
          {label}
        </p>
      </motion.button>

      {unreadCount > 0 && (
        <div className="pointer-events-none absolute -top-1.5 -right-1.5 z-10 flex h-3.5 min-w-[14px] items-center justify-center rounded-full border border-neutral-200 bg-white px-0.5 shadow-sm">
          <span className="text-[9px] font-semibold tabular-nums leading-none text-neutral-800">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        </div>
      )}
    </div>
  );
}
