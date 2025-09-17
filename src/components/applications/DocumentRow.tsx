'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Document } from '@/types/applications';
import { useDocumentData } from '@/hooks/useDocumentData';

interface DocumentRowProps {
  document: Document;
  onView: (document: Document) => void;
  onDelete: (documentId: string, fileName: string) => void;
  onReupload: (documentId: string) => void;
  isClientView: boolean;
  isDeleting: boolean;
}

export function DocumentRow({ 
  document, 
  onView, 
  onDelete, 
  onReupload, 
  isClientView, 
  isDeleting 
}: DocumentRowProps) {
  // Get real-time document data from cache
  const { document: currentDocument } = useDocumentData(document._id);
  
  // Use the current document from cache, fallback to prop
  const displayDocument = currentDocument || document;
  
 
  return (
    <div
      key={displayDocument._id}
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
        <div className="flex-1">
          <p className="font-medium text-sm">
            {displayDocument.file_name.length > 15 
              ? `${displayDocument.file_name.substring(0, 15)}...` 
              : displayDocument.file_name}
          </p>
          <p className="text-xs text-muted-foreground">
            Uploaded by {displayDocument.uploaded_by} • {new Date(displayDocument.uploaded_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            displayDocument.status === 'approved' && "bg-green-100 text-green-800",
            displayDocument.status === 'rejected' && "bg-red-100 text-red-800",
            displayDocument.status === 'reviewed' && "bg-blue-100 text-blue-800",
            displayDocument.status === 'request_review' && "bg-yellow-100 text-yellow-800",
            displayDocument.status === 'pending' && "bg-gray-100 text-gray-800"
          )}
        >
          {displayDocument.status.replace('_', ' ')}
        </Badge>
        <Button
          variant="link"
          size="sm"
          onClick={() => onView(displayDocument)}
          className='cursor-pointer'
        >
          view
        </Button>
        {/* Show reupload button for rejected documents */}
        {displayDocument.status === 'rejected' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReupload(displayDocument._id)}
            className="cursor-pointer text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
          >
            <Upload className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(displayDocument._id, displayDocument.file_name)}
          disabled={
            isClientView 
              ? (isDeleting || displayDocument.status === 'approved')
              : isDeleting
          }
          className="cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
