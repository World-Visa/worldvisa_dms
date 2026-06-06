"use client";

import { useDraggable } from "@dnd-kit/core";
import type { ApplicationTask, TaskFormData } from "@/types/tasks";
import { cn } from "@/lib/utils";
import { TaskListCard } from "../TaskListCard";

interface KanbanDraggableTaskProps {
  task: ApplicationTask;
  index: number;
  onSave: (taskId: string, data: TaskFormData) => void | Promise<void>;
  onDelete: (taskId: string) => void | Promise<void>;
}

export function KanbanDraggableTask({
  task,
  index,
  onSave,
  onDelete,
}: KanbanDraggableTaskProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { type: "task", task, status: task.status },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-full shrink-0 touch-none",
        isDragging && "pointer-events-none opacity-0",
      )}
      {...listeners}
      {...attributes}
    >
      <TaskListCard
        task={task}
        index={index}
        isClientView={false}
        onSave={onSave}
        onDelete={onDelete}
        variant="kanban"
        showClientAvatar
        hideStatusBadge
        disableAnimations
      />
    </div>
  );
}
