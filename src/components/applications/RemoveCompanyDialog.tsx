'use client';

import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';
import { Company } from '@/types/documents';

interface RemoveCompanyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  company: Company;
}

export function RemoveCompanyDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  company 
}: RemoveCompanyDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Remove Company
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove <strong>{company.name}</strong>? 
            <br /><br />
            <span className="text-orange-600 font-medium">
              ⚠️ You must first delete all documents uploaded for this company before removing it.
            </span>
            <br /><br />
            If you have uploaded documents for this company, please delete them first from the document checklist table.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Remove Company
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
