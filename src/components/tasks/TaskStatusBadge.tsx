"use client";

import { TASK_STATUS_CONFIG } from "@/lib/constants/tasks";
import type { TaskStatus } from "@/types/tasks";

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = TASK_STATUS_CONFIG[status];

  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-[16px] tracking-[-0.044px] select-none"
      style={{
        backgroundColor: config.bg,
        color: config.color,
        borderColor: config.border,
        fontFeatureSettings: "'ss11', 'calt' 0",
      }}
    >
      {config.label}
    </span>
  );
}
