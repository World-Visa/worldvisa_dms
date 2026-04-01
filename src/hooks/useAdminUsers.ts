import { useQuery } from "@tanstack/react-query";
import { ZOHO_BASE_URL } from "@/lib/config/api";
import { fetcher } from "@/lib/fetcher";
import { isAdminRole } from "@/lib/roles";

export interface AdminUser {
  _id: string;
  username?: string;
  full_name?: string;
  role: "admin" | "team_leader" | "master_admin" | "supervisor";
  __v: number;
}

type AdminUsersPagination = {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
};

function normalizeAdminUsersResponse(
  raw: unknown,
  fallbackLimit: number,
): {
  users: AdminUser[];
  pagination: AdminUsersPagination;
  hasPagination: boolean;
} {
  if (!raw || typeof raw !== "object") {
    return {
      users: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        limit: fallbackLimit,
      },
      hasPagination: false,
    };
  }

  const r = raw as Record<string, unknown>;

  let users: AdminUser[] = [];
  const dataBlock = r.data;
  if (Array.isArray(raw)) {
    users = raw as AdminUser[];
  } else if (Array.isArray(dataBlock)) {
    users = dataBlock as AdminUser[];
  } else if (dataBlock && typeof dataBlock === "object") {
    const d = dataBlock as Record<string, unknown>;
    if (Array.isArray(d.users)) users = d.users as AdminUser[];
  }
  if (users.length === 0 && Array.isArray(r.users)) users = r.users as AdminUser[];

  const pag = r.pagination;
  let resolvedLimit = fallbackLimit;
  let currentPage = 1;
  let totalRecords = users.length;
  let totalPages = 1;
  let hasPagination = false;

  if (pag && typeof pag === "object") {
    hasPagination = true;
    const p = pag as Record<string, unknown>;
    currentPage = Math.max(1, Number(p.currentPage ?? p.current_page ?? 1) || 1);
    totalRecords = Math.max(0, Number(p.totalRecords ?? p.total_records ?? 0) || 0);
    resolvedLimit = Number(p.limit ?? fallbackLimit) || fallbackLimit;
    totalPages = Math.max(0, Number(p.totalPages ?? p.total_pages ?? 0) || 0);
    if (totalPages < 1 && totalRecords > 0 && resolvedLimit > 0) {
      totalPages = Math.ceil(totalRecords / resolvedLimit);
    }
    if (users.length > 0 && totalPages < 1) totalPages = 1;
    if (totalPages < 1) totalPages = 1;
    if (totalRecords < users.length) totalRecords = users.length;
  } else if (users.length > 0) {
    totalRecords = users.length;
    totalPages = 1;
  }

  return {
    users,
    pagination: {
      currentPage,
      totalPages,
      totalRecords,
      limit: resolvedLimit,
    },
    hasPagination,
  };
}

const fetchAdminUsers = async (): Promise<AdminUser[]> => {
  try {
    const limit = 100;
    const maxPagesSafety = 200;

    const byId = new Map<string, AdminUser>();
    let page = 1;
    let totalPages: number | null = null;
    let paginationKnown = false;

    while (page <= maxPagesSafety) {
      const raw = await fetcher<unknown>(
        `${ZOHO_BASE_URL}/users/all?page=${page}&limit=${limit}`,
      );

      const { users, pagination, hasPagination } = normalizeAdminUsersResponse(
        raw,
        limit,
      );
      if (hasPagination && !paginationKnown) {
        totalPages = pagination.totalPages;
        paginationKnown = true;
      }

      for (const u of users) {
        if (!u?._id) continue;
        byId.set(u._id, u);
      }

      const reachedLastPage = paginationKnown && page >= (totalPages ?? 1);
      const likelyNoMorePages = users.length < limit;
      if (reachedLastPage || (!paginationKnown && likelyNoMorePages)) break;

      page += 1;
    }

    return Array.from(byId.values());
  } catch (error) {
    console.error("Error fetching admin users:", error);
    throw error;
  }
};

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchAdminUsers,
    enabled: true,
    staleTime: 5 * 60 * 1000, 
    gcTime: 10 * 60 * 1000, 
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, // Don't refetch on window focus for admin list
    select: (data) => {
      // Filter and sort admin users
      return data
        .filter((user) => isAdminRole(user.role))
        .map((user) => ({
          ...user,
          username: user.username === "admin" ? "mohsin" : user.username,
        }))
        .sort((a, b) => {
          // Sort by role priority, then by username
          const rolePriority: Record<string, number> = {
            master_admin: 0,
            admin: 1,
            team_leader: 2,
            supervisor: 3,
          };
          const roleDiff = (rolePriority[a.role] ?? 4) - (rolePriority[b.role] ?? 4);
          return roleDiff !== 0
            ? roleDiff
            : (a.username ?? a.full_name ?? "").localeCompare(b.username ?? b.full_name ?? "");
        });
    },
    meta: {
      errorMessage: "Failed to load admin users. Please try again.",
    },
  });
}
