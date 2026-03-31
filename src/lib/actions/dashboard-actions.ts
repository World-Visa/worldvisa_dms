"use server";

import { BACKEND_ZOHO_URL } from "@/lib/config/api";
import type { DashboardData } from "@/types/dashboard";

export async function getDashboardStats(token: string): Promise<DashboardData> {
  const response = await fetch(`${BACKEND_ZOHO_URL}/visa_applications/admin/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
  }

  return response.json() as Promise<DashboardData>;
}
