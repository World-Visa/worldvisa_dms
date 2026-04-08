"use client";

import { motion, useReducedMotion } from "motion/react";

import { TableRow } from "@/components/ui/table";

export const MotionTableRow = motion(TableRow);

export function useStage2RowMotionProps(rowIndex: number) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0 },
    } as const;
  }

  const delay = Math.min(rowIndex * 0.03, 0.45);

  return {
    initial: { opacity: 0.96, y: 4 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1] as const,
      delay,
    },
  } as const;
}
