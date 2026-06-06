import type {
  ApplicationTask,
  TaskDateRangePreset,
  TaskFormData,
  TaskStatus,
  TimeParts,
} from "@/types/tasks";

export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  todo: {
    label: "Todo",
    bg: "#f5f5f5",
    color: "#525252",
    border: "#e5e5e5",
  },
  in_progress: {
    label: "In progress",
    bg: "#eff6ff",
    color: "#2563eb",
    border: "#bfdbfe",
  },
  completed: {
    label: "Completed",
    bg: "#f0fdf4",
    color: "#16a34a",
    border: "#bbf7d0",
  },
  cancelled: {
    label: "Cancelled",
    bg: "#fef2f2",
    color: "#dc2626",
    border: "#fecaca",
  },
};

export const TASK_STATUS_OPTIONS: TaskStatus[] = [
  "todo",
  "in_progress",
  "completed",
  "cancelled",
];

export const TASK_STATUS_FILTER_OPTIONS = TASK_STATUS_OPTIONS.map((value) => ({
  label: TASK_STATUS_CONFIG[value].label,
  value,
}));

export const TASK_DATE_RANGE_OPTIONS: {
  value: TaskDateRangePreset;
  label: string;
}[] = [
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7d", label: "Last 7 days" },
  { value: "last_30d", label: "Last 30 days" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "this_week", label: "This week" },
];

function toApiDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

export function taskDatePresetToApiRange(
  preset: TaskDateRangePreset,
): { dateFrom: string; dateTo: string } {
  const today = startOfLocalDay(new Date());

  switch (preset) {
    case "yesterday": {
      const yesterday = addDays(today, -1);
      return { dateFrom: toApiDate(yesterday), dateTo: toApiDate(yesterday) };
    }
    case "last_7d":
      return { dateFrom: toApiDate(addDays(today, -6)), dateTo: toApiDate(today) };
    case "last_30d":
      return { dateFrom: toApiDate(addDays(today, -29)), dateTo: toApiDate(today) };
    case "today":
      return { dateFrom: toApiDate(today), dateTo: toApiDate(today) };
    case "tomorrow": {
      const tomorrow = addDays(today, 1);
      return { dateFrom: toApiDate(tomorrow), dateTo: toApiDate(tomorrow) };
    }
    case "this_week": {
      const day = today.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const monday = addDays(today, mondayOffset);
      const sunday = addDays(monday, 6);
      return { dateFrom: toApiDate(monday), dateTo: toApiDate(sunday) };
    }
  }
}

/** Status columns shown on the kanban board (cancelled excluded). */
export const KANBAN_BOARD_STATUSES: TaskStatus[] = [
  "todo",
  "in_progress",
  "completed",
];

export const KANBAN_COLUMN_HEIGHT = "calc(100dvh - 220px)";

export const KANBAN_COLUMNS: { id: TaskStatus; label: string }[] =
  KANBAN_BOARD_STATUSES.map((id) => ({
    id,
    label: TASK_STATUS_CONFIG[id].label,
  }));

export function getTaskStrikethroughClass(status: TaskStatus): string {
  if (status === "completed") return "line-through text-[#a3a3a3]";
  if (status === "cancelled") return "line-through text-[#dc2626]";
  return "";
}

export type KanbanTasksByStatus = {
  [K in (typeof KANBAN_BOARD_STATUSES)[number]]: ApplicationTask[];
};

export function groupTasksByStatus(tasks: ApplicationTask[]): KanbanTasksByStatus {
  return KANBAN_BOARD_STATUSES.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    },
    {} as KanbanTasksByStatus,
  );
}

export function formatTaskTimeRange(start: TimeParts, end: TimeParts): string {
  return `${start.h}:${start.m} ${start.p} – ${end.h}:${end.m} ${end.p}`;
}

function timePartsToMinutes(parts: TimeParts): number {
  let h = parseInt(parts.h, 10);
  if (parts.p === "PM" && h !== 12) h += 12;
  if (parts.p === "AM" && h === 12) h = 0;
  return h * 60 + parseInt(parts.m, 10);
}

export function formatTaskStartTime(start: TimeParts): string {
  return `${start.h}:${start.m} ${start.p}`;
}

export function formatTaskDuration(start: TimeParts, end: TimeParts): string {
  const diff = timePartsToMinutes(end) - timePartsToMinutes(start);
  if (diff <= 0) return "0 min";

  const hours = Math.floor(diff / 60);
  const mins = diff % 60;

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return hours === 1 ? "1 hr" : `${hours} hr`;
  if (mins === 30) return hours === 1 ? "1.5 hr" : `${hours}.5 hr`;
  if (hours === 1) return `1 hr ${mins} min`;
  return `${hours} hr ${mins} min`;
}

export function formatTaskWhen(
  date: string,
  start: TimeParts,
  end: TimeParts,
): string {
  return `${date} · ${formatTaskStartTime(start)} · ${formatTaskDuration(start, end)}`;
}

export function formatKanbanCardDate(
  uiDate: string,
): { label: string; isToday: boolean } {
  const parsed = new Date(uiDate);
  if (isNaN(parsed.getTime())) {
    return { label: uiDate, isToday: false };
  }

  const today = new Date();
  const isToday = parsed.toDateString() === today.toDateString();
  if (isToday) {
    return { label: "Today", isToday: true };
  }

  return {
    label: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(parsed),
    isToday: false,
  };
}

/** Matches AddTaskPopover inner card shadow. */
export const TASK_CARD_SHADOW = [
  "0px 0px 0px 1px rgba(51,51,51,0.04)",
  "0px 16px 8px -8px rgba(51,51,51,0.01)",
  "0px 12px 6px -6px rgba(51,51,51,0.02)",
  "0px 5px 5px -2.5px rgba(51,51,51,0.08)",
  "0px 1px 3px -1.5px rgba(51,51,51,0.16)",
  "inset 0px -0.5px 0.5px 0px rgba(51,51,51,0.08)",
].join(", ");

/** Kanban column inner stack — same as AddTaskPopover white card. */
export const TASK_KANBAN_INNER_SHADOW = TASK_CARD_SHADOW;

export function resolveKanbanDropStatus(
  overId: string | number,
  overData: { type?: string; status?: TaskStatus } | undefined,
  tasks: ApplicationTask[],
): TaskStatus | null {
  if (overData?.type === "column" && overData.status) {
    return overData.status;
  }
  if (overData?.type === "task" && overData.status) {
    return overData.status;
  }
  if (KANBAN_BOARD_STATUSES.includes(overId as TaskStatus)) {
    return overId as TaskStatus;
  }
  const overTask = tasks.find((t) => t.id === overId);
  return overTask?.status ?? null;
}

export function normalizeMeetingUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function taskToFormData(task: ApplicationTask): TaskFormData {
  return {
    title: task.title,
    description: task.description,
    date: task.date,
    timeStart: task.timeStart,
    timeEnd: task.timeEnd,
    meetingLink: task.meetingLink ?? "",
    status: task.status,
  };
}
