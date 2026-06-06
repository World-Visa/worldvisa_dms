"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import {
  RiAddLine,
  RiArrowDownSLine,
  RiListCheck2,
  RiTaskLine,
} from "react-icons/ri";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/primitives/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useCreateTask } from "@/hooks/useApplicationTasks";
import { isClientRole } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { AddTaskPopover } from "./AddTaskPopover";
import { TasksListSheet } from "./TasksListSheet";

const SPRING_PRESS = { type: "spring" as const, stiffness: 500, damping: 28 };

const DARK_BUTTON_SURFACE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(180deg, rgba(255,255,255,0.153) 6.6667%, rgba(255,255,255,0) 103.33%)," +
    "linear-gradient(90deg, #171717 0%, #171717 100%)",
  boxShadow:
    "0px 0px 0px 0.75px #171717," +
    "inset 0px 1px 2px 0px rgba(255,255,255,0.16)",
};

interface TaskTriggerProps {
  applicationId: string;
}

function useDarkButtonMotion() {
  const reduced = useReducedMotion();
  return {
    whileHover: reduced ? {} : { opacity: 0.88 },
    whileTap: reduced ? {} : { scale: 0.98 },
    transition: SPRING_PRESS,
  };
}

const TaskTrigger = ({ applicationId }: TaskTriggerProps) => {
  const { user } = useAuth();
  const isClientView = isClientRole(user?.role);
  const motionProps = useDarkButtonMotion();
  const createTaskMutation = useCreateTask(applicationId);

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isTasksListOpen, setIsTasksListOpen] = useState(false);
  const [addTaskSession, setAddTaskSession] = useState(0);

  const handleAddTaskOpenChange = (open: boolean) => {
    setIsAddTaskOpen(open);
    if (open) setAddTaskSession((k) => k + 1);
  };

  const labelClass =
    "select-none text-xs font-medium leading-[20px] tracking-[-0.084px] text-white";

  return (
    <>
      <div className="relative shrink-0">
        {!isClientView ? (
          <div
            className="inline-flex items-stretch overflow-hidden rounded-[8px]"
            style={DARK_BUTTON_SURFACE}
          >
            <motion.button
              type="button"
              aria-expanded={isAddTaskOpen}
              aria-haspopup="dialog"
              onClick={() => handleAddTaskOpenChange(true)}
              className={cn(
                "relative flex items-center gap-1.5 border-r border-white/12 px-2.5 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#c0d5ff]",
                isAddTaskOpen && "bg-white/8",
              )}
              {...motionProps}
            >
              <RiAddLine className="size-3.5 shrink-0 text-white" />
              <span
                className={labelClass}
                style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
              >
                Add task
              </span>
            </motion.button>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <motion.button
                  type="button"
                  aria-label="More task actions"
                  className="relative flex items-center justify-center px-2 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#c0d5ff]"
                  {...motionProps}
                >
                  <RiArrowDownSLine className="size-3.5 text-white/90" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="mt-1 w-44 rounded-xl border border-neutral-200/80 bg-white p-1 shadow-[0px_8px_24px_rgba(0,0,0,0.08)]"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem
                  className="cursor-pointer rounded-lg px-2.5 py-2 text-sm font-light text-neutral-800 focus:bg-neutral-100"
                  onSelect={() => setIsTasksListOpen(true)}
                >
                  <RiListCheck2 className="size-4 text-neutral-500" />
                  View all tasks
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <motion.button
            type="button"
            onClick={() => setIsTasksListOpen(true)}
            className={cn(
              "relative flex items-center gap-1.5 overflow-hidden rounded-[8px] px-2.5 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#c0d5ff]",
            )}
            style={DARK_BUTTON_SURFACE}
            {...motionProps}
          >
            <RiTaskLine className="size-3.5 shrink-0 text-white" />
            <span
              className={labelClass}
              style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
            >
              Tasks
            </span>
          </motion.button>
        )}
      </div>

      {!isClientView && (
        <Dialog open={isAddTaskOpen} onOpenChange={handleAddTaskOpenChange}>
          <DialogContent
            showCloseButton={false}
            className="w-[min(100vw-2rem,400px)] max-w-[400px] gap-0 overflow-visible border-0 bg-transparent p-0 shadow-none sm:max-w-[400px]"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest('[role="toolbar"]')) {
                e.preventDefault();
              }
            }}
          >
            <DialogTitle className="sr-only">Add task</DialogTitle>
            <AddTaskPopover
              key={addTaskSession}
              applicationId={applicationId}
              onClose={() => setIsAddTaskOpen(false)}
              onSave={async (data) => {
                await createTaskMutation.mutateAsync(data);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      <TasksListSheet
        open={isTasksListOpen}
        onOpenChange={setIsTasksListOpen}
        applicationId={applicationId}
        isClientView={isClientView}
      />
    </>
  );
};

export default TaskTrigger;
