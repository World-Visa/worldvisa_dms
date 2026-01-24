'use client';

import React, { useMemo } from 'react';
import { useApplicationDetails } from '@/hooks/useApplicationDetails';
import { useAllApplicationDocuments } from '@/hooks/useApplicationDocuments';
import { parseCompaniesFromDocuments } from '@/utils/companyParsing';
import { useChecklistPage } from './useChecklistPage';
import { ChecklistLayout } from './ChecklistLayout';
import { ChecklistEditor } from './ChecklistEditor';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Document } from '@/types/applications';

function computeCategoryCounts(
  categories: Array<{ id: string; label: string; count?: number }>,
  documents: Document[] | undefined
): Record<string, number> {
  const map: Record<string, number> = {};
  if (!documents?.length) return map;
  for (const cat of categories) {
    if (cat.id === 'submitted' || cat.id === 'all' || cat.id === 'checklist') {
      map[cat.id] = documents.length;
    } else if (cat.id === 'identity' || cat.label === 'Identity Documents') {
      map[cat.id] = documents.filter(
        (d) => d.document_category === 'Identity Documents' || d.document_category === 'Identity'
      ).length;
    } else if (cat.id === 'education' || cat.label === 'Education Documents') {
      map[cat.id] = documents.filter(
        (d) => d.document_category === 'Education Documents' || d.document_category === 'Education'
      ).length;
    } else if (cat.id === 'other' || cat.label === 'Other Documents') {
      map[cat.id] = documents.filter(
        (d) => d.document_category === 'Other Documents' || d.document_category === 'Other'
      ).length;
    } else if (cat.id === 'self_employment' || cat.label === 'Self Employment/Freelance') {
      map[cat.id] = documents.filter((d) => d.document_category === 'Self Employment/Freelance').length;
    } else if (cat.id === 'company') {
      map[cat.id] = documents.filter(
        (d) =>
          d.document_category?.includes('Company Documents') || d.document_category === 'Company'
      ).length;
    } else if (cat.label?.includes('Company Documents') && cat.label !== 'Company Documents') {
      map[cat.id] = documents.filter((d) => d.document_category === cat.label).length;
    } else {
      map[cat.id] = documents.filter((d) => d.document_category === cat.label).length;
    }
  }
  return map;
}

interface ChecklistPageProps {
  applicationId: string;
  isSpouseApplication: boolean;
}

export function ChecklistPage({ applicationId }: ChecklistPageProps) {
  const { data: applicationData } = useApplicationDetails(applicationId);
  const { data: documentsData, isLoading: isDocsLoading, error: docsError } = useAllApplicationDocuments(
    applicationId
  );

  const documents = documentsData?.data;
  const companies = useMemo(
    () => parseCompaniesFromDocuments(documents ?? []),
    [documents]
  );
  const recordType = (applicationData as { data?: { Record_Type?: string } })?.data?.Record_Type ?? 'default_record_type';

  const page = useChecklistPage({
    applicationId,
    documents,
    companies,
    recordType,
  });

  const categoryCounts = useMemo(
    () => computeCategoryCounts(page.categories, documents),
    [page.categories, documents]
  );

  if (isDocsLoading || page.isChecklistLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-full" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (docsError) {
    return (
      <Card className="p-6">
        <p className="text-destructive">Failed to load documents.</p>
        <p className="text-sm text-muted-foreground mt-1">{String(docsError)}</p>
      </Card>
    );
  }

  return (
    <ChecklistLayout
      applicationId={applicationId}
      mode={page.mode}
      isSaving={page.isSaving}
      onCancel={page.cancel}
      onSave={page.handleSave}
    >
      <ChecklistEditor
        mode={page.mode}
        activeTab={page.activeTab}
        categories={page.categories}
        selectedCategory={page.selectedCategory}
        searchQuery={page.searchQuery}
        filteredItems={page.filteredItems}
        categoryFilteredItems={page.categoryFilteredItems}
        tabCounts={page.tabCounts}
        pendingDeletions={page.pendingDeletions}
        onCategoryChange={page.handleCategoryChange}
        onTabChange={page.handleTabChange}
        onSearchChange={page.setSearchQuery}
        onUpdateRequirement={page.updateDocumentRequirement}
        onAddToPending={(item) =>
          page.addToPendingChanges({
            category: item.category,
            documentType: item.documentType,
            isUploaded: false,
            requirement: item.requirement,
            company_name: (item as { company_name?: string }).company_name,
          })
        }
        onAddToPendingDeletions={page.addToPendingDeletions}
        onRemoveFromPendingDeletions={page.removeFromPendingDeletions}
        isBatchDeleting={page.isSaving}
        categoryCounts={categoryCounts}
        applicationId={applicationId}
      />
    </ChecklistLayout>
  );
}
