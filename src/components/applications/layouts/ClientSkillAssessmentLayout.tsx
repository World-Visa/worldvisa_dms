'use client';

import { useMemo, useCallback, useEffect, useState } from 'react';

import { DocumentCategoryFilter } from '@/components/applications/DocumentCategoryFilter';
import { DocumentChecklistTable } from '@/components/applications/DocumentChecklistTable';
import { DocumentsTable } from '@/components/applications/DocumentsTable';
import { ChecklistRequestSuccessCard } from '@/components/applications/ChecklistRequestSuccessCard';
import { RequestChecklistCard } from '@/components/applications/RequestChecklistCard';
import { Button } from '@/components/ui/button';
import { SampleDocumentsTable } from '@/components/applications/sample-documents/SampleDocumentsTable';
import { useSampleDocuments } from '@/hooks/useSampleDocuments';
import type { Document } from '@/types/applications';
import type { ClientDocumentsResponse } from '@/types/client';
import type { Company, DocumentCategory } from '@/types/documents';
import type { ChecklistResponse } from '@/types/checklist';
import { generateChecklistCategories } from '@/lib/checklist/categoryUtils';

interface ClientSkillAssessmentLayoutProps {
  applicationId: string;
  selectedCategory: DocumentCategory | string;
  onCategoryChange: (category: DocumentCategory | string) => Promise<void> | void;
  documentsPage: number;
  documentsLimit: number;
  onDocumentsPageChange: (page: number) => void;
  isCategoryChanging: boolean;
  maxCompanies?: number;
  companies: Company[];
  onAddCompany: () => void;
  onRemoveCompany: (companyName: string) => void;
  documentsResponse?: ClientDocumentsResponse;
  isDocumentsLoading: boolean;
  documentsError: Error | null;
  allDocumentsResponse?: ClientDocumentsResponse;
  isAllDocumentsLoading: boolean;
  allDocumentsError: Error | null;
  checklistData?: ChecklistResponse;
  isChecklistLoading: boolean;
  checklistError: Error | null;
  onClientDeleteSuccess: () => void;
  onReuploadDocument: (documentId: string, documentType: string, category: string) => void;
  onUploadSuccess: () => void;
  checklistRequested: boolean;
  checklistRequestedAt?: string;
  leadId?: string;
  onChecklistRefresh?: () => void;
  onChecklistRequestSuccess?: () => void;
}

