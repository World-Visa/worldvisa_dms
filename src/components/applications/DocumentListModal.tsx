'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import ViewDocumentSheet from './ViewDocumentSheet';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';
import { useDeleteDocument } from '@/hooks/useMutationsDocuments';
import { Document } from '@/types/applications';

interface DocumentListModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: string;
  documents: Document[];
  applicationId: string;
  onDocumentDeleted?: () => void;
  isClientView?: boolean;
}

export function DocumentListModal({
  isOpen,
  onClose,
  documentType,
  documents,
  applicationId,
  onDocumentDeleted,
  isClientView = false
}: DocumentListModalProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; name: string } | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  const deleteDocumentMutation = useDeleteDocument();

  const handleDeleteDocument = (documentId: string, fileName: string) => {
    setDocumentToDelete({ id: documentId, name: fileName });
    setDeleteDialogOpen(true);
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setViewSheetOpen(true);
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
                <div
                  key={document._id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Image 
                      src="/icons/pdf_small.svg" 
                      alt="PDF" 
                      width={20} 
                      height={20}
                      className="flex-shrink-0"
                    />
                    <div>
                      <p className="font-medium text-sm">{document.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded by {document.uploaded_by} • {new Date(document.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        document.status === 'approved' && "bg-green-100 text-green-800",
                        document.status === 'rejected' && "bg-red-100 text-red-800",
                        document.status === 'reviewed' && "bg-blue-100 text-blue-800",
                        document.status === 'request_review' && "bg-yellow-100 text-yellow-800",
                        document.status === 'pending' && "bg-gray-100 text-gray-800"
                      )}
                    >
                      {document.status.replace('_', ' ')}
                    </Badge>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handleViewDocument(document)}
                      className='cursor-pointer'
                    >
                      view
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDocument(document._id, document.file_name)}
                      disabled={deleteDocumentMutation.isPending}
                      className="cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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
          isClientView={isClientView}
        />
      )}
    </Dialog>
  );
}
