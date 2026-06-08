"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { TasksListSheet } from "@/components/tasks/TasksListSheet";
import { useRecentActiveTask } from "@/hooks/useRecentActiveTask";
import { SPRING_ENTRY, SPRING_LAYOUT } from "../deadline/deadline-motion";
import { RecentActiveTaskCard } from "./RecentActiveTaskCard";
import { RecentActiveTaskEmpty } from "./RecentActiveTaskEmpty";
import { RecentActiveTaskHeaderActions } from "./RecentActiveTaskHeaderActions";
import { RecentActiveTaskCardSkeleton } from "./RecentActiveTaskWidgetSkeleton";

interface RecentActiveTaskWidgetProps {
  leadId: string;
  isClientView?: boolean;
}

export default function RecentActiveTaskWidget({
  leadId,
  isClientView = false,
}: RecentActiveTaskWidgetProps) {
  const reduced = useReducedMotion();
  const { task, isLoading, isError, refetch } = useRecentActiveTask({
    leadId,
    isClientView,
  });

  const [isTasksListOpen, setIsTasksListOpen] = useState(false);
  const openTasksList = () => setIsTasksListOpen(true);

  const showSkeleton = isLoading && task === null;
  const showEmpty = !isLoading && !isError && task === null;
  const showCard = task !== null;

  return (
    <>
      <motion.div
        layout
        className="flex flex-col overflow-hidden rounded-[24px] w-full"
        style={{
          background: "#f7f7f7",
          willChange: "transform",
          gap: 12,
          paddingTop: 12,
          paddingLeft: 4,
          paddingRight: 4,
          paddingBottom: 4,
        }}
        transition={SPRING_LAYOUT}
        initial={{ opacity: 0, y: reduced ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0.15 } : { ...SPRING_ENTRY, delay: 0.08 }}
        >
          <RecentActiveTaskHeaderActions onViewAll={openTasksList} />
        </motion.div>

        {showSkeleton ? (
          <RecentActiveTaskCardSkeleton />
        ) : (
          <div className="flex flex-col gap-1 w-full">
            <AnimatePresence mode="popLayout" initial={false}>
              {showCard && task && (
                <motion.div
                  key={task.id}
                  layout
                  className="w-full"
                  initial={{ opacity: 0, y: reduced ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    y: reduced ? 0 : -10,
                    transition: { duration: reduced ? 0.12 : 0.2, ease: [0.4, 0, 1, 1] },
                  }}
                  transition={
                    reduced ? { duration: 0.15 } : { ...SPRING_ENTRY, delay: 0.16 }
                  }
                >
                  <RecentActiveTaskCard task={task} onClick={openTasksList} />
                </motion.div>
              )}

              {showEmpty && (
                <motion.div
                  key="empty"
                  layout
                  className="w-full"
                  initial={{ opacity: 0, y: reduced ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    y: reduced ? 0 : -10,
                    transition: { duration: reduced ? 0.12 : 0.2, ease: [0.4, 0, 1, 1] },
                  }}
                  transition={
                    reduced ? { duration: 0.15 } : { ...SPRING_ENTRY, delay: 0.16 }
                  }
                >
                  <RecentActiveTaskEmpty isClientView={isClientView} />
                </motion.div>
              )}

              {isError && (
                <motion.div
                  key="error"
                  layout
                  className="w-full flex flex-col items-center gap-2 px-4 py-6 rounded-[16px] bg-white text-center"
                  style={{
                    boxShadow:
                      "0px 4px 8px -2px rgba(51,51,51,0.06)," +
                      "0px 2px 4px 0px rgba(51,51,51,0.04)," +
                      "0px 1px 2px 0px rgba(51,51,51,0.04)," +
                      "0px 0px 0px 1px #f5f5f5",
                  }}
                  initial={{ opacity: 0, y: reduced ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    reduced ? { duration: 0.15 } : { ...SPRING_ENTRY, delay: 0.16 }
                  }
                >
                  <p
                    className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#525252] select-none"
                    style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
                  >
                    Couldn&apos;t load tasks
                  </p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="text-[12px] font-medium text-[#171717] hover:opacity-70 outline-none focus-visible:ring-2 focus-visible:ring-[#c0d5ff] rounded"
                  >
                    Retry
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <TasksListSheet
        open={isTasksListOpen}
        onOpenChange={setIsTasksListOpen}
        applicationId={leadId}
        isClientView={isClientView}
      />
    </>
  );
}
