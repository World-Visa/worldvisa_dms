import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { API_CONFIG } from "@/lib/config/api";
import { fetcher } from "@/lib/fetcher";

export interface AdminApprovalRequest {
  _id: string;
  requestType: "field_change";
  leadId: string;
  recordType: string;
  fieldName: string;
  currentValue: string;
  requestedValue: string;
  reason: string;
  requestedTo: string;
  requestedBy: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  client?: { name?: string; profile_image_url?: string | null };
  requesterInfo?: {
    username?: string;
    full_name?: string;
    profile_image_url?: string | null;
  };
  reviewerInfo?: {
    username?: string;
    full_name?: string;
    profile_image_url?: string | null;
  };
}

interface ApprovalRequestsResponse {
  data: AdminApprovalRequest[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    limit: number;
  };
}

interface ApprovalRequestsFilters {
  status?: "pending" | "approved" | "rejected";
  page?: number;
  limit?: number;
  requestType?: string;
}

function buildQueryString(filters: ApprovalRequestsFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.requestType) params.set("requestType", filters.requestType);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function pickReviewerInfo(raw: Record<string, unknown>): AdminApprovalRequest["reviewerInfo"] {
  const nested = raw.reviewerInfo ?? raw.reviewedByUser ?? raw.reviewer;
  if (!nested || typeof nested !== "object") return undefined;
  const n = nested as Record<string, unknown>;
  const fullName =
    typeof n.full_name === "string"
      ? n.full_name
      : typeof n.fullName === "string"
        ? n.fullName
        : undefined;
  const profileUrl = n.profile_image_url ?? n.profileImageUrl;
  return {
    username: typeof n.username === "string" ? n.username : undefined,
    full_name: fullName,
    profile_image_url:
      typeof profileUrl === "string" ? profileUrl : profileUrl === null ? null : undefined,
  };
}

function normalizeApprovalRequestItem(item: unknown): AdminApprovalRequest {
  if (!item || typeof item !== "object") {
    return item as AdminApprovalRequest;
  }
  const raw = item as Record<string, unknown>;
  const reviewerInfo = pickReviewerInfo(raw);
  return {
    ...(item as AdminApprovalRequest),
    ...(reviewerInfo ? { reviewerInfo } : {}),
  };
}

function normalizeApprovalRequestsList(items: unknown[]): AdminApprovalRequest[] {
  return items.map(normalizeApprovalRequestItem);
}

function normalizePagination(
  raw: unknown,
): ApprovalRequestsResponse["pagination"] | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const p = raw as Record<string, unknown>;
  const currentPage = Math.max(1, Number(p.currentPage ?? p.page ?? 1) || 1);
  const totalPages = Math.max(1, Number(p.totalPages ?? p.pages ?? 1) || 1);
  const totalRecords = Math.max(0, Number(p.totalRecords ?? p.total ?? 0) || 0);
  const limit = Math.max(1, Number(p.limit ?? 20) || 20);
  return { currentPage, totalPages, totalRecords, limit };
}

function normalizeResponse(raw: unknown): ApprovalRequestsResponse {
  if (!raw || typeof raw !== "object") return { data: [] };
  const r = raw as Record<string, unknown>;
  let data: AdminApprovalRequest[] = [];
  if (Array.isArray(raw)) {
    data = normalizeApprovalRequestsList(raw);
  } else if (Array.isArray(r.data)) {
    data = normalizeApprovalRequestsList(r.data);
  } else if (Array.isArray(r.requests)) {
    data = normalizeApprovalRequestsList(r.requests);
  }
  return { data, pagination: normalizePagination(r.pagination) };
}

export function useApprovalRequests(filters: ApprovalRequestsFilters = {}) {
  const qs = buildQueryString(filters);
  return useQuery({
    queryKey: ["approval-requests", filters],
    queryFn: () =>
      fetcher<unknown>(`${API_CONFIG.ENDPOINTS.ADMIN_APPROVAL_REQUESTS.BASE}${qs}`),
    select: normalizeResponse,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

const PENDING_COUNT_FILTERS = { status: "pending" as const, page: 1, limit: 1 };

export function useApprovalRequestsPendingCount(options?: { enabled?: boolean }) {
  const qs = buildQueryString(PENDING_COUNT_FILTERS);
  return useQuery({
    queryKey: ["approval-requests", PENDING_COUNT_FILTERS],
    queryFn: () =>
      fetcher<unknown>(`${API_CONFIG.ENDPOINTS.ADMIN_APPROVAL_REQUESTS.BASE}${qs}`),
    select: (raw) => normalizeResponse(raw).pagination?.totalRecords ?? 0,
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useApprovalRequestsByLead(leadId: string, filters: { status?: string } = {}) {
  const params = filters.status ? `?status=${filters.status}` : "";
  return useQuery({
    queryKey: ["approval-requests-lead", leadId, filters],
    queryFn: () =>
      fetcher<unknown>(
        `${API_CONFIG.ENDPOINTS.ADMIN_APPROVAL_REQUESTS.BY_LEAD(leadId)}${params}`,
      ),
    enabled: !!leadId,
    select: normalizeResponse,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

interface CreateApprovalRequestPayload {
  requestType: "field_change";
  leadId: string;
  recordType: string;
  fieldName: string;
  currentValue: string;
  requestedValue: string;
  reason: string;
  requestedTo: string;
}

export function useCreateApprovalRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateApprovalRequestPayload) =>
      fetcher<AdminApprovalRequest>(API_CONFIG.ENDPOINTS.ADMIN_APPROVAL_REQUESTS.BASE, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["approval-requests"] });
      void queryClient.invalidateQueries({
        queryKey: ["approval-requests-lead", variables.leadId],
      });
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Failed to submit extension request. Please try again.",
      );
    },
  });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) =>
      fetcher<AdminApprovalRequest>(
        API_CONFIG.ENDPOINTS.ADMIN_APPROVAL_REQUESTS.APPROVE(requestId),
        { method: "PATCH" },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["approval-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["approval-requests-lead"] });
      toast.success("Request approved.");
    },
    onError: () => {
      toast.error("Failed to approve request.");
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, rejectionReason }: { requestId: string; rejectionReason: string }) =>
      fetcher<AdminApprovalRequest>(
        API_CONFIG.ENDPOINTS.ADMIN_APPROVAL_REQUESTS.REJECT(requestId),
        {
          method: "PATCH",
          body: JSON.stringify({ rejectionReason }),
        },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["approval-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["approval-requests-lead"] });
      toast.success("Request rejected.");
    },
    onError: () => {
      toast.error("Failed to reject request.");
    },
  });
}
