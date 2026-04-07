import { Suspense } from 'react';
import { createMeta } from '@/lib/seo';
import { normalizeChecklistRouteParam } from '@/lib/constants/checklistRouteParams';
import { ChecklistDocumentsClient } from '@/components/checklist-docs/clients/ChecklistDocumentsClient';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  params: Promise<{ visaType: string; category: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { visaType: rawVisaType, category: rawCategory } = await params;
  const visaType = normalizeChecklistRouteParam(rawVisaType);
  const category = normalizeChecklistRouteParam(rawCategory);
  return createMeta({
    title: `${category} — ${visaType}`,
    description: `Documents for ${category} under ${visaType}.`,
    noIndex: true,
  });
}

function TableSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-72" />
      <div className="overflow-hidden rounded-xl border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b px-4 py-3 last:border-0"
          >
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function ChecklistDocumentsPage({ params }: Props) {
  const { visaType: rawVisaType, category: rawCategory } = await params;
  const visaType = normalizeChecklistRouteParam(rawVisaType);
  const category = normalizeChecklistRouteParam(rawCategory);

  return (
    <main className="w-full px-6 py-6">
      <Suspense fallback={<TableSkeleton />}>
        <ChecklistDocumentsClient
          visaType={visaType}
          category={category}
        />
      </Suspense>
    </main>
  );
}
