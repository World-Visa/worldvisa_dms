'use client';

import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Company } from '@/types/documents';
import { Button } from '@/components/ui/button';

interface RemoveCompanyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  company: Company;
  hasDocuments?: boolean;
  documentCount?: number;
  isDeleting?: boolean;
  onRemoveDocumentsAndCompany?: () => void;
}

export function RemoveCompanyDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  company,
  hasDocuments = false,
  documentCount = 0,
  isDeleting = false,
  onRemoveDocumentsAndCompany
}: RemoveCompanyDialogProps) {
  // Prevent dialog from closing when deletion is in progress
  const handleOpenChange = (open: boolean) => {
    if (!open && isDeleting) {
      // Block close during deletion
      return;
    }
    if (!open) {
      onClose();
    }
  };

  const descriptionId = `remove-company-desc-${company.name}`;

  return (
    <AlertDialog 
      open={isOpen} 
      onOpenChange={handleOpenChange}
    >
      <AlertDialogContent 
        aria-describedby={descriptionId}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Remove Company
          </AlertDialogTitle>
          <AlertDialogDescription id={descriptionId}>
            {hasDocuments ? (
              <>
                You have submitted <strong>{documentCount}</strong> document{documentCount !== 1 ? 's' : ''} for <strong>{company.name}</strong>.
                <br /><br />
                <span className="text-orange-600 font-medium">
                  Removing this company will delete all associated documents. This action cannot be undone.
                </span>
                {isDeleting && (
                  <>
                    <br /><br />
                    <span className="text-blue-600 font-medium flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting documents... Please wait. This dialog cannot be closed during deletion.
                    </span>
                  </>
                )}
              </>
            ) : (
              <>
                Are you sure you want to remove <strong>{company.name}</strong>? 
                <br /><br />
                <span className="text-orange-600 font-medium">
                  ⚠️ You must first delete all documents uploaded for this company before removing it.
                </span>
                <br /><br />
                If you have uploaded documents for this company, please delete them first from the document checklist table.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {hasDocuments ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isDeleting}
                aria-label="Close dialog"
              >
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={onRemoveDocumentsAndCompany}
                disabled={isDeleting}
                aria-label="Remove company and delete documents"
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Done'
                )}
              </Button>
            </>
          ) : (
            <>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={onConfirm}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                Remove Company
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
