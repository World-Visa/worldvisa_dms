'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  useChecklistSummary,
  useVisaServiceTypes,
} from '@/hooks/useChecklistDocumentTemplates';
import { ROUTES } from '@/utils/routes';
import { VisaTypeFolderCard } from '../cards/VisaTypeFolderCard';

export const ChecklistDocsClient = memo(function ChecklistDocsClient() {
  const router = useRouter();
  const { data: visaTypesData, isLoading: loadingTypes } = useVisaServiceTypes();
  const { data: summaryData, isLoading: loadingSummary } = useChecklistSummary();

  const isLoading = loadingTypes || loadingSummary;

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-[208px] w-[190px] rounded-2xl"
          />
        ))}
      </div>
    );
  }

  const visaTypes = visaTypesData?.data?.visaServiceTypes ?? [];
  const summary = summaryData?.data?.summary ?? [];

  const summaryMap = new Map(
    summary.map((s) => [s.visaServiceType, s]),
  );

  const cards = visaTypes
    .filter((v) => v !== 'All')
    .map((visaType) => {
      const stats = summaryMap.get(visaType);
      return {
        visaType,
        documentCount: stats?.documentCount ?? 0,
        categoryCount: stats?.categoryCount ?? 0,
      };
    });

  if (cards.length === 0) {
    return (
      <Alert>
        <AlertDescription>No visa types found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-wrap gap-8 mx-auto w-full justify-center">
      {cards.map(({ visaType, documentCount, categoryCount }) => (
        <VisaTypeFolderCard
          key={visaType}
          visaType={visaType}
          documentCount={documentCount}
          categoryCount={categoryCount}
          onClick={() => router.push(ROUTES.CHECKLIST_DOCS_VISA(visaType))}
        />
      ))}
    </div>
  );
});
