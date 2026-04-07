import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { createServerQueryClient } from '@/lib/react-query/server';
import { createMeta } from '@/lib/seo';
import {
  getChecklistSummaryServer,
  getServerToken,
  getVisaServiceTypesServer,
} from '@/lib/api/server/checklistDocumentTemplates';
import { CHECKLIST_TEMPLATE_KEYS } from '@/lib/constants/checklistDocTemplatesKeys';
import { ChecklistDocsClient } from '@/components/checklist-docs/clients/ChecklistDocsClient';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = createMeta({
  title: 'Checklist Library',
  description: 'Manage checklist document templates by visa type.',
  noIndex: true,
});

function GridSkeleton() {
  return (
    <div className="flex flex-wrap gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-[208px] w-[190px] rounded-2xl" />
      ))}
    </div>
  );
}

export default async function ChecklistDocsPage() {
  await cookies();

  const token = await getServerToken();
  const queryClient = createServerQueryClient();

  try {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: CHECKLIST_TEMPLATE_KEYS.visaTypes,
        queryFn: () => getVisaServiceTypesServer(token),
      }),
      queryClient.prefetchQuery({
        queryKey: CHECKLIST_TEMPLATE_KEYS.summary,
        queryFn: () => getChecklistSummaryServer(token),
      }),
    ]);
  } catch (error) {
    console.error('Failed to prefetch checklist library data', error);
  }

  return (
    <main className="w-full">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<GridSkeleton />}>
          <ChecklistDocsClient />
        </Suspense>
      </HydrationBoundary>
    </main>
  );
}
