'use client';

import { useRouter } from 'next/navigation';
import { ROUTES } from '@/utils/routes';
import type { GlobalSearchApplication } from '@/lib/api/globalSearch';
import { Command } from '../command-types';

export function useSpouseApplicationCommands(apps: GlobalSearchApplication[] | undefined): Command[] {
  const router = useRouter();

  if (!apps?.length) return [];

  return apps
    .filter((app) => app.Record_Type === 'spouse_skill_assessment')
    .map((app) => ({
      id: `spouse-app-${app.id}`,
      label: app.Name,
      description: [app.Email, app.Phone, app.Application_Handled_By, app.id].filter(Boolean).join(' · '),
      category: 'spouse-applications' as const,
      keywords: [
        app.Name,
        app.Email,
        app.Phone,
        app.DMS_Application_Status,
        app.Application_Handled_By,
        app.id,
        'spouse',
        'skill assessment',
      ].filter(Boolean) as string[],
      priority: 'high' as const,
      metadata: { status: app.DMS_Application_Status },
      execute: () => { router.push(ROUTES.SPOUSE_SKILL_ASSESSMENT_APPLICATION_DETAILS(app.id)); },
    }));
}
