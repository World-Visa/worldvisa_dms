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
  
  const deleteDocumentMutation = useDeleteDocument();
  const queryClient = useQueryClient();

  // Ensure all documents are cached for real-time updates when modal opens
  useEffect(() => {
    if (isOpen && documents.length > 0) {
      documents.forEach(doc => {
        queryClient.setQueryData(['document', doc._id], doc);
        console.log('Cached document in DocumentListModal:', doc._id, doc.status);
      });
    }
  }, [isOpen, documents, queryClient]);

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

  const handleCloseViewSheet = () => {
    setViewSheetOpen(false);
    setSelectedDocument(null);
  };


  const confirmDelete = async () => {
    if (!documentToDelete) return;
    
    try {
      await deleteDocumentMutation.mutateAsync(documentToDelete.id);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      onDocumentDeleted?.(); 
    } catch {
      // Error is handled in the mutation hook
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
                  isDeleting={deleteDocumentMutation.isPending}
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
        isDeleting={deleteDocumentMutation.isPending}
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
    </Dialog>
  );
}
