'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  AlertTriangle,
  MessageSquare,
  User
} from 'lucide-react';
import { RequestedDocument } from '@/lib/api/requestedDocuments';
import { StatusBadge } from './StatusBadge';
import { RequestedDocumentViewSheet } from './RequestedDocumentViewSheet';
import { RequestedDocumentType } from '@/types/common';

import { cn } from '@/lib/utils';
import { getCategoryDisplayProps } from '@/lib/utils/documentCategoryNormalizer';
import { useRequestedDocumentRealtime } from '@/hooks/useRequestedDocumentRealtime';

interface RequestedDocumentsTableProps {
  documents: RequestedDocument[];
  isLoading?: boolean;
  type: RequestedDocumentType;
}

export function RequestedDocumentsTable({
  documents,
  isLoading = false,
  type
}: RequestedDocumentsTableProps) {
  const [selectedDocument, setSelectedDocument] = useState<RequestedDocument | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Enable real-time updates for requested documents
  useRequestedDocumentRealtime();

  const handleViewDocument = (document: RequestedDocument) => {
    setSelectedDocument(document);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setSelectedDocument(null);
  };



  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
        <p className="text-gray-500">
          {type === 'requested-to-me' 
            ? 'No documents have been requested for your review yet.'
            : 'You haven\'t requested any documents for review yet.'
          }
        </p>
      </div>
    );
  }


    return (
      <>
        <div className="border rounded-lg overflow-hidden">
          <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Document</TableHead>
            <TableHead>Requested By</TableHead>
             <TableHead>Requested To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requested</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document, index) => {
            const isOverdue = document.isOverdue;
            const daysSinceRequest = document.daysSinceRequest;

            return (
              <TableRow 
                key={`${document._id}-${index}`} 
                className={cn(
                  'hover:bg-gray-50 transition-colors',
                  isOverdue && 'border-l-4 border-l-red-400'
                )}
              >
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {(document.document_name || document.file_name).length > 15
                          ? (document.document_name || document.file_name).substring(0, 15) + '...'
                          : (document.document_name || document.file_name)
                        }
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {document.document_category 
                          ? getCategoryDisplayProps(document.document_category).category 
                          : 'Document'
                        }
                      </p>
                      {isOverdue && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-red-600 font-medium">
                            Overdue ({daysSinceRequest} days)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {document.requested_review.requested_by}
                    </span>
                  </div>
                </TableCell>
                
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {document.requested_review.requested_to}
                      </span>
                    </div>
                  </TableCell>
                
                <TableCell>
                  <StatusBadge status={document.requested_review.status} />
                </TableCell>
                
                <TableCell>
                  <div className="text-sm text-gray-900">
                    {document.requested_review.requested_at ? new Date(document.requested_review.requested_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      timeZone: 'UTC'
                    }) : 'Unknown date'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {document.requested_review.requested_by} • {document.requested_review.requested_at ? new Date(document.requested_review.requested_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'UTC'
                    }) : 'Unknown time'}
                  </div>
                </TableCell>
                
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {document.requested_review.messages && document.requested_review.messages.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MessageSquare className="h-3 w-3" />
                        {document.requested_review.messages.length}
                      </div>
                    )}
                    
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleViewDocument(document)}
                        className="h-8 w-8 p-0 text-blue-500 cursor-pointer hover:text-blue-600"
                      >
                        view 
                      </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        </Table>
        </div>

        {/* View Sheet */}
        <RequestedDocumentViewSheet
          document={selectedDocument}
          isOpen={isSheetOpen}
          onClose={handleCloseSheet}
          type={type}
        />
      </>
    );
  }
