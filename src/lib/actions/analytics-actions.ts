'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { BACKEND_ZOHO_URL } from '@/lib/config/api';
import type { AnalyticsDashboardData } from '@/types/analytics';

export async function getAnalyticsDashboardData(
  token: string,
  period = 30,
): Promise<AnalyticsDashboardData> {
  'use cache';
  cacheLife('minutes');
  cacheTag('analytics-dashboard');

  const res = await fetch(
    `${BACKEND_ZOHO_URL}/visa_applications/admin/analytics?period=${period}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!res.ok) {
    throw new Error(`Analytics API error: ${res.status}`);
  }

  return res.json() as Promise<AnalyticsDashboardData>;
}
