export type TimePeriod = "AM" | "PM";

export interface TimeParts {
  h: string;
  m: string;
  p: TimePeriod;
}

export type TaskStatus = "todo" | "in_progress" | "completed" | "cancelled";

export type TaskDateRangePreset =
  | "yesterday"
  | "last_7d"
  | "last_30d"
  | "today"
  | "tomorrow"
  | "this_week";

export interface TaskClientInfo {
  name: string;
  profile_image_url?: string | null;
}

export interface TaskCreatedByInfo {
  username: string;
  name: string;
  profile_image_url?: string | null;
}

export interface ApplicationTask {
  id: string;
  applicationId: string;
  title: string;
  description: string;
  date: string;
  timeStart: TimeParts;
  timeEnd: TimeParts;
  meetingLink?: string;
  status: TaskStatus;
  createdAt: string;
  leadOwner?: string;
  createdBy?: string;
  client?: TaskClientInfo;
  createdByInfo?: TaskCreatedByInfo;
}

export interface TaskFormData {
  title: string;
  description: string;
  date: string;
  timeStart: TimeParts;
  timeEnd: TimeParts;
  meetingLink: string;
  status?: TaskStatus;
}

// ─── API types ───────────────────────────────────────────

export interface ApiTaskLink {
  url: string;
  label: string;
  type: string;
}

export interface ApiTask {
  _id: string;
  leadId: string;
  recordType?: string;
  leadOwner?: string;
  title: string;
  description: string;
  status: TaskStatus;
  date: string;
  scheduledFrom: string;
  scheduledTo: string;
  createdBy?: string;
  completedAt?: string | null;
  completedBy?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  links?: ApiTaskLink[];
  followUpDeliveries?: unknown[];
  createdAt: string;
  updatedAt: string;
  client?: TaskClientInfo;
  createdByInfo?: TaskCreatedByInfo;
}

export interface GetAllTasksParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: TaskStatus;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface GetTasksParams {
  leadId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: TaskStatus;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/** Client-scoped task list — no leadId; auth token identifies the client. */
export interface GetClientTasksParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: TaskStatus;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface TasksPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetTasksResponse {
  status: string;
  data: {
    tasks: ApiTask[];
  };
  pagination: TasksPagination;
}

export interface CreateTaskPayload {
  leadId: string;
  title: string;
  description: string;
  date: string;
  scheduledFrom: string;
  scheduledTo: string;
  links?: ApiTaskLink[];
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  date?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
  links?: ApiTaskLink[];
}

export interface UpdateTaskStatusPayload {
  status: TaskStatus;
}

export interface TaskMutationResponse {
  status: string;
  data?: {
    task?: ApiTask;
  };
}
