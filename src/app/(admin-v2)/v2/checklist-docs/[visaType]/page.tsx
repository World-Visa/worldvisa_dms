import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { createServerQueryClient } from '@/lib/react-query/server';
import { createMeta } from '@/lib/seo';
import {
  getGroupedDocumentsServer,
  getServerToken,
} from '@/lib/api/server/checklistDocumentTemplates';
import { CHECKLIST_TEMPLATE_KEYS } from '@/lib/constants/checklistDocTemplatesKeys';
import { normalizeChecklistRouteParam } from '@/lib/constants/checklistRouteParams';
import { ChecklistCategoriesClient } from '@/components/checklist-docs/clients/ChecklistCategoriesClient';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  params: Promise<{ visaType: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { visaType: rawVisaType } = await params;
  const visaType = normalizeChecklistRouteParam(rawVisaType);
  return createMeta({
    title: `${visaType} — Checklist Library`,
    description: `Document categories for ${visaType}.`,
    noIndex: true,
  });
}

function CategoriesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-48" />
      <div className="flex flex-wrap gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[208px] w-[190px] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default async function ChecklistCategoriesPage({ params }: Props) {
  const { visaType: rawVisaType } = await params;
  const visaType = normalizeChecklistRouteParam(rawVisaType);
  await cookies();

  const token = await getServerToken();
  const queryClient = createServerQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: CHECKLIST_TEMPLATE_KEYS.grouped(visaType),
      queryFn: () => getGroupedDocumentsServer(visaType, token),
    });
  } catch (error) {
    console.error('Failed to prefetch category groups', error);
  }

  return (
    <main className="w-full px-6 py-6">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<CategoriesSkeleton />}>
          <ChecklistCategoriesClient visaType={visaType} />
        </Suspense>
      </HydrationBoundary>
    </main>
  );
}
