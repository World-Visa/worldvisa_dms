"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  KANBAN_COLUMNS,
  groupTasksByStatus,
  resolveKanbanDropStatus,
} from "@/lib/constants/tasks";
import type { ApplicationTask, TaskFormData, TaskStatus } from "@/types/tasks";
import { TaskListCard } from "../TaskListCard";
import { KanbanColumn } from "./KanbanColumn";

interface TasksKanbanBoardProps {
  tasks: ApplicationTask[];
  onStatusChange: (
    taskId: string,
    status: TaskStatus,
    leadId: string,
  ) => void | Promise<void>;
  onSave: (taskId: string, data: TaskFormData, leadId: string) => void | Promise<void>;
  onDelete: (taskId: string, leadId: string) => void | Promise<void>;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export function TasksKanbanBoard({
  tasks,
  onStatusChange,
  onSave,
  onDelete,
  onLoadMore,
  isLoadingMore = false,
}: TasksKanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<ApplicationTask | null>(null);

  const boardTasks = useMemo(
    () => tasks.filter((t) => t.status !== "cancelled"),
    [tasks],
  );
  const grouped = useMemo(() => groupTasksByStatus(boardTasks), [boardTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as ApplicationTask | undefined;
    if (task) setActiveTask(task);
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveTask(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const task = active.data.current?.task as ApplicationTask | undefined;
    if (!task) return;

    const newStatus = resolveKanbanDropStatus(
      over.id,
      over.data.current as { type?: string; status?: TaskStatus } | undefined,
      boardTasks,
    );

    if (!newStatus || task.status === newStatus) return;

    try {
      await onStatusChange(task.id, newStatus, task.applicationId);
    } catch {
      toast.error("Failed to update task status");
    }
  };

  const handleSave =
    (leadId: string) => (taskId: string, data: TaskFormData) =>
      onSave(taskId, data, leadId);

  const handleDelete =
    (leadId: string) => (taskId: string) => onDelete(taskId, leadId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex items-stretch gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map(({ id, label }, columnIndex) => (
          <KanbanColumn
            key={id}
            status={id}
            label={label}
            columnIndex={columnIndex}
            tasks={grouped[id]}
            onSave={(taskId, data) => {
              const task = tasks.find((t) => t.id === taskId);
              if (task) return onSave(taskId, data, task.applicationId);
            }}
            onDelete={(taskId) => {
              const task = tasks.find((t) => t.id === taskId);
              if (task) return onDelete(taskId, task.applicationId);
            }}
            onReachEnd={onLoadMore}
            isLoadingMore={isLoadingMore}
          />
        ))}
      </div>

      <DragOverlay
        dropAnimation={{ duration: 200, easing: "ease-out" }}
        style={{ cursor: "grabbing" }}
      >
        {activeTask ? (
          <div className="w-[min(100%,284px)] rotate-1 shadow-lg">
            <TaskListCard
              task={activeTask}
              index={0}
              isClientView={false}
              onSave={handleSave(activeTask.applicationId)}
              onDelete={handleDelete(activeTask.applicationId)}
              variant="kanban"
              showClientAvatar
              hideStatusBadge
              disableAnimations
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
