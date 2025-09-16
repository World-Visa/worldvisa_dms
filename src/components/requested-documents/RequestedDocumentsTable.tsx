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
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Eye, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  User
} from 'lucide-react';
import { RequestedDocument } from '@/lib/api/requestedDocuments';
import { useUpdateRequestedDocumentStatus } from '@/hooks/useRequestedDocuments';
import { cn } from '@/lib/utils';

interface RequestedDocumentsTableProps {
  documents: RequestedDocument[];
  isLoading?: boolean;
  type: 'requested-to-me' | 'my-requests';
  onViewDocument?: (document: RequestedDocument) => void;
  onDownloadDocument?: (document: RequestedDocument) => void;
}

export function RequestedDocumentsTable({
  documents,
  isLoading = false,
  type,
  onViewDocument,
  onDownloadDocument
}: RequestedDocumentsTableProps) {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const updateStatusMutation = useUpdateRequestedDocumentStatus();

  const handleStatusUpdate = async (documentId: string, status: 'approved' | 'rejected') => {
    setSelectedDocument(documentId);
    try {
      await updateStatusMutation.mutateAsync({
        documentId,
        status,
        message: status === 'rejected' ? 'Document needs revision' : 'Document approved'
      });
    } finally {
      setSelectedDocument(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        variant: 'secondary' as const, 
        icon: Clock, 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
      },
      approved: { 
        variant: 'default' as const, 
        icon: CheckCircle, 
        className: 'bg-green-100 text-green-800 border-green-200' 
      },
      rejected: { 
        variant: 'destructive' as const, 
        icon: XCircle, 
        className: 'bg-red-100 text-red-800 border-red-200' 
      },
      reviewed: { 
        variant: 'secondary' as const, 
        icon: Eye, 
        className: 'bg-blue-100 text-blue-800 border-blue-200' 
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={cn('flex items-center gap-1', config.className)}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { 
        variant: 'destructive' as const, 
        className: 'bg-red-100 text-red-800 border-red-200' 
      },
      medium: { 
        variant: 'secondary' as const, 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
      },
      low: { 
        variant: 'outline' as const, 
        className: 'bg-gray-100 text-gray-800 border-gray-200' 
      }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low;

    return (
      <Badge variant={config.variant} className={cn('text-xs', config.className)}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
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
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Document</TableHead>
            <TableHead>Requested By</TableHead>
            <TableHead>Requested To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Requested</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document, index) => {
            const isUpdating = selectedDocument === document._id;
            const isOverdue = document.isOverdue;
            const daysSinceRequest = document.daysSinceRequest;
            const priority = document.priority;

            return (
              <TableRow 
                key={`${document._id}-${index}`} 
                className={cn(
                  'hover:bg-gray-50 transition-colors',
                  isOverdue && 'bg-red-50 border-l-4 border-l-red-400'
                )}
              >
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {document.document_name || document.file_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {document.document_category || 'Document'}
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
                  {getStatusBadge(document.requested_review.status)}
                </TableCell>
                
                <TableCell>
                  {getPriorityBadge(priority || 'low')}
                </TableCell>
                
                <TableCell>
                  <div className="text-sm text-gray-900">
                    {document.formattedRequestDate || 'Unknown date'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {document.uploaded_by} • {document.uploaded_at ? new Date(document.uploaded_at).toLocaleDateString() : 'Unknown date'}
                  </div>
                </TableCell>
                
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {document.comments.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MessageSquare className="h-3 w-3" />
                        {document.comments.length}
                      </div>
                    )}
                    
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDocument?.(document)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {document.download_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDownloadDocument?.(document)}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {type === 'requested-to-me' && document.requested_review.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(document._id, 'approved')}
                            disabled={isUpdating}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(document._id, 'rejected')}
                            disabled={isUpdating}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
