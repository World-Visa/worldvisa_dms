"use client";

import { useState } from "react";
import { StageDocumentsEmptyState } from "@/components/applications/layouts/StageDocumentsEmptyState";
import { StageDocumentsHeaderAction } from "@/components/applications/layouts/StageDocumentsHeaderAction";
import { Stage2DocumentsTable } from "@/components/applications/Stage2DocumentsTable";
import { toast } from "sonner";
import { getDocumentUrl } from "@/lib/documents/getDocumentUrl";
import {
  useStage2Documents,
  useDeleteStage2Document,
} from "@/hooks/useStage2Documents";
import { OutcomeSheet } from "@/components/applications/stage2/sheets/OutcomeSheet";
import { ViewStage2DocumentModal } from "@/components/applications/stage2/ViewStage2DocumentModal";
import type {
  OutcomeLayoutProps,
  Stage2Document,
} from "@/types/stage2Documents";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

interface OutcomeLayoutComponentProps extends OutcomeLayoutProps {
  isClientView?: boolean;
}

export function OutcomeLayout({
  applicationId,
  isClientView = false,
}: OutcomeLayoutComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Stage2Document | null>(
    null,
  );
  const [documentToDelete, setDocumentToDelete] =
    useState<Stage2Document | null>(null);
  const [viewingDocument, setViewingDocument] = useState<Stage2Document | null>(
    null,
  );

  const { data, isLoading, error } = useStage2Documents(
    applicationId,
    "outcome",
  );
  const deleteMutation = useDeleteStage2Document();

  const documents = data?.data || [];

  const handleView = (document: Stage2Document) => {
    if (!getDocumentUrl(document)) {
      toast.error("Document URL not available");
    }
    setViewingDocument(document);
  };

  const handleEditClick = (document: Stage2Document) => {
    setEditingDocument(document);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (document: Stage2Document) => {
    setDocumentToDelete(document);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDocument(null);
  };

  const handleDeleteConfirm = async () => {
    if (documentToDelete) {
      try {
        await deleteMutation.mutateAsync({
          applicationId,
          documentId: documentToDelete._id,
        });
        setDocumentToDelete(null);
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  return (
    <>
      <ViewStage2DocumentModal
        isOpen={!!viewingDocument}
        onOpenChange={(open) => {
          if (!open) setViewingDocument(null);
        }}
        document={viewingDocument}
        isClientView={isClientView}
        previewLeadId={applicationId}
      />

      <div className="space-y-4">
        {error ? (
          <ErrorState title="Failed to load outcome documents" message="Please try again later." />
        ) : !isLoading && documents.length === 0 ? (
          <StageDocumentsEmptyState
            title="No Outcome Yet"
            description="No outcome documents have been uploaded for this application."
            isClientView={isClientView}
            createButtonLabel="Create Outcome"
            onCreate={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="pb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Outcome Documents</h2>
              <StageDocumentsHeaderAction
                isClientView={isClientView}
                label="Add Outcome"
                onClick={() => setIsModalOpen(true)}
              />
            </div>
            <Stage2DocumentsTable
              type="outcome"
              documents={documents}
              isLoading={isLoading}
              isClientView={isClientView}
              onView={handleView}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          </div>
        )}
      </div>

      {!isClientView && (
        <>
          <OutcomeSheet
            isOpen={isModalOpen}
            onClose={handleModalClose}
            applicationId={applicationId}
            document={editingDocument || undefined}
            mode={editingDocument ? "edit" : "create"}
          />

          <ConfirmationModal
            open={!!documentToDelete}
            onOpenChange={(open) => {
              if (!open) setDocumentToDelete(null);
            }}
            onConfirm={handleDeleteConfirm}
            variant="destructive"
            confirmText="Delete"
            isLoading={deleteMutation.isPending}
            disabled={!documentToDelete}
            title="Are you sure?"
            description={
              <>
                This will permanently delete the document &quot;
                {documentToDelete?.document_name || documentToDelete?.file_name}
                &quot;. This action cannot be undone.
              </>
            }
          />
        </>
      )}
    </>
  );
}
