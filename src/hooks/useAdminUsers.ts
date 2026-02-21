import { useQuery } from "@tanstack/react-query";
import { ZOHO_BASE_URL } from "@/lib/config/api";
import { fetcher } from "@/lib/fetcher";

export interface AdminUser {
  _id: string;
  username: string;
  role: "admin" | "team_leader" | "master_admin" | "supervisor";
  __v: number;
}

const fetchAdminUsers = async (): Promise<AdminUser[]> => {
  try {
    const result = await fetcher<unknown>(
      `${ZOHO_BASE_URL}/users/all`,
    );

    const list: AdminUser[] =
      Array.isArray(result)
        ? result
        : Array.isArray((result as { data?: AdminUser[] }).data)
          ? (result as { data: AdminUser[] }).data
          : Array.isArray((result as { users?: AdminUser[] }).users)
            ? (result as { users: AdminUser[] }).users
            : Array.isArray(
                (result as { data?: { users?: AdminUser[] } }).data?.users,
              )
              ? (result as { data: { users: AdminUser[] } }).data.users
              : [];

    if (list.length === 0 && result !== null && typeof result === "object" && !Array.isArray(result)) {
      const hasData = "data" in result && (result as { data?: unknown }).data !== undefined;
      const hasUsers = "users" in result && (result as { users?: unknown }).users !== undefined;
      const hasDataUsers = Array.isArray(
        (result as { data?: { users?: unknown } }).data?.users,
      );
      if (!hasData && !hasUsers && !hasDataUsers) {
        console.warn(
          "Admin users API response:",
          result,
          "— Check that the request is authenticated and the backend returns an array (e.g. under `data`, `users`, or `data.users`).",
        );
        throw new Error(
          "Invalid response format from admin users API. Check that the request is authenticated and the backend returns an array (e.g. under `data`, `users`, or `data.users`).",
        );
      }
    }

    return list;
  } catch (error) {
    console.error("Error fetching admin users:", error);
    throw error;
  }
};

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchAdminUsers,
    enabled: true, // Always fetch admin users
    staleTime: 5 * 60 * 1000, // 5 minutes - admin list doesn't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, // Don't refetch on window focus for admin list
    select: (data) => {
      // Filter and sort admin users
      return data
        .filter((user) =>
          ["admin", "team_leader", "master_admin", "supervisor"].includes(
            user.role,
          ),
        )
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
            : a.username.localeCompare(b.username);
        });
    },
    meta: {
      errorMessage: "Failed to load admin users. Please try again.",
    },
  });
}
