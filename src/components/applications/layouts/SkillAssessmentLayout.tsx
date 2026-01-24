'use client';

import { DocumentCategoryFilter } from '@/components/applications/DocumentCategoryFilter';
import { DocumentChecklistTable } from '@/components/applications/DocumentChecklistTable';
import { DocumentsSummary } from '@/components/applications/DocumentsSummary';
import { DocumentsTable } from '@/components/applications/DocumentsTable';
import { SampleDocumentsTable } from '@/components/applications/sample-documents/SampleDocumentsTable';
import { Document } from '@/types/applications';
import { Company, DocumentCategory } from '@/types/documents';

interface SkillAssessmentLayoutProps {
  allDocuments: Document[] | undefined;
  isAllDocumentsLoading: boolean;
  allDocumentsError: Error | null;
  selectedCategory: DocumentCategory;
  onCategoryChange: (category: DocumentCategory) => void;
  companies: Company[];
  onAddCompany: () => void;
  onRemoveCompany: (companyName: string) => void;
  onRemoveCompanyWithCheck?: (companyName: string, companyCategory: string) => void;
  maxCompanies: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  checklistState: any;
  onStartCreatingChecklist: () => void;
  onStartEditingChecklist: () => void;
  onSaveChecklist: () => Promise<void>;
  onCancelChecklist: () => void;
  applicationId: string;
  onReuploadDocument: (documentId: string, documentType: string, category: string) => void;
  isClientView?: boolean;
  showSampleDocuments: boolean;
  onToggleSampleDocuments: () => void;
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
  onRemoveCompanyWithCheck,
  maxCompanies,
  checklistState,
  onStartCreatingChecklist,
  onStartEditingChecklist,
  onSaveChecklist,
  onCancelChecklist,
  applicationId,
  onReuploadDocument,
  isClientView = false,
  showSampleDocuments,
  onToggleSampleDocuments,
}: SkillAssessmentLayoutProps) {
  return (
    <>
      {showSampleDocuments ? (
        <SampleDocumentsTable applicationId={applicationId} isClientView={isClientView} />
      ) : (
        <div className="space-y-10">
          <DocumentsSummary
            documents={allDocuments}
            isLoading={isAllDocumentsLoading}
            error={allDocumentsError}
          />

          <div className="space-y-8">
            <DocumentCategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={onCategoryChange}
              companies={companies}
              onAddCompany={onAddCompany}
              onRemoveCompany={onRemoveCompany}
              onRemoveCompanyWithCheck={onRemoveCompanyWithCheck}
              documents={allDocuments}
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
            />

            {selectedCategory === 'submitted' ? (
              <DocumentsTable
                applicationId={applicationId}
                documents={allDocuments}
                isLoading={isAllDocumentsLoading}
                error={allDocumentsError}
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

