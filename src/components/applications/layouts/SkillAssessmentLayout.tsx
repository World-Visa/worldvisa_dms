'use client';

import { useState } from 'react';
import { DocumentCategoryFilter } from '@/components/applications/DocumentCategoryFilter';
import { DocumentChecklistTable } from '@/components/applications/DocumentChecklistTable';
import { DocumentsSummary } from '@/components/applications/DocumentsSummary';
import { DocumentsTable } from '@/components/applications/DocumentsTable';
import { Button } from '@/components/ui/button';
import { SampleDocumentsTable } from '@/components/applications/sample-documents/SampleDocumentsTable';
import { Document } from '@/types/applications';
import { Company, DocumentCategory } from '@/types/documents';

interface SkillAssessmentLayoutProps {
  allDocuments: Document[] | undefined;
  isAllDocumentsLoading: boolean;
  allDocumentsError: Error | null;
  selectedCategory: DocumentCategory;
  onCategoryChange: (category: DocumentCategory) => Promise<void>;
  companies: Company[];
  onAddCompany: () => void;
  onRemoveCompany: (companyName: string) => void;
  maxCompanies: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  checklistState: any;
  onStartCreatingChecklist: () => Promise<void>;
  onStartEditingChecklist: () => Promise<void>;
  onSaveChecklist: () => Promise<void>;
  onCancelChecklist: () => Promise<void>;
  isCategoryChanging: boolean;
  applicationId: string;
  documentsPage: number;
  onDocumentsPageChange: (page: number) => void;
  onReuploadDocument: (documentId: string, documentType: string, category: string) => void;
  isClientView?: boolean;
}

export function SkillAssessmentLayout({
  allDocuments,
  isAllDocumentsLoading,
  allDocumentsError,
  selectedCategory,
  onCategoryChange,
  companies,
  onAddCompany,
  onRemoveCompany,
  maxCompanies,
  checklistState,
  onStartCreatingChecklist,
  onStartEditingChecklist,
  onSaveChecklist,
  onCancelChecklist,
  isCategoryChanging,
  applicationId,
  documentsPage,
  onDocumentsPageChange,
  onReuploadDocument,
  isClientView = false,
}: SkillAssessmentLayoutProps) {
  const [showSampleDocuments, setShowSampleDocuments] = useState(false);

  return (
    <>
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
            onClick={() => setShowSampleDocuments(true)}
          >
            Sample documents
          </Button>
        )}
      </div>

      {showSampleDocuments ? (
        <SampleDocumentsTable applicationId={applicationId} isClientView={isClientView} />
      ) : (
        <div className="space-y-6">
          <DocumentsSummary
            documents={allDocuments}
            isLoading={isAllDocumentsLoading}
            error={allDocumentsError}
          />

          <div className="space-y-6">
            <DocumentCategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={onCategoryChange}
              companies={companies}
              onAddCompany={onAddCompany}
              onRemoveCompany={onRemoveCompany}
              maxCompanies={maxCompanies}
              checklistState={checklistState.state}
              checklistCategories={checklistState.checklistCategories}
              hasCompanyDocuments={checklistState.hasCompanyDocuments}
              onStartCreatingChecklist={onStartCreatingChecklist}
              onStartEditingChecklist={onStartEditingChecklist}
              onSaveChecklist={
                checklistState.state === 'editing'
                  ? checklistState.savePendingChanges
                  : onSaveChecklist
              }
              onCancelChecklist={onCancelChecklist}
              isSavingChecklist={checklistState.isBatchSaving}
              isCategoryChanging={isCategoryChanging}
            />

            {selectedCategory === 'submitted' ? (
              <DocumentsTable
                applicationId={applicationId}
                currentPage={documentsPage}
                limit={10}
                onPageChange={onDocumentsPageChange}
                onReuploadDocument={onReuploadDocument}
                isClientView={isClientView}
              />
            ) : (
              <DocumentChecklistTable
                documents={allDocuments}
                isLoading={isAllDocumentsLoading}
                error={allDocumentsError}
                applicationId={applicationId}
                selectedCategory={selectedCategory}
                companies={companies}
                onRemoveCompany={onRemoveCompany}
                isClientView={isClientView}
                checklistState={checklistState.state}
                filteredDocuments={checklistState.filteredDocuments}
                currentChecklistDocuments={checklistState.currentChecklistDocuments}
                availableDocumentsForEditing={checklistState.availableDocumentsForEditing}
                selectedDocuments={checklistState.selectedDocuments}
                requirementMap={checklistState.requirementMap}
                onSelectDocument={checklistState.selectDocument}
                onUpdateDocumentRequirement={checklistState.updateDocumentRequirement}
                onUpdateChecklist={checklistState.updateChecklist}
                checklistData={checklistState.checklistData}
                pendingAdditions={checklistState.pendingAdditions}
                pendingDeletions={checklistState.pendingDeletions}
                pendingUpdates={[]}
                onAddToPendingChanges={checklistState.addToPendingChanges}
                onRemoveFromPendingChanges={checklistState.removeFromPendingChanges}
                onAddToPendingDeletions={checklistState.addToPendingDeletions}
                onRemoveFromPendingDeletions={checklistState.removeFromPendingDeletions}
                onSavePendingChanges={checklistState.savePendingChanges}
                onClearPendingChanges={checklistState.clearPendingChanges}
                isBatchDeleting={checklistState.isBatchDeleting}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

