import { auth } from "@clerk/nextjs/server";
import { BACKEND_ZOHO_URL } from "@/lib/config/api";
import type { UserDetailsResponse } from "@/hooks/useUserDetails";

export async function fetchUserDetailsServer(id: string): Promise<UserDetailsResponse> {
  const { getToken } = await auth();
  const token = await getToken();

  const response = await fetch(`${BACKEND_ZOHO_URL}/users/${id}`, {
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

  return response.json() as Promise<UserDetailsResponse>;
}
