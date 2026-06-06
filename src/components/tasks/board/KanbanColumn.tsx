"use client";

import { useCallback, useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { motion, useReducedMotion } from "framer-motion";
import {
  KANBAN_COLUMN_HEIGHT,
  TASK_KANBAN_INNER_SHADOW,
  TASK_STATUS_CONFIG,
} from "@/lib/constants/tasks";
import type { ApplicationTask, TaskFormData, TaskStatus } from "@/types/tasks";
import { KanbanDraggableTask } from "./KanbanDraggableTask";

const mountSpring = { type: "spring" as const, duration: 0.45, bounce: 0 };

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  tasks: ApplicationTask[];
  columnIndex: number;
  onSave: (taskId: string, data: TaskFormData) => void | Promise<void>;
  onDelete: (taskId: string) => void | Promise<void>;
  onReachEnd?: () => void;
  isLoadingMore?: boolean;
}

export function KanbanColumn({
  status,
  label,
  tasks,
  columnIndex,
  onSave,
  onDelete,
  onReachEnd,
  isLoadingMore = false,
}: KanbanColumnProps) {
  const reduced = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadMoreLock = useRef(false);
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: "column", status },
  });
  const config = TASK_STATUS_CONFIG[status];

  useEffect(() => {
    if (!isLoadingMore) {
      loadMoreLock.current = false;
    }
  }, [isLoadingMore]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !onReachEnd || loadMoreLock.current) return;

    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 96) {
      loadMoreLock.current = true;
      onReachEnd();
    }
  }, [onReachEnd]);

  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...mountSpring, delay: columnIndex * 0.06 }}
      className="flex min-w-[300px] flex-1 flex-col"
      style={{ height: KANBAN_COLUMN_HEIGHT }}
    >
      <div
        ref={setNodeRef}
        className={`flex h-full flex-col gap-2 rounded-[20px] bg-[#f7f7f7] px-1 pb-1 pt-3 transition-colors ${
          isOver ? "ring-2 ring-[#335cff]/25 ring-offset-2 ring-offset-[#f7f7f7]" : ""
        }`}
      >
        <div className="flex shrink-0 items-center gap-2 px-3">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <span
            className="flex-1 text-[14px] font-medium leading-5 tracking-[-0.084px] text-[#171717]"
            style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
          >
            {label}
          </span>
          <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-[#737373] shadow-sm">
            {tasks.length}
          </span>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto rounded-[16px] bg-white p-2 [scrollbar-width:thin]"
          style={{ boxShadow: TASK_KANBAN_INNER_SHADOW }}
        >
          {tasks.length === 0 ? (
            <div className="flex min-h-[120px] flex-1 items-center justify-center rounded-[12px] border border-dashed border-[#ebebeb] bg-[#fafafa] py-10">
              <p className="text-xs font-medium text-[#a3a3a3]">Drop tasks here</p>
            </div>
          ) : (
            tasks.map((task, index) => (
              <KanbanDraggableTask
                key={task.id}
                task={task}
                index={index}
                onSave={onSave}
                onDelete={onDelete}
              />
            ))
          )}

          {isLoadingMore ? (
            <div className="flex items-center justify-center py-2">
              <div className="size-4 animate-spin rounded-full border-2 border-[#ebebeb] border-t-[#737373]" />
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
