"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";

interface ReviewedDocumentAlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReupload: () => void;
}

export function ReviewedDocumentAlertDialog({
  isOpen,
  onClose,
  onReupload,
}: ReviewedDocumentAlertDialogProps) {
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Document in review
          </AlertDialogTitle>
          <AlertDialogDescription>
            Your document has moved to review. At that stage you can&apos;t
            delete the document. Instead, reupload the document.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Close</AlertDialogCancel>
          <AlertDialogAction
            onClick={onReupload}
            className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-600"
          >
            Reupload
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
