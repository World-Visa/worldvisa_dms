"use client";

import { useMemo, useCallback, useState } from "react";
import { DocumentCategoryFilter } from "@/components/applications/DocumentCategoryFilter";
import { DocumentChecklistTable } from "@/components/applications/DocumentChecklistTable";
import { DocumentsTable } from "@/components/applications/DocumentsTable";
import { ChecklistRequestSuccessCard } from "@/components/applications/ChecklistRequestSuccessCard";
import { RequestChecklistCard } from "@/components/applications/RequestChecklistCard";
import { SampleDocumentsTable } from "@/components/applications/sample-documents/SampleDocumentsTable";
import { FacetedFormFilter } from "@/components/ui/faceted-filter/facated-form-filter";
import { Button as ButtonV2 } from "@/components/ui/primitives/button";
import type { Document } from "@/types/applications";
import type { ClientDocumentsResponse } from "@/types/client";
import type { Company, DocumentCategory } from "@/types/documents";
import type { ChecklistResponse } from "@/types/checklist";
import { DocumentStatus } from "@/lib/enums";
import { generateChecklistCategories } from "@/lib/checklist/categoryUtils";
import { AnimatePresence, motion } from "framer-motion";

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
  visaServiceType?: string;
}

export function ClientSkillAssessmentLayout({
  applicationId,
  selectedCategory,
  onCategoryChange,
  maxCompanies = 5,
  companies,
  onAddCompany,
  onRemoveCompany,
  onRemoveCompanyWithCheck: _onRemoveCompanyWithCheck,
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
  visaServiceType,
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

  const [documentStatusFilter, setDocumentStatusFilter] = useState<DocumentStatus | null>(null);

  const documentStatusOptions = useMemo(() => {
    const docs = (allDocuments ?? []) as Document[];
    return [
      { label: `Pending (${docs.filter((d) => d.status === DocumentStatus.Pending).length})`, value: DocumentStatus.Pending },
      { label: `Approved (${docs.filter((d) => d.status === DocumentStatus.Approved).length})`, value: DocumentStatus.Approved },
      { label: `Reviewed (${docs.filter((d) => d.status === DocumentStatus.Reviewed).length})`, value: DocumentStatus.Reviewed },
      { label: `Requested (${docs.filter((d) => d.status === DocumentStatus.RequestReview).length})`, value: DocumentStatus.RequestReview },
      { label: `Rejected (${docs.filter((d) => d.status === DocumentStatus.Rejected).length})`, value: DocumentStatus.Rejected },
    ] satisfies { label: string; value: DocumentStatus }[];
  }, [allDocuments]);

  const filteredDocumentsResponse = useMemo(() => {
    if (!documentStatusFilter || !allDocumentsResponse?.data) {
      return allDocumentsResponse;
    }
    return {
      ...allDocumentsResponse,
      data: {
        ...allDocumentsResponse.data,
        documents: allDocumentsResponse.data.documents?.filter(
          (d) => d.status === documentStatusFilter,
        ) ?? [],
      },
    };
  }, [allDocumentsResponse, documentStatusFilter]);

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
        <SampleDocumentsTable
          applicationId={applicationId}
          isClientView
          onBack={onToggleSampleDocuments}
        />
      ) : (
        <div className="space-y-6">
          <DocumentCategoryFilter
            selectedCategory={selectedCategory as string}
            onCategoryChange={onCategoryChange}
            companies={companies}
            documents={allDocuments}
            maxCompanies={maxCompanies}
            isClientView
            submittedDocumentsCount={submittedDocumentsCount}
            checklistState={checklistState}
            checklistCategories={checklistCategories}
            hasCompanyDocuments={hasCompanyDocuments}
            onAddCompany={onAddCompany}
            showSampleDocuments={showSampleDocuments}
            onToggleSampleDocuments={onToggleSampleDocuments}
          />

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
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
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base text-neutral-900"> Your Submitted Documents</h2>
                        <div className="flex flex-wrap items-center gap-2">
                          <FacetedFormFilter
                            type="single"
                            size="small"
                            title="Status"
                            placeholder="Filter by status…"
                            options={documentStatusOptions}
                            selected={documentStatusFilter ? [documentStatusFilter] : []}
                            onSelect={(vals) =>
                              setDocumentStatusFilter(
                                (vals[0] as DocumentStatus | undefined) ?? null,
                              )
                            }
                          />
                          {documentStatusFilter && (
                            <ButtonV2
                              variant="secondary"
                              mode="ghost"
                              size="2xs"
                              className="text-xs! font-normal! text-neutral-700"
                              onClick={() => setDocumentStatusFilter(null)}
                            >
                              Reset
                            </ButtonV2>
                          )}
                        </div>
                      </div>
                      <DocumentsTable
                        applicationId={applicationId}
                        clientLeadId={leadId}
                        isClientView
                        clientDocumentsData={filteredDocumentsResponse}
                        clientIsLoading={isDocumentsLoading}
                        clientError={documentsError}
                        onClientDeleteSuccess={onClientDeleteSuccess}
                        onReuploadDocument={onReuploadDocument}
                        onUploadSuccess={onUploadSuccess}
                      />
                    </div>
                  );
                }

                if (selectedCategory === "submitted") {
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base text-neutral-900"> Your Submitted Documents</h2>
                        <div className="flex flex-wrap items-center gap-2">
                        <FacetedFormFilter
                          type="single"
                          size="small"
                          title="Status"
                          placeholder="Filter by status…"
                          options={documentStatusOptions}
                          selected={documentStatusFilter ? [documentStatusFilter] : []}
                          onSelect={(vals) =>
                            setDocumentStatusFilter(
                              (vals[0] as DocumentStatus | undefined) ?? null,
                            )
                          }
                        />
                        {documentStatusFilter && (
                          <ButtonV2
                            variant="secondary"
                            mode="ghost"
                            size="2xs"
                            className="text-xs! font-normal! text-neutral-700"
                            onClick={() => setDocumentStatusFilter(null)}
                          >
                              Reset
                            </ButtonV2>
                          )}
                        </div>
                      </div>
                      <DocumentsTable
                        applicationId={applicationId}
                        clientLeadId={leadId}
                        isClientView
                        clientDocumentsData={filteredDocumentsResponse}
                        clientIsLoading={isDocumentsLoading}
                        clientError={documentsError}
                        onClientDeleteSuccess={onClientDeleteSuccess}
                        onReuploadDocument={onReuploadDocument}
                        onUploadSuccess={onUploadSuccess}
                      />
                    </div>
                  );
                }

                return (
                  <DocumentChecklistTable
                    documents={allDocuments}
                    isLoading={isChecklistLoading}
                    error={checklistError}
                    applicationId={applicationId}
                    clientLeadId={leadId}
                    selectedCategory={selectedCategory as DocumentCategory}
                    companies={companies}
                    isClientView
                    checklistData={checklistData}
                    checklistState={checklistState}
                    onAddCompany={onAddCompany}
                    onRemoveCompany={onRemoveCompany}
                    visaServiceType={visaServiceType}
                  />
                );
              })()}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
