"use client";

import { useMemo, useState } from "react";
import { RiLoader4Line, RiRefreshLine, RiTaskLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { TasksFilterBar } from "@/components/tasks/TasksFilterBar";
import {
  useBoardDeleteTask,
  useBoardUpdateTask,
  useInfiniteAllTasks,
  useUpdateTaskStatusMutation,
} from "@/hooks/useApplicationTasks";
import { useDebounce } from "@/hooks/useDebounce";
import { taskDatePresetToApiRange } from "@/lib/constants/tasks";
import type { TaskDateRangePreset, TaskFormData, TaskStatus } from "@/types/tasks";
import { NewTaskButton, NewTaskDialog } from "./NewTaskDialog";
import { TasksKanbanBoard } from "./TasksKanbanBoard";

function KanbanBoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {[1, 2, 3].map((col) => (
        <div key={col} className="min-w-[280px] flex-1 space-y-2">
          <div className="h-10 w-full animate-pulse rounded-xl bg-neutral-200/80" />
          <div className="h-[120px] w-full animate-pulse rounded-[16px] bg-neutral-200/80" />
          <div className="h-[120px] w-full animate-pulse rounded-[16px] bg-neutral-200/80" />
        </div>
      ))}
    </div>
  );
}

export function TasksBoardClient() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | undefined>();
  const [datePreset, setDatePreset] = useState<TaskDateRangePreset | undefined>();
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 400);
  const dateRange = datePreset ? taskDatePresetToApiRange(datePreset) : undefined;

  const filters = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      status,
      dateFrom: dateRange?.dateFrom,
      dateTo: dateRange?.dateTo,
      limit: 50,
      sortBy: "date",
      sortOrder: "asc" as const,
    }),
    [debouncedSearch, status, dateRange?.dateFrom, dateRange?.dateTo],
  );

  const {
    tasks,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteAllTasks(filters);

  const statusMutation = useUpdateTaskStatusMutation();
  const updateTaskMutation = useBoardUpdateTask();
  const deleteTaskMutation = useBoardDeleteTask();

  const hasActiveFilters =
    search.trim() !== "" || Boolean(status) || Boolean(datePreset);

  const handleClearFilters = () => {
    setSearch("");
    setStatus(undefined);
    setDatePreset(undefined);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  };

  const handleStatusChange = async (
    taskId: string,
    newStatus: TaskStatus,
    leadId: string,
  ) => {
    await statusMutation.mutateAsync({ taskId, status: newStatus, leadId });
  };

  const handleSave = async (
    taskId: string,
    data: TaskFormData,
    leadId: string,
  ) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    await updateTaskMutation.mutateAsync({
      taskId,
      data,
      previousStatus: task.status,
      leadId,
    });
  };

  const handleDelete = async (taskId: string, leadId: string) => {
    await deleteTaskMutation.mutateAsync({ taskId, leadId });
  };

  return (
    <main className="min-h-full px-2 pb-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h1
            className="text-xl font-semibold text-neutral-900 md:text-2xl"
            style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
          >
            Tasks
          </h1>
          <NewTaskButton onClick={() => setIsNewTaskOpen(true)} />
        </div>

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

        {isLoading ? (
          <KanbanBoardSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 text-center">
            <p className="text-sm font-semibold text-neutral-800">Failed to load tasks</p>
            <p className="mt-1.5 text-xs text-neutral-500">
              Something went wrong while fetching tasks.
            </p>
            <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => refetch()}>
              <RiRefreshLine className="size-3.5" />
              Retry
            </Button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[#f7f7f7] shadow-sm">
              <RiTaskLine className="size-5 text-neutral-400" />
            </div>
            <p className="text-sm font-semibold text-neutral-800">
              {hasActiveFilters ? "No matching tasks" : "No tasks yet"}
            </p>
            <p className="mt-1.5 max-w-[280px] text-xs text-neutral-500">
              {hasActiveFilters
                ? "Try adjusting your search, status, or date filter."
                : "Create a task or add tasks from an application to see them here."}
            </p>
          </div>
        ) : (
          <>
            <TasksKanbanBoard
              tasks={tasks}
              onStatusChange={handleStatusChange}
              onSave={handleSave}
              onDelete={handleDelete}
              onLoadMore={handleLoadMore}
              isLoadingMore={isFetchingNextPage}
            />
          </>
        )}
      </div>

      <NewTaskDialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen} />
    </main>
  );
}
