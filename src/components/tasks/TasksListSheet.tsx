"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SPRING_OUTCOME } from "@/components/applications/deadline/deadline-motion";
import {
  useDeleteTask,
  useInfiniteApplicationTasks,
  useInfiniteClientTasks,
  useUpdateTask,
} from "@/hooks/useApplicationTasks";
import { useDebounce } from "@/hooks/useDebounce";
import { taskDatePresetToApiRange } from "@/lib/constants/tasks";
import type { TaskDateRangePreset, TaskFormData, TaskStatus } from "@/types/tasks";
import { RiListCheck2, RiLoader4Line, RiRefreshLine, RiSearchLine, RiTaskLine } from "react-icons/ri";
import { TaskListCard } from "./TaskListCard";
import { TasksFilterBar } from "./TasksFilterBar";

interface TasksListSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  isClientView?: boolean;
}

function TaskListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[120px] animate-pulse rounded-[16px] bg-white"
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  );
}

export function TasksListSheet({
  open,
  onOpenChange,
  applicationId,
  isClientView = false,
}: TasksListSheetProps) {
  const reduced = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | undefined>();
  const [datePreset, setDatePreset] = useState<TaskDateRangePreset | undefined>();
  const debouncedSearch = useDebounce(search, 400);

  const dateRange = datePreset ? taskDatePresetToApiRange(datePreset) : undefined;

  const adminTasksQuery = useInfiniteApplicationTasks(
    {
      leadId: applicationId,
      search: debouncedSearch.trim() || undefined,
      status,
      dateFrom: dateRange?.dateFrom,
      dateTo: dateRange?.dateTo,
      limit: 20,
      sortBy: "date",
      sortOrder: "asc",
    },
    { enabled: open && !isClientView },
  );

  const clientTasksQuery = useInfiniteClientTasks(
    {
      search: debouncedSearch.trim() || undefined,
      status,
      dateFrom: dateRange?.dateFrom,
      dateTo: dateRange?.dateTo,
      limit: 20,
      sortBy: "date",
      sortOrder: "asc",
    },
    { enabled: open && isClientView },
  );

  const {
    tasks,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = isClientView ? clientTasksQuery : adminTasksQuery;

  const updateTaskMutation = useUpdateTask(applicationId);
  const deleteTaskMutation = useDeleteTask(applicationId);

  const hasActiveFilters =
    search.trim() !== "" || Boolean(status) || Boolean(datePreset);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSearch("");
      setStatus(undefined);
      setDatePreset(undefined);
    }
    onOpenChange(next);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus(undefined);
    setDatePreset(undefined);
  };

  const handleUpdate = async (taskId: string, data: TaskFormData, previousStatus: TaskStatus) => {
    if (isClientView) return;
    await updateTaskMutation.mutateAsync({ taskId, data, previousStatus });
  };

  const handleDelete = async (taskId: string) => {
    if (isClientView) return;
    await deleteTaskMutation.mutateAsync(taskId);
  };

  useEffect(() => {
    const root = scrollRef.current;
    const el = sentinelRef.current;
    if (!el || !root || !open) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root, threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [open, hasNextPage, isFetchingNextPage, fetchNextPage, tasks.length]);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex h-full max-h-dvh flex-col gap-0 bg-[#f7f7f7] p-0 sm:max-w-md">
        <SheetHeader className="shrink-0 p-0">
          <SheetTitle className="sr-only">All tasks</SheetTitle>
          <header className="flex h-11 shrink-0 items-center gap-3 border-b border-[#ebebeb] bg-white px-4 pr-12">
            <RiListCheck2 className="size-[18px] shrink-0 text-neutral-500" />
            <span
              className="flex-1 truncate text-sm font-semibold text-neutral-900"
              style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
            >
              All tasks
            </span>
          </header>
        </SheetHeader>

        {open && (
          <div className="shrink-0 border-b border-[#ebebeb] bg-white px-3">
            <TasksFilterBar
              search={search}
              status={status}
              datePreset={datePreset}
              onSearchChange={setSearch}
              onStatusChange={setStatus}
              onDatePresetChange={setDatePreset}
              onClearFilters={handleClearFilters}
              isLoading={isLoading || isFetchingNextPage}
            />
          </div>
        )}

        <div
          ref={scrollRef}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3"
          data-application-id={applicationId}
        >
          {isLoading ? (
            <TaskListSkeleton />
          ) : isError ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
              <p className="text-sm font-semibold text-neutral-800">Failed to load tasks</p>
              <p className="mt-1.5 max-w-[240px] text-xs leading-relaxed text-neutral-500">
                Something went wrong while fetching tasks.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 gap-1.5"
                onClick={() => refetch()}
              >
                <RiRefreshLine className="size-3.5" />
                Retry
              </Button>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                {hasActiveFilters ? (
                  <RiSearchLine className="size-5 text-neutral-400" />
                ) : (
                  <RiTaskLine className="size-5 text-neutral-400" />
                )}
              </div>
              <p className="text-sm font-semibold text-neutral-800">
                {hasActiveFilters ? "No matching tasks" : "No tasks yet"}
              </p>
              <p className="mt-1.5 max-w-[240px] text-xs leading-relaxed text-neutral-500">
                {hasActiveFilters
                  ? "Try adjusting your search, status, or date filter."
                  : "Tasks for this application will appear here once they are created."}
              </p>
            </div>
          ) : (
            <motion.div
              layout
              className="flex flex-col gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={reduced ? { duration: 0.15 } : SPRING_OUTCOME}
            >
              {tasks.map((task, index) => (
                <TaskListCard
                  key={task.id}
                  task={task}
                  index={index}
                  isClientView={isClientView}
                  onSave={(taskId, data) => handleUpdate(taskId, data, task.status)}
                  onDelete={handleDelete}
                />
              ))}

              <div ref={sentinelRef} className="h-1 w-full shrink-0" />

              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-3">
                  <RiLoader4Line className="size-5 animate-spin text-neutral-400" />
                </div>
              )}
            </motion.div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
