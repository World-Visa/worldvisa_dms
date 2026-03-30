import { auth } from "@clerk/nextjs/server";
import { BACKEND_ZOHO_URL, buildQueryString } from "@/lib/config/api";
import type { AdminUsersV2Response } from "@/hooks/useAdminUsersV2";

interface FetchUsersParams {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
  invited?: boolean;
}

export async function fetchUsersServer(params: FetchUsersParams = {}): Promise<AdminUsersV2Response> {
  const { getToken } = await auth();
  const token = await getToken();

  const queryString = buildQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    role: params.role || undefined,
    search: params.search || undefined,
    invited: params.invited ? "true" : undefined,
  });

  const url = `${BACKEND_ZOHO_URL}/users/all${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    let errorData: { message?: string; error?: string } = {};
    try {
      const text = await response.text();
      if (text.trim()) errorData = JSON.parse(text);
    } catch {
      errorData = {};
    }
    throw new Error(
      errorData.message ?? errorData.error ?? `HTTP error! status: ${response.status}`,
    );
  }

  return response.json() as Promise<AdminUsersV2Response>;
}
