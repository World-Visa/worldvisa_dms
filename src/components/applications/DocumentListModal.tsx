'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText } from 'lucide-react';
import ViewDocumentSheet from './ViewDocumentSheet';
import { Document } from '@/types/applications';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';
import { useDeleteDocument } from '@/hooks/useMutationsDocuments';
import { DocumentRow } from './DocumentRow';
import { useQueryClient } from '@tanstack/react-query';
import { useDocumentStatusUpdate } from '@/hooks/useDocumentStatusUpdate';
import { useAuth } from '@/hooks/useAuth';
import { ReuploadDocumentModal } from './ReuploadDocumentModal';

interface DocumentListModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: string;
  documents: Document[];
  applicationId: string;
  onDocumentDeleted?: () => void;
  onReuploadDocument?: (documentId: string, documentType: string, category: string) => void;
  category?: string;
  isClientView?: boolean;
}


export function DocumentListModal({
  isOpen,
  onClose,
  documentType,
  documents,
  applicationId,
  onDocumentDeleted,
  onReuploadDocument,
  category,
  isClientView = false
}: DocumentListModalProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; name: string } | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
  const [patchingDocumentId, setPatchingDocumentId] = useState<string | null>(null);
  const [isReuploadModalOpen, setIsReuploadModalOpen] = useState(false);
  const [selectedReuploadDocument, setSelectedReuploadDocument] = useState<Document | null>(null);
  const [selectedReuploadDocumentType, setSelectedReuploadDocumentType] = useState<string>('');
  const [selectedReuploadDocumentCategory, setSelectedReuploadDocumentCategory] = useState<string>('');
  
  const deleteDocumentMutation = useDeleteDocument();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Hook for updating document status
  const updateDocumentStatusMutation = useDocumentStatusUpdate({
    applicationId,
    documentId: patchingDocumentId || '',
    onSuccess: () => {
      setPatchingDocumentId(null);
      onDocumentDeleted?.();
    },
    onError: () => {
      setPatchingDocumentId(null);
    }
  });

  // Ensure all documents are cached for real-time updates when modal opens
  useEffect(() => {
    if (isOpen && documents.length > 0) {
      documents.forEach(doc => {
        queryClient.setQueryData(['document', doc._id], doc);
      });
    }
  }, [isOpen, documents, queryClient]);

  // Reset deleting and patching state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDeletingDocumentId(null);
      setPatchingDocumentId(null);
      setIsReuploadModalOpen(false);
      setSelectedReuploadDocument(null);
      setSelectedReuploadDocumentType('');
      setSelectedReuploadDocumentCategory('');
    }
  }, [isOpen]);

  const handleDeleteDocument = (documentId: string, fileName: string) => {
    setDocumentToDelete({ id: documentId, name: fileName });
    setDeleteDialogOpen(true);
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setViewSheetOpen(true);
  };

  const handleReuploadDocument = (documentId: string) => {
    if (onReuploadDocument && category) {
      onReuploadDocument(documentId, documentType, category);
    }
  };

  const handlePatchToPending = async (documentId: string) => {
    if (!user?.username) {
      console.error('User not authenticated');
      return;
    }

    setPatchingDocumentId(documentId);
    
    try {
      await updateDocumentStatusMutation.mutateAsync({
        documentId,
        status: 'pending',
        changedBy: user.username
      });
    } catch (error) {
      console.error('Failed to patch document to pending:', error);
    }
  };

  const handleOpenReuploadModal = (documentId: string, documentType: string, category: string) => {
    const documentToReupload = documents.find(doc => doc._id === documentId);
    if (!documentToReupload) {
      console.error('Document not found for reupload:', documentId);
      return;
    }

    setSelectedReuploadDocument(documentToReupload);
    setSelectedReuploadDocumentType(documentType);
    setSelectedReuploadDocumentCategory(category);
    setIsReuploadModalOpen(true);
  };

  const handleReuploadModalClose = () => {
    setIsReuploadModalOpen(false);
    setSelectedReuploadDocument(null);
    setSelectedReuploadDocumentType('');
    setSelectedReuploadDocumentCategory('');
  };

  const handleCloseViewSheet = () => {
    setViewSheetOpen(false);
    setSelectedDocument(null);
  };


  const confirmDelete = async () => {
    if (!documentToDelete) return;
    
    setDeletingDocumentId(documentToDelete.id);
    
    try {
      await deleteDocumentMutation.mutateAsync(documentToDelete.id);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      
      // Call the callback to refresh the parent component's data
      onDocumentDeleted?.();
      
      // Also manually refresh the documents list in this modal
      // by invalidating the relevant queries
      queryClient.invalidateQueries({ queryKey: ['client-documents-all'] });
      queryClient.invalidateQueries({ queryKey: ['application-documents-all'] });
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
      queryClient.invalidateQueries({ queryKey: ['application-documents'] });
    } catch {
      // Error is handled in the mutation hook
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Documents - {documentType}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No documents found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <DocumentRow
                  key={document._id}
                  document={document}
                  onView={handleViewDocument}
                  onDelete={handleDeleteDocument}
                  onReupload={handleReuploadDocument}
                  isClientView={isClientView}
                  isDeleting={deletingDocumentId === document._id}
                  onPatchToPending={(documentId) => handlePatchToPending(documentId)}
                  isPatching={patchingDocumentId === document._id}
                  onOpenReuploadModal={handleOpenReuploadModal}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <DeleteDocumentDialog
        isOpen={deleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        documentName={documentToDelete?.name || ''}
        isDeleting={deletingDocumentId === documentToDelete?.id}
      />

      {/* View Document Sheet */}
      {selectedDocument && (
        <ViewDocumentSheet
          document={selectedDocument}
          documents={documents}
          applicationId={applicationId}
          isOpen={viewSheetOpen}
          onClose={handleCloseViewSheet}
          onReuploadDocument={onReuploadDocument}
          documentType={documentType}
          category={category}
          isClientView={isClientView}
        />
      )}

      {/* Reupload Document Modal */}
      <ReuploadDocumentModal
        isOpen={isReuploadModalOpen}
        onClose={handleReuploadModalClose}
        applicationId={applicationId}
        document={selectedReuploadDocument}
        documentType={selectedReuploadDocumentType}
        category={selectedReuploadDocumentCategory}
      />
    </Dialog>
  );
}
