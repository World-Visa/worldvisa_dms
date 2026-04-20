"use client";

import { motion } from "framer-motion";
import { SPRING_PRESS } from "../deadline/deadline-motion";
import { RiFileAddLine } from "react-icons/ri";

export interface StageDocumentsHeaderActionProps {
  isClientView?: boolean;
  label: string;
  onClick: () => void;
  buttonClassName?: string;
}

export function StageDocumentsHeaderAction({
  isClientView = false,
  label,
  onClick,
}: StageDocumentsHeaderActionProps) {
  if (isClientView) {
    return null;
  }

  return (
    <div className="flex justify-end">
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
        whileHover={{ opacity: 0.88 }}
        whileTap={{ scale: 0.98 }}
        transition={SPRING_PRESS}
      >
        <motion.span
          className="origin-top flex items-center"
          transition={{ duration: 3, ease: "easeInOut" }}
        >
          <RiFileAddLine className="size-3.5 text-white" />
        </motion.span>
        <p
          className="font-medium text-xs leading-[20px] tracking-[-0.084px] text-white select-none"
          style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
        >
          {label}
        </p>
      </motion.button>
    </div>
  );
}

