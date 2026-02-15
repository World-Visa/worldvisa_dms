import { DocumentsTable } from "@/components/applications/DocumentsTable";
import { DocumentChecklistTable } from "@/components/applications/DocumentChecklistTable";
import { RequestChecklistCard } from "@/components/applications/RequestChecklistCard";
import { ChecklistRequestSuccessCard } from "@/components/applications/ChecklistRequestSuccessCard";
import { DocumentCategory, Company } from "@/types/documents";
import { Document } from "@/types/applications";
import { ChecklistResponse } from "@/types/checklist";
import { ClientDocumentsResponse } from "@/types/client";
import { ClientApplicationResponse } from "@/types/client";

interface ClientDocumentsContentProps {
  applicationId: string;
  applicationData?: ClientApplicationResponse;
  allDocumentsData?: ClientDocumentsResponse;
  documentsData?: ClientDocumentsResponse;
  checklistData?: ChecklistResponse;
  selectedCategory: string;
  documentsPage: number;
  documentsLimit: number;
  companies: Company[];
  isDocumentsLoading: boolean;
  isChecklistLoading: boolean;
  documentsError: Error | null;
  checklistError: Error | null;
  onDocumentsPageChange: (page: number) => void;
  onReuploadDocument: (
    documentId: string,
    documentType: string,
    category: string,
  ) => void;
  onUploadSuccess: () => void;
  onDeleteSuccess: () => void;
  onAddCompany: () => void;
  onRemoveCompany: (companyName: string) => void;
}

export function ClientDocumentsContent({
  applicationId,
  applicationData,
  allDocumentsData,
  documentsData,
  checklistData,
  selectedCategory,
  documentsPage,
  documentsLimit,
  companies,
  isDocumentsLoading,
  isChecklistLoading,
  documentsError,
  checklistError,
  onDocumentsPageChange,
  onReuploadDocument,
  onUploadSuccess,
  onDeleteSuccess,
  onAddCompany,
  onRemoveCompany,
}: ClientDocumentsContentProps) {
  const hasChecklist =
    checklistData?.data &&
    Array.isArray(checklistData.data) &&
    checklistData.data.length > 0;
  const hasSubmittedDocuments =
    (allDocumentsData?.data?.documents?.length || 0) > 0;

  // Check if checklist has been requested
  const checklistRequested =
    applicationData?.data?.Checklist_Requested === true;
  const leadId = applicationData?.data?.leadId || applicationData?.data?.id;

  // If checklist has been requested, show success card
  if (checklistRequested && !hasChecklist) {
    return (
      <ChecklistRequestSuccessCard
        onRefresh={() => {
          window.location.reload();
        }}
        requestedAt={applicationData?.data?.Checklist_Requested_At}
      />
    );
  }

  // If no checklist and no submitted documents, show the request card
  if (
    !hasChecklist &&
    !hasSubmittedDocuments &&
    !checklistRequested &&
    leadId
  ) {
    return (
      <RequestChecklistCard
        leadId={leadId}
        onRequestSuccess={() => {
          // Refresh the page to show success state
          window.location.reload();
        }}
      />
    );
  }

  // If no checklist but has submitted documents, show submitted documents
  if (!hasChecklist && hasSubmittedDocuments) {
    return (
      <DocumentsTable
        applicationId={applicationId}
        currentPage={documentsPage}
        limit={documentsLimit}
        onPageChange={onDocumentsPageChange}
        isClientView={true}
        clientDocumentsData={documentsData}
        clientIsLoading={isDocumentsLoading}
        clientError={documentsError}
        onClientDeleteSuccess={onDeleteSuccess}
        onReuploadDocument={onReuploadDocument}
        onUploadSuccess={onUploadSuccess}
      />
    );
  }

  // Normal rendering based on selected category
  if (selectedCategory === "submitted") {
    return (
      <DocumentsTable
        applicationId={applicationId}
        currentPage={documentsPage}
        limit={documentsLimit}
        onPageChange={onDocumentsPageChange}
        isClientView={true}
        clientDocumentsData={documentsData}
        clientIsLoading={isDocumentsLoading}
        clientError={documentsError}
        onClientDeleteSuccess={onDeleteSuccess}
        onReuploadDocument={onReuploadDocument}
        onUploadSuccess={onUploadSuccess}
      />
    );
  } else {
    return (
      <DocumentChecklistTable
        documents={allDocumentsData?.data?.documents as unknown as Document[]}
        isLoading={isChecklistLoading}
        error={checklistError}
        applicationId={applicationId}
        selectedCategory={selectedCategory as DocumentCategory}
        companies={companies}
        isClientView={true}
        checklistData={checklistData}
        checklistState={
          checklistData?.data && checklistData.data.length > 0
            ? "saved"
            : "none"
        }
        onAddCompany={onAddCompany}
        onRemoveCompany={onRemoveCompany}
      />
    );
  }
}
