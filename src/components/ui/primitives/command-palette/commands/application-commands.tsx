'use client';

import { useRouter } from 'next/navigation';
import { ROUTES } from '@/utils/routes';
import type { GlobalSearchApplication } from '@/lib/api/globalSearch';
import { Command } from '../command-types';

export function useApplicationCommands(apps: GlobalSearchApplication[] | undefined): Command[] {
  const router = useRouter();

  if (!apps?.length) return [];

  return apps
    .filter((app) => app.Record_Type !== 'spouse_skill_assessment')
    .map((app) => ({
      id: `app-${app.id}`,
      label: app.Name,
      description: [app.Email, app.Phone, app.Application_Handled_By, app.id].filter(Boolean).join(' · '),
      category: 'applications' as const,
      keywords: [app.Name, app.Email, app.Phone, app.DMS_Application_Status, app.Application_Handled_By, app.id].filter(
        Boolean
      ) as string[],
      priority: 'high' as const,
      execute: () => { router.push(ROUTES.APPLICATION_DETAILS(app.id)); },
    }));
}
