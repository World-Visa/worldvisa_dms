import type React from "react";
import { motion } from "framer-motion";
import { fadeUp } from "../motion/variants";

export function InstallStepItem({
  number,
  icon,
  title,
  subtitle,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <motion.div variants={fadeUp} className="flex items-start gap-3.5">
      <div className="relative shrink-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200/70 bg-white text-primary shadow-sm shadow-black/4">
          {icon}
        </div>
        <span className="absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white shadow-sm">
          {number}
        </span>
      </div>
      <div className="pt-1.5">
        <p className="text-[13.5px] font-semibold leading-snug text-gray-900">
          {title}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-[12px] leading-relaxed text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
}

