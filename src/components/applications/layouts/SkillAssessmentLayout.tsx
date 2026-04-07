"use client";

import { useMemo, useState } from "react";
import { DocumentCategoryFilter } from "@/components/applications/DocumentCategoryFilter";
import { DocumentChecklistTable } from "@/components/applications/DocumentChecklistTable";
import { DocumentsTable } from "@/components/applications/DocumentsTable";
import { SampleDocumentsTable } from "@/components/applications/sample-documents/SampleDocumentsTable";
import { CreateChecklistButton } from "@/components/applications/checklist/CreateChecklistButton";
import { ListNoResults } from "@/components/applications/list-no-results";
import { Button as ButtonV2 } from "@/components/ui/primitives/button";
import { FacetedFormFilter } from "@/components/ui/faceted-filter/facated-form-filter";
import { Document } from "@/types/applications";
import { Company, DocumentCategory } from "@/types/documents";
import { DocumentStatus } from "@/lib/enums";
import { AnimatePresence, motion } from "framer-motion";
import { FADE_ANIMATION } from "@/components/v2/users/Settings";
import { ROUTES } from "@/utils/routes";

interface SkillAssessmentLayoutProps {
  allDocuments: Document[] | undefined;
  isApplicationDocumentsLoading?: boolean;
  isAllDocumentsLoading: boolean;
  allDocumentsError: Error | null;
  selectedCategory: DocumentCategory;
  onCategoryChange: (category: DocumentCategory) => void;
  companies: Company[];
  onAddCompany: () => void;
  onRemoveCompany: (companyName: string) => void;
  onRemoveCompanyWithCheck?: (
    companyName: string,
    companyCategory: string,
  ) => void;
  maxCompanies: number;
  checklistState: any;
  applicationId: string;
  onReuploadDocument: (
    documentId: string,
    documentType: string,
    category: string,
  ) => void;
  isClientView?: boolean;
  showSampleDocuments: boolean;
  onShowSampleDocuments: () => void;
  onHideSampleDocuments: () => void;
}

export function SkillAssessmentLayout({
  allDocuments,
  isApplicationDocumentsLoading = false,
  isAllDocumentsLoading,
  allDocumentsError,
  selectedCategory,
  onCategoryChange,
  companies,
  onAddCompany,
  onRemoveCompany: _onRemoveCompany,
  onRemoveCompanyWithCheck: _onRemoveCompanyWithCheck,
  maxCompanies,
  checklistState,
  applicationId,
  onReuploadDocument,
  isClientView = false,
  showSampleDocuments,
  onShowSampleDocuments,
  onHideSampleDocuments,
}: SkillAssessmentLayoutProps) {
  const [documentStatusFilter, setDocumentStatusFilter] = useState<
    DocumentStatus | null
  >(null);

  const createChecklistAction =
    !isClientView && checklistState.state === "none" ? (
      <CreateChecklistButton
        href={ROUTES.APPLICATION_CHECKLIST(applicationId)}
      />
    ) : undefined;

  const documentsListLoading =
    isApplicationDocumentsLoading || isAllDocumentsLoading;

  const documentsForTables = useMemo(() => {
    if (!documentStatusFilter || !allDocuments) return allDocuments ?? [];
    return allDocuments.filter((d) => d.status === documentStatusFilter);
  }, [allDocuments, documentStatusFilter]);

  const isEmptyFilteredResults =
    Boolean(documentStatusFilter) &&
    !documentsListLoading &&
    documentsForTables.length === 0;

  const documentStatusOptions = useMemo(() => {
    const docs = allDocuments ?? [];
    const counts = {
      pending: docs.filter((d) => d.status === DocumentStatus.Pending).length,
      approved: docs.filter((d) => d.status === DocumentStatus.Approved).length,
      reviewed: docs.filter((d) => d.status === DocumentStatus.Reviewed).length,
      request_review: docs.filter((d) => d.status === DocumentStatus.RequestReview).length,
      rejected: docs.filter((d) => d.status === DocumentStatus.Rejected).length,
    } as const;

    return [
      { label: `Pending (${counts.pending})`, value: DocumentStatus.Pending },
      { label: `Approved (${counts.approved})`, value: DocumentStatus.Approved },
      { label: `Reviewed (${counts.reviewed})`, value: DocumentStatus.Reviewed },
      { label: `Requested (${counts.request_review})`, value: DocumentStatus.RequestReview },
      { label: `Rejected (${counts.rejected})`, value: DocumentStatus.Rejected },
    ] satisfies { label: string; value: DocumentStatus }[];
  }, [allDocuments]);

  return (
    <div className="space-y-12">
      {showSampleDocuments ? (
        <motion.div {...FADE_ANIMATION}>
          <SampleDocumentsTable
            applicationId={applicationId}
            isClientView={isClientView}
            onBack={onHideSampleDocuments}
          />
        </motion.div>
      ) : (
        <div className="space-y-8">
          <DocumentCategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            companies={companies}
            documents={allDocuments}
            maxCompanies={maxCompanies}
            checklistState={checklistState.state}
            checklistCategories={checklistState.checklistCategories}
            hasCompanyDocuments={checklistState.hasCompanyDocuments}
            onAddCompany={onAddCompany}
            showSampleDocuments={showSampleDocuments}
            onToggleSampleDocuments={
              showSampleDocuments ? onHideSampleDocuments : onShowSampleDocuments
            }
          />

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {selectedCategory === "submitted" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                  <h2 className="text-base text-neutral-900">Submitted Documents</h2>
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
                  {isEmptyFilteredResults ? (
                    <div className="py-16 h-full">
                      <ListNoResults
                        title="No matching documents found"
                        description="We couldn't find any documents that match your selected status. Try adjusting or clearing the filter."
                        onClearFilters={() => setDocumentStatusFilter(null)}
                      />
                    </div>
                  ) : (
                    <DocumentsTable
                      applicationId={applicationId}
                      documents={documentsForTables}
                      isLoading={documentsListLoading}
                      error={allDocumentsError}
                      onReuploadDocument={onReuploadDocument}
                      isClientView={isClientView}
                      emptyStateAction={createChecklistAction}
                    />
                  )}
                </div>
              ) : (
                <DocumentChecklistTable
                  documents={documentsForTables}
                  isLoading={documentsListLoading}
                  error={allDocumentsError}
                  applicationId={applicationId}
                  selectedCategory={selectedCategory}
                  companies={companies}
                  isClientView={isClientView}
                  checklistState={checklistState.state}
                  checklistData={checklistState.checklistData}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
