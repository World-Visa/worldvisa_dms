import { fetcher } from "@/lib/fetcher";
import { API_ENDPOINTS, buildQueryString } from "@/lib/config/api";
import type {
  CallLogListFilters,
  CallLogListResponse,
  CallLogDetailResponse,
  UpdateCallNotesPayload,
} from "@/types/callLog";

export async function getCallLogs(
  filters: CallLogListFilters,
): Promise<CallLogListResponse> {
  // Strip empty / undefined values so they don't pollute the query string
  const params = buildQueryString({
    q:         filters.q         || undefined,
    status:    filters.status    || undefined,
    direction: filters.direction || undefined,
    dateRange: filters.dateRange || undefined,
    startDate: filters.startDate || undefined,
    endDate:   filters.endDate   || undefined,
    page:      filters.page,
    limit:     filters.limit,
  });

  return fetcher<CallLogListResponse>(API_ENDPOINTS.CALL_LOGS.LIST(params));
}

export async function getCallLogDetail(callId: string): Promise<CallLogDetailResponse> {
  return fetcher<CallLogDetailResponse>(API_ENDPOINTS.CALL_LOGS.BY_ID(callId));
}

export async function updateCallNotes(
  callId: string,
  payload: UpdateCallNotesPayload,
): Promise<CallLogDetailResponse> {
  return fetcher<CallLogDetailResponse>(API_ENDPOINTS.CALL_LOGS.NOTES(callId), {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
