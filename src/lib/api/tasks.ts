import { fetcher } from "@/lib/fetcher";
import { API_ENDPOINTS, buildQueryString } from "@/lib/config/api";
import type {
  ApiTask,
  ApiTaskLink,
  ApplicationTask,
  CreateTaskPayload,
  GetAllTasksParams,
  GetTasksParams,
  GetClientTasksParams,
  GetTasksResponse,
  TaskFormData,
  TaskMutationResponse,
  TimeParts,
  UpdateTaskPayload,
  TaskStatus,
} from "@/types/tasks";

const JSON_HEADERS = { "Content-Type": "application/json" };

function formatUiDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function isoToTimeParts(iso: string): TimeParts {
  const date = new Date(iso);
  const hours24 = date.getHours();
  const p: TimeParts["p"] = hours24 >= 12 ? "PM" : "AM";
  let h = hours24 % 12;
  if (h === 0) h = 12;
  return {
    h: String(h),
    m: String(date.getMinutes()).padStart(2, "0"),
    p,
  };
}

export function uiDateToApiDate(uiDate: string): string {
  const parsed = new Date(uiDate);
  if (isNaN(parsed.getTime())) return uiDate;
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function timePartsTo24h(parts: TimeParts): { hours: number; minutes: number } {
  let h = parseInt(parts.h, 10);
  const m = parseInt(parts.m, 10);
  if (parts.p === "PM" && h !== 12) h += 12;
  if (parts.p === "AM" && h === 12) h = 0;
  return { hours: h, minutes: m };
}

export function timePartsToIso(uiDate: string, parts: TimeParts): string {
  const base = new Date(uiDate);
  if (isNaN(base.getTime())) return new Date().toISOString();
  const { hours, minutes } = timePartsTo24h(parts);
  base.setHours(hours, minutes, 0, 0);
  return base.toISOString();
}

function buildMeetingLinks(meetingLink: string): ApiTaskLink[] | undefined {
  const trimmed = meetingLink.trim();
  if (!trimmed) return undefined;
  const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return [{ url, label: "Join meeting", type: "meeting" }];
}

export function mapApiTaskToApplicationTask(api: ApiTask): ApplicationTask {
  const dateObj = new Date(api.date);
  const meetingLink = api.links?.find((l) => l.type === "meeting")?.url ?? api.links?.[0]?.url;

  return {
    id: api._id,
    applicationId: api.leadId,
    title: api.title,
    description: api.description ?? "",
    date: isNaN(dateObj.getTime()) ? api.date : formatUiDate(dateObj),
    timeStart: isoToTimeParts(api.scheduledFrom),
    timeEnd: isoToTimeParts(api.scheduledTo),
    meetingLink,
    status: api.status,
    createdAt: api.createdAt,
    leadOwner: api.leadOwner,
    createdBy: api.createdBy,
    client: api.client,
    createdByInfo: api.createdByInfo,
  };
}

export function mapFormDataToCreatePayload(
  leadId: string,
  data: TaskFormData,
): CreateTaskPayload {
  const apiDate = uiDateToApiDate(data.date);
  const payload: CreateTaskPayload = {
    leadId,
    title: data.title.trim(),
    description: data.description,
    date: apiDate,
    scheduledFrom: timePartsToIso(data.date, data.timeStart),
    scheduledTo: timePartsToIso(data.date, data.timeEnd),
  };
  const links = buildMeetingLinks(data.meetingLink);
  if (links) payload.links = links;
  return payload;
}

export function mapFormDataToUpdatePayload(data: TaskFormData): UpdateTaskPayload {
  const apiDate = uiDateToApiDate(data.date);
  const payload: UpdateTaskPayload = {
    title: data.title.trim(),
    description: data.description,
    date: apiDate,
    scheduledFrom: timePartsToIso(data.date, data.timeStart),
    scheduledTo: timePartsToIso(data.date, data.timeEnd),
  };
  const links = buildMeetingLinks(data.meetingLink);
  if (links) payload.links = links;
  else payload.links = [];
  return payload;
}

export async function getTasks(params: GetTasksParams): Promise<GetTasksResponse> {
  const query = buildQueryString({
    leadId: params.leadId,
    page: params.page,
    limit: params.limit,
    search: params.search || undefined,
    status: params.status || undefined,
    date: params.date || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
    sortBy: params.sortBy || undefined,
    sortOrder: params.sortOrder || undefined,
  });

  return fetcher<GetTasksResponse>(API_ENDPOINTS.TASKS.LIST(query));
}

export async function getAllTasks(
  params: GetAllTasksParams,
): Promise<GetTasksResponse> {
  const query = buildQueryString({
    page: params.page,
    limit: params.limit,
    search: params.search || undefined,
    status: params.status || undefined,
    date: params.date || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
    sortBy: params.sortBy || undefined,
    sortOrder: params.sortOrder || undefined,
  });

  return fetcher<GetTasksResponse>(API_ENDPOINTS.TASKS.LIST(query));
}

export async function getClientTasks(
  params: GetClientTasksParams,
): Promise<GetTasksResponse> {
  const query = buildQueryString({
    page: params.page,
    limit: params.limit,
    search: params.search || undefined,
    status: params.status || undefined,
    date: params.date || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
    sortBy: params.sortBy || undefined,
    sortOrder: params.sortOrder || undefined,
  });

  return fetcher<GetTasksResponse>(API_ENDPOINTS.CLIENTS.TASKS.LIST(query));
}

export async function createTask(payload: CreateTaskPayload): Promise<TaskMutationResponse> {
  return fetcher<TaskMutationResponse>(API_ENDPOINTS.TASKS.CREATE, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
}

export async function updateTask(
  taskId: string,
  payload: UpdateTaskPayload,
): Promise<TaskMutationResponse> {
  return fetcher<TaskMutationResponse>(API_ENDPOINTS.TASKS.BY_ID(taskId), {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
): Promise<TaskMutationResponse> {
  return fetcher<TaskMutationResponse>(API_ENDPOINTS.TASKS.STATUS(taskId), {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify({ status }),
  });
}

export async function deleteTask(taskId: string): Promise<TaskMutationResponse> {
  return fetcher<TaskMutationResponse>(API_ENDPOINTS.TASKS.BY_ID(taskId), {
    method: "DELETE",
  });
}
