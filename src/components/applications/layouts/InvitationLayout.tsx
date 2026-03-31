"use client";

import { useState } from "react";
import { StageDocumentsEmptyState } from "@/components/applications/layouts/StageDocumentsEmptyState";
import { StageDocumentsHeaderAction } from "@/components/applications/layouts/StageDocumentsHeaderAction";
import { Stage2DocumentsTable } from "@/components/applications/Stage2DocumentsTable";
import { toast } from "sonner";
import {
  useStage2Documents,
  useDeleteStage2Document,
} from "@/hooks/useStage2Documents";
import { InvitationModal } from "@/components/applications/modals/InvitationModal";
import type {
  InvitationLayoutProps,
  Stage2Document,
} from "@/types/stage2Documents";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

interface InvitationLayoutComponentProps extends InvitationLayoutProps {
  isClientView?: boolean;
}

export function InvitationLayout({
  applicationId,
  isClientView = false,
}: InvitationLayoutComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Stage2Document | null>(
    null,
  );
  const [documentToDelete, setDocumentToDelete] =
    useState<Stage2Document | null>(null);

  const { data, isLoading, error } = useStage2Documents(
    applicationId,
    "invitation",
  );
  const deleteMutation = useDeleteStage2Document();

  const documents = data?.data || [];

  const handleView = (document: Stage2Document) => {
    const url = document.document_link || document.download_url;
    if (!url) {
      toast.error("Document URL not available");
      return;
    }

    const width = 800;
    const height = 600;
    const top = (window.screen.height - height) / 2;
    const left = (window.screen.width - width) / 2;

    window.open(
      url,
      "_blank",
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`,
    );
  };

  const handleEditClick = (document: Stage2Document) => {
    setEditingDocument(document);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (document: Stage2Document) => {
    setDocumentToDelete(document);
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

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDocument(null);
  };

  return (
    <>
      <div className="space-y-4">
        {error ? (
          <ErrorState title="Failed to load invitation documents" message="Please try again later." />
        ) : !isLoading && documents.length === 0 ? (
          <StageDocumentsEmptyState
            title="No Invitation Yet"
            description="No invitation documents have been uploaded for this application."
            isClientView={isClientView}
            createButtonLabel="Create Invitation"
            onCreate={() => setIsModalOpen(true)}
            actionButtonClassName="bg-primary-blue"
          />
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Invitation Documents</h2>
              <StageDocumentsHeaderAction
                isClientView={isClientView}
                label="Add Invitation Document"
                onClick={() => setIsModalOpen(true)}
                buttonClassName="bg-primary-blue"
              />
            </div>
            <Stage2DocumentsTable
              type="invitation"
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
          <InvitationModal
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
