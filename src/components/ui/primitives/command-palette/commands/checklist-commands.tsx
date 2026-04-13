'use client';

import { useRouter } from 'next/navigation';
import { ROUTES } from '@/utils/routes';
import type { ChecklistRequestedItem } from '@/lib/api/globalSearch';
import { Command } from '../command-types';

export function useChecklistCommands(items: ChecklistRequestedItem[] | undefined): Command[] {
  const router = useRouter();

  if (!items?.length) return [];

  return items.map((item) => ({
    id: `cl-${item.id}`,
    label: item.Name,
    description: item.Email ?? undefined,
    category: 'checklist-requests' as const,
    keywords: [item.Name, item.Email, item.DMS_Application_Status, 'checklist'].filter(Boolean) as string[],
    priority: 'high' as const,
    metadata: { status: item.DMS_Application_Status },
    execute: () => { router.push(ROUTES.CHECKLIST_REQUESTS); },
  }));
}