export function ClientSkillAssessmentLayout({
  applicationId,
  selectedCategory,
  onCategoryChange,
  documentsPage,
  documentsLimit,
  onDocumentsPageChange,
  isCategoryChanging,
  maxCompanies = 5,
  companies,
  onAddCompany,
  onRemoveCompany,
  documentsResponse,
  isDocumentsLoading,
  documentsError,
  allDocumentsResponse,
  isAllDocumentsLoading,
  allDocumentsError,
  checklistData,
  isChecklistLoading,
  checklistError,
  onClientDeleteSuccess,
  onReuploadDocument,
  onUploadSuccess,
  checklistRequested,
  checklistRequestedAt,
  leadId,
  onChecklistRefresh,
  onChecklistRequestSuccess,
}: ClientSkillAssessmentLayoutProps) {
  const allDocuments = useMemo(
    () => allDocumentsResponse?.data?.documents as unknown as Document[] | undefined,
    [allDocumentsResponse]
  );

  const submittedDocumentsCount = allDocumentsResponse?.data?.documents?.length ?? 0;
  const hasChecklist = Array.isArray(checklistData?.data) && checklistData.data.length > 0;
  const hasSubmittedDocuments = submittedDocumentsCount > 0;

  const [showSampleDocuments, setShowSampleDocuments] = useState(false);

  const {
    data: sampleDocumentsData,
    isLoading: isSampleDocumentsLoading,
  } = useSampleDocuments(applicationId);

  const hasSampleDocuments = (sampleDocumentsData?.data?.length ?? 0) > 0;

  useEffect(() => {
    if (!hasSampleDocuments) {
      setShowSampleDocuments(false);
    }
  }, [hasSampleDocuments]);

  const checklistCategories = useMemo(
    () => generateChecklistCategories(checklistData, allDocumentsResponse, companies),
    [checklistData, allDocumentsResponse, companies]
  );

  const hasCompanyDocuments = useMemo(
    () =>
      Array.isArray(checklistData?.data) &&
      checklistData.data.some(
        (item) => item.document_category === 'Company' || item.document_category === 'Company Documents'
      ),
    [checklistData?.data]
  );

  const checklistState = hasChecklist ? 'saved' : 'none';

  const handleChecklistRefresh = useCallback(() => {
    onChecklistRefresh?.();
  }, [onChecklistRefresh]);

  const handleChecklistRequestSuccess = useCallback(() => {
    if (onChecklistRequestSuccess) {
      onChecklistRequestSuccess();
      return;
    }

    onChecklistRefresh?.();
  }, [onChecklistRequestSuccess, onChecklistRefresh]);

  return (
    <div className="space-y-6">
      {(hasSampleDocuments || showSampleDocuments) && (
        <div className="flex items-center justify-end">
          {showSampleDocuments ? (
            <Button
              className="cursor-pointer active:scale-95 transition-transform"
              variant="secondary"
              size="sm"
              onClick={() => setShowSampleDocuments(false)}
            >
              Back to checklist
            </Button>
          ) : (
            <Button
              className="cursor-pointer active:scale-95 transition-transform"
              variant="outline"
              size="sm"
              disabled={isSampleDocumentsLoading}
              onClick={() => setShowSampleDocuments(true)}
            >
              Sample documents
            </Button>
          )}
        </div>
      )}

      {showSampleDocuments ? (
        <SampleDocumentsTable applicationId={applicationId} isClientView />
      ) : (
        <div className="space-y-6">
          <DocumentCategoryFilter
            selectedCategory={selectedCategory as string}
            onCategoryChange={onCategoryChange}
            companies={companies}
            onAddCompany={onAddCompany}
            onRemoveCompany={onRemoveCompany}
            maxCompanies={maxCompanies}
            isClientView
            submittedDocumentsCount={submittedDocumentsCount}
            checklistState={checklistState}
            checklistCategories={checklistCategories}
            hasCompanyDocuments={hasCompanyDocuments}
            isCategoryChanging={isCategoryChanging}
          />

          {(() => {
            if (checklistRequested && !hasChecklist) {
              return (
                <ChecklistRequestSuccessCard
                  onRefresh={handleChecklistRefresh}
                  requestedAt={checklistRequestedAt}
                />
              );
            }

            if (!hasChecklist && !hasSubmittedDocuments && !checklistRequested && leadId) {
              return (
                <RequestChecklistCard leadId={leadId} onRequestSuccess={handleChecklistRequestSuccess} />
              );
            }

            if (!hasChecklist && hasSubmittedDocuments) {
              return (
                <DocumentsTable
                  applicationId={applicationId}
                  currentPage={documentsPage}
                  limit={documentsLimit}
                  onPageChange={onDocumentsPageChange}
                  isClientView
                  clientDocumentsData={documentsResponse}
                  clientIsLoading={isDocumentsLoading}
                  clientError={documentsError}
                  onClientDeleteSuccess={onClientDeleteSuccess}
                  onReuploadDocument={onReuploadDocument}
                  onUploadSuccess={onUploadSuccess}
                />
              );
            }

            if (selectedCategory === 'submitted') {
              return (
                <DocumentsTable
                  applicationId={applicationId}
                  currentPage={documentsPage}
                  limit={documentsLimit}
                  onPageChange={onDocumentsPageChange}
                  isClientView
                  clientDocumentsData={documentsResponse}
                  clientIsLoading={isDocumentsLoading}
                  clientError={documentsError}
                  onClientDeleteSuccess={onClientDeleteSuccess}
                  onReuploadDocument={onReuploadDocument}
                  onUploadSuccess={onUploadSuccess}
                />
              );
            }

            return (
              <DocumentChecklistTable
                documents={allDocuments}
                isLoading={isChecklistLoading}
                error={checklistError}
                applicationId={applicationId}
                selectedCategory={selectedCategory as DocumentCategory}
                companies={companies}
                isClientView
                checklistData={checklistData}
                checklistState={checklistState}
                onAddCompany={onAddCompany}
                onRemoveCompany={onRemoveCompany}
              />
            );
          })()}
        </div>
      )}
    </div>
  );
}

