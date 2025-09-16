import { useQuery } from "@tanstack/react-query";

export interface AdminUser {
  _id: string;
  username: string;
  role: "admin" | "team_leader" | "master_admin";
  __v: number;
}

interface AdminUsersResponse {
  data: AdminUser[];
}

const fetchAdminUsers = async (): Promise<AdminUser[]> => {
  try {
    const response = await fetch(
      "https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms/users/all"
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch admin users: ${response.status} ${response.statusText}`
      );
    }

    const result: AdminUsersResponse = await response.json();

    if (!result.data || !Array.isArray(result.data)) {
      throw new Error("Invalid response format from admin users API");
    }

    return result.data;
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
          ["admin", "team_leader", "master_admin"].includes(user.role)
        )
        .map((user) => ({
          ...user,
          username: user.username === "admin" ? "kavitha mam" : user.username,
        }))
        .sort((a, b) => {
          // Sort by role priority, then by username
          const rolePriority = { master_admin: 0, admin: 1, team_leader: 2 };
          const roleDiff = rolePriority[a.role] - rolePriority[b.role];
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
