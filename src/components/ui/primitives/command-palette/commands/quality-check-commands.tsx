'use client';

import { useRouter } from 'next/navigation';
import { ROUTES } from '@/utils/routes';
import type { QualityCheckItem } from '@/lib/api/globalSearch';
import { Command } from '../command-types';

export function useQualityCheckCommands(items: QualityCheckItem[] | undefined): Command[] {
  const router = useRouter();

  if (!items?.length) return [];

  return items.map((item) => ({
    id: `qc-${item.id}`,
    label: item.Name,
    description: item.Email ?? undefined,
    category: 'quality-check' as const,
    keywords: [item.Name, item.Email, item.DMS_Application_Status].filter(Boolean) as string[],
    priority: 'high' as const,
    metadata: { status: item.DMS_Application_Status },
    // Navigate with leadId param — QualityCheckClient auto-opens the sheet
    execute: () => { router.push(`${ROUTES.QUALITY_CHECK}?leadId=${item.id}`); },
  }));
}
