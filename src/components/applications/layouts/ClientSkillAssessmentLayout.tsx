"use client";

import { useMemo, useCallback } from "react";

import { DocumentCategoryFilter } from "@/components/applications/DocumentCategoryFilter";
import { DocumentChecklistTable } from "@/components/applications/DocumentChecklistTable";
import { DocumentsTable } from "@/components/applications/DocumentsTable";
import { ChecklistRequestSuccessCard } from "@/components/applications/ChecklistRequestSuccessCard";
import { RequestChecklistCard } from "@/components/applications/RequestChecklistCard";
import { SampleDocumentsTable } from "@/components/applications/sample-documents/SampleDocumentsTable";
import type { Document } from "@/types/applications";
import type { ClientDocumentsResponse } from "@/types/client";
import type { Company, DocumentCategory } from "@/types/documents";
import type { ChecklistResponse } from "@/types/checklist";
import { generateChecklistCategories } from "@/lib/checklist/categoryUtils";

interface ClientSkillAssessmentLayoutProps {
  applicationId: string;
  selectedCategory: DocumentCategory | string;
  onCategoryChange: (category: DocumentCategory | string) => void;
  maxCompanies?: number;
  companies: Company[];
  onAddCompany: () => void;
  onRemoveCompany: (companyName: string) => void;
  onRemoveCompanyWithCheck?: (
    companyName: string,
    companyCategory: string,
  ) => void;
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
  onReuploadDocument: (
    documentId: string,
    documentType: string,
    category: string,
  ) => void;
  onUploadSuccess: () => void;
  checklistRequested: boolean;
  checklistRequestedAt?: string;
  leadId?: string;
  onChecklistRefresh?: () => void;
  onChecklistRequestSuccess?: () => void;
  showSampleDocuments: boolean;
  onToggleSampleDocuments: () => void;
}

export function ClientSkillAssessmentLayout({
  applicationId,
  selectedCategory,
  onCategoryChange,
  maxCompanies = 5,
  companies,
  onAddCompany,
  onRemoveCompany,
  onRemoveCompanyWithCheck,
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
  showSampleDocuments,
  onToggleSampleDocuments,
}: ClientSkillAssessmentLayoutProps) {
  const allDocuments = useMemo(
    () =>
      allDocumentsResponse?.data?.documents as unknown as
        | Document[]
        | undefined,
    [allDocumentsResponse],
  );

  const submittedDocumentsCount =
    allDocumentsResponse?.data?.documents?.length ?? 0;
  const hasChecklist =
    Array.isArray(checklistData?.data) && checklistData.data.length > 0;
  const hasSubmittedDocuments = submittedDocumentsCount > 0;

  const checklistCategories = useMemo(
    () =>
      generateChecklistCategories(
        checklistData,
        allDocumentsResponse,
        companies,
      ),
    [checklistData, allDocumentsResponse, companies],
  );

  const hasCompanyDocuments = useMemo(
    () =>
      Array.isArray(checklistData?.data) &&
      checklistData.data.some(
        (item) =>
          item.document_category === "Company" ||
          item.document_category === "Company Documents",
      ),
    [checklistData?.data],
  );

  const checklistState = hasChecklist ? "saved" : "none";

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
            onRemoveCompanyWithCheck={onRemoveCompanyWithCheck}
            documents={allDocuments}
            maxCompanies={maxCompanies}
            isClientView
            submittedDocumentsCount={submittedDocumentsCount}
            checklistState={checklistState}
            checklistCategories={checklistCategories}
            hasCompanyDocuments={hasCompanyDocuments}
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

            if (
              !hasChecklist &&
              !hasSubmittedDocuments &&
              !checklistRequested &&
              leadId
            ) {
              return (
                <RequestChecklistCard
                  leadId={leadId}
                  onRequestSuccess={handleChecklistRequestSuccess}
                />
              );
            }

            if (!hasChecklist && hasSubmittedDocuments) {
              return (
                <DocumentsTable
                  applicationId={applicationId}
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

            if (selectedCategory === "submitted") {
              return (
                <DocumentsTable
                  applicationId={applicationId}
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
