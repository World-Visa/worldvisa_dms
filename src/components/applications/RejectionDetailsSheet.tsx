'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, AlertCircle } from 'lucide-react';
import { Document } from '@/types/applications';

interface RejectionDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  documentType: string;
  category: string;
  onReupload: (documentId: string, documentType: string, category: string) => void;
  isReuploading?: boolean;
}

export function RejectionDetailsSheet({
  isOpen,
  onClose,
  document,
  documentType,
  category,
  onReupload,
  isReuploading = false
}: RejectionDetailsSheetProps) {
  if (!document) return null;

  // Ensure document type and category are not empty - use fallback if needed
  const finalDocumentType = documentType || document.document_type || 'Document';
  const finalCategory = category || document.document_category || 'Other Documents';

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Document Rejection Details
          </SheetTitle>
          <SheetDescription>
            View the full rejection details and reupload your document
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Document Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Document Type:</span>
            </div>
            <Badge variant="outline" className="text-sm">
              {finalDocumentType}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Category:</span>
            </div>
            <Badge variant="outline" className="text-sm">
              {finalCategory}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">File Name:</span>
            </div>
            <p className="text-sm text-muted-foreground break-words">
              {document.file_name}
            </p>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
            </div>
            <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
              Rejected
            </Badge>
          </div>

          {/* Rejection Message */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="font-medium">Rejection Reason:</span>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 whitespace-pre-wrap break-words">
                {document.reject_message || 'No specific reason provided.'}
              </p>
            </div>
          </div>

          {/* Upload Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Uploaded By:</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {document.uploaded_by}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Upload Date:</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(document.uploaded_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4 border-t">
            <Button
              onClick={() => onReupload(document._id, finalDocumentType, finalCategory)}
              disabled={isReuploading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isReuploading ? 'Reuploading...' : 'Reupload Document'}
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
