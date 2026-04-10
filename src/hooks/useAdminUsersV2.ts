import { useQuery } from "@tanstack/react-query";
import { ZOHO_BASE_URL, buildQueryString } from "@/lib/config/api";
import { fetcher } from "@/lib/fetcher";
import { PRESENCE_POLLING_INTERVAL_MS } from "@/lib/config/presence";

export type AccountStatus = "active" | "invited" | "inactive" | "suspended" | "deleted";

export interface AdminUserV2 {
  _id: string;
  username?: string;
  full_name?: string;
  role: "master_admin" | "admin" | "team_leader" | "supervisor";
  __v: number;
  last_login?: string;
  online_status?: boolean;       // backward compat boolean
  presence_status?: import('@/types/presence').PresenceStatus;
  lastSeen?: string | null;
  profile_image_url?: string;
  email?: string;
  account_status?: AccountStatus;
  email_verified?: boolean;
  clerk_id?: string;
  clerk_invitation_id?: string;
  ip_restricted?: boolean;
  ip_restricted_list?: string[];
  stats: {
    active_applications: number;
    reviews_sent: number;
    reviews_sent_pending: number;
    reviews_received: number;
    reviews_received_pending: number;
    unread_notifications: number;
  };
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
}

export interface AdminUsersV2Response {
  status: string;
  results: number;
  pagination: PaginationInfo;
  data: {
    users: AdminUserV2[];
  };
}

interface UseAdminUsersV2Params {
  page: number;
  limit: number;
  role?: string;
  search?: string;
  invited?: boolean;
}

function normalizeAdminUsersResponse(raw: unknown, fallbackLimit: number): AdminUsersV2Response {
  if (!raw || typeof raw !== "object") {
    return {
      status: "",
      results: 0,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        limit: fallbackLimit,
      },
      data: { users: [] },
    };
  }

  const r = raw as Record<string, unknown>;

  let users: AdminUserV2[] = [];
  const dataBlock = r.data;
  if (Array.isArray(dataBlock)) {
    users = dataBlock as AdminUserV2[];
  } else if (dataBlock && typeof dataBlock === "object") {
    const d = dataBlock as Record<string, unknown>;
    if (Array.isArray(d.users)) {
      users = d.users as AdminUserV2[];
    }
  }
  if (users.length === 0 && Array.isArray(r.users)) {
    users = r.users as AdminUserV2[];
  }

  const pag = r.pagination;
  let resolvedLimit = fallbackLimit;
  let currentPage = 1;
  let totalRecords = users.length;
  let totalPages = 1;

  if (pag && typeof pag === "object") {
    const p = pag as Record<string, unknown>;
    currentPage = Math.max(1, Number(p.currentPage ?? p.current_page ?? 1) || 1);
    totalRecords = Math.max(0, Number(p.totalRecords ?? p.total_records ?? 0) || 0);
    resolvedLimit = Number(p.limit ?? fallbackLimit) || fallbackLimit;
    totalPages = Math.max(0, Number(p.totalPages ?? p.total_pages ?? 0) || 0);
    if (totalPages < 1 && totalRecords > 0 && resolvedLimit > 0) {
      totalPages = Math.ceil(totalRecords / resolvedLimit);
    }
    if (users.length > 0 && totalPages < 1) {
      totalPages = 1;
    }
    if (totalPages < 1) {
      totalPages = 1;
    }
    if (totalRecords < users.length) {
      totalRecords = users.length;
    }
  } else if (users.length > 0) {
    totalRecords = users.length;
    totalPages = 1;
  }

  return {
    status: String(r.status ?? ""),
    results: Number(r.results ?? users.length) || users.length,
    pagination: {
      currentPage,
      totalPages,
      totalRecords,
      limit: resolvedLimit,
    },
    data: { users },
  };
}

const fetchAdminUsersV2 = async (params: UseAdminUsersV2Params): Promise<AdminUsersV2Response> => {
  const queryString = buildQueryString({
    page: params.page,
    limit: params.limit,
    role: params.role || undefined,
    search: params.search || undefined,
    invited: params.invited ? "true" : undefined,
  });

  const url = queryString
    ? `${ZOHO_BASE_URL}/users/all?${queryString}`
    : `${ZOHO_BASE_URL}/users/all`;

  const raw = await fetcher<unknown>(url);
  return normalizeAdminUsersResponse(raw, params.limit);
};

export function useAdminUsersV2(params: UseAdminUsersV2Params) {
  return useQuery({
    queryKey: ["admin-users-v2", params],
    queryFn: () => fetchAdminUsersV2(params),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchInterval: PRESENCE_POLLING_INTERVAL_MS,
    refetchIntervalInBackground: false,
    placeholderData: (previousData) => previousData,
  });
}
