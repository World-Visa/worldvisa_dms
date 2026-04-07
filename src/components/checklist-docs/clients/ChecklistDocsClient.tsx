'use client';

import { memo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { FacetedFormFilter } from '@/components/ui/faceted-filter/facated-form-filter';
import { ListNoResults } from '@/components/applications/list-no-results';
import {
  useChecklistSummary,
  useVisaServiceTypes,
} from '@/hooks/useChecklistDocumentTemplates';
import { ROUTES } from '@/utils/routes';
import { VisaTypeFolderCard } from '../cards/VisaTypeFolderCard';

export const ChecklistDocsClient = memo(function ChecklistDocsClient() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data: visaTypesData, isLoading: loadingTypes } = useVisaServiceTypes();
  const { data: summaryData, isLoading: loadingSummary } = useChecklistSummary();

  const isLoading = loadingTypes || loadingSummary;

  if (isLoading) {
    return (
      <>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-medium text-foreground">Checklist Library</h1>
        </div>
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[208px] w-[190px] rounded-2xl" />
          ))}
        </div>
      </>
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

  const filteredCards = search
    ? cards.filter((c) => c.visaType.toLowerCase().includes(search.toLowerCase()))
    : cards;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-medium text-foreground">Checklist Library</h1>
        <FacetedFormFilter
          type="text"
          size="small"
          title="Search"
          value={search}
          onChange={setSearch}
          placeholder="Search visa types…"
        />
      </div>

      {cards.length === 0 ? (
        <div className="py-16 h-[calc(60vh-200px)] flex items-center justify-center">
          <ListNoResults
            title="No visa types found"
            description="There are no visa types available in the checklist library."
          />
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="py-16 h-[calc(60vh-200px)] flex items-center justify-center">
          <ListNoResults
            title="No results found"
            description="No visa types match your search. Try a different search term."
            onClearFilters={() => setSearch('')}
          />
        </div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {filteredCards.map(({ visaType, documentCount, categoryCount }) => (
            <VisaTypeFolderCard
              key={visaType}
              visaType={visaType}
              documentCount={documentCount}
              categoryCount={categoryCount}
              onClick={() => router.push(ROUTES.CHECKLIST_DOCS_VISA(visaType))}
            />
          ))}
        </div>
      )}
    </>
  );
});
