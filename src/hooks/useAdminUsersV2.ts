import { useQuery } from "@tanstack/react-query";
import { ZOHO_BASE_URL, buildQueryString } from "@/lib/config/api";
import { fetcher } from "@/lib/fetcher";

export interface AdminUserV2 {
  _id: string;
  username: string;
  role: "master_admin" | "admin" | "team_leader" | "supervisor";
  __v: number;
  last_login?: string;
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

interface AdminUsersV2Response {
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
}

const fetchAdminUsersV2 = async (params: UseAdminUsersV2Params): Promise<AdminUsersV2Response> => {
  const queryString = buildQueryString({
    page: params.page,
    limit: params.limit,
    role: params.role || undefined,
    search: params.search || undefined,
  });

  const url = queryString
    ? `${ZOHO_BASE_URL}/users/all?${queryString}`
    : `${ZOHO_BASE_URL}/users/all`;

  return fetcher<AdminUsersV2Response>(url);
};

export function useAdminUsersV2(params: UseAdminUsersV2Params) {
  return useQuery({
    queryKey: ["admin-users-v2", params],
    queryFn: () => fetchAdminUsersV2(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}
