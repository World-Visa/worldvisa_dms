"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SPRING_PRESS } from "./deadline-motion";

export function RequestExtensionButton({
  requested,
  onClick,
  triggerRef,
}: {
  requested: boolean;
  onClick: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const reduced = useReducedMotion();

  if (requested) {
    return (
      <div
        className="flex items-center justify-center rounded-[8px] px-[10px] py-[4px] select-none"
        style={{ background: "#ebebeb" }}
      >
        <span
          className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#a3a3a3]"
          style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
        >
          Request Pending
        </span>
      </div>
    );
  }

  return (
    <motion.button
      ref={triggerRef}
      onClick={onClick}
      aria-label="Request extension"
      aria-expanded={false}
      aria-haspopup="dialog"
      className="relative flex items-center justify-center overflow-hidden rounded-[8px] outline-none
        focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#c0d5ff]"
      style={{
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 4,
        paddingBottom: 4,
        backgroundImage:
          "linear-gradient(180deg, rgba(255,255,255,0.153) 6.6667%, rgba(255,255,255,0) 103.33%)," +
          "linear-gradient(90deg, #171717 0%, #171717 100%)",
        boxShadow:
          "0px 0px 0px 0.75px #171717," +
          "inset 0px 1px 2px 0px rgba(255,255,255,0.16)",
      }}
      whileHover={reduced ? {} : { opacity: 0.88 }}
      whileTap={reduced ? {} : { scale: 0.96 }}
      transition={SPRING_PRESS}
    >
      <span
        className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-white select-none"
        style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
      >
        Request Extension
      </span>
    </motion.button>
  );
}
