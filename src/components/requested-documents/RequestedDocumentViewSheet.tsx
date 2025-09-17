'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Calendar,
  CheckCircle,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { RequestedDocument } from '@/lib/api/requestedDocuments';
import { StatusBadge } from './StatusBadge';
import { useUpdateDocumentStatus, useDeleteRequestedDocument } from '@/hooks/useRequestedDocumentActions';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import DocumentPreview from '@/components/applications/DocumentPreview';
import { RequestedDocumentMessages } from './RequestedDocumentMessages';

interface RequestedDocumentViewSheetProps {
  document: RequestedDocument | null;
  isOpen: boolean;
  onClose: () => void;
  type: 'requested-to-me' | 'my-requests';
}

export function RequestedDocumentViewSheet({
  document,
  isOpen,
  onClose,
  type
}: RequestedDocumentViewSheetProps) {
  const { user } = useAuth();
  const updateStatusMutation = useUpdateDocumentStatus();
  const deleteDocumentMutation = useDeleteRequestedDocument();
  
  const [reviewComment, setReviewComment] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setReviewComment('');
      setIsReviewing(false);
    }
  }, [isOpen]);

  // Define callbacks before early return to avoid conditional hook calls
  const handleMarkAsReviewed = useCallback(async () => {
    if (!document || !user?.username || !reviewComment.trim()) {
      toast.error('Please add a review comment');
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        documentId: document._id,
        data: {
          status: 'approved',
          changed_by: user.username,
          reject_message: reviewComment.trim()
        }
      });
      setReviewComment('');
      onClose();
    } catch {
      // Error is handled by the mutation
    }
  }, [document, user?.username, reviewComment, updateStatusMutation, onClose]);

  const handleDeleteRequest = useCallback(async () => {
    if (!document || !document.requested_review._id) {
      toast.error('Cannot delete: Review ID not found');
      return;
    }

    try {
      await deleteDocumentMutation.mutateAsync({
        documentId: document._id,
        data: {
          reviewId: document.requested_review._id
        }
      });
      onClose();
    } catch {
      // Error is handled by the mutation
    }
  }, [document, deleteDocumentMutation, onClose]);

  if (!document) return null;

  const isRequestedToMe = type === 'requested-to-me';
  const canReview = isRequestedToMe && document.requested_review.status === 'pending';
  const canDelete = !isRequestedToMe; // Can only delete documents I requested

  // Convert RequestedDocument to Document format for DocumentPreview
  const documentForPreview = {
    _id: document._id,
    file_name: document.file_name,
    document_name: document.document_name,
    document_type: document.document_name || 'Document', // Use document_name as fallback
    document_category: document.document_category,
    document_link: document.document_link,
    uploaded_by: document.uploaded_by,
    uploaded_at: document.uploaded_at,
    status: document.status,
    description: '', // RequestedDocument doesn't have description
    workdrive_file_id: document.workdrive_file_id,
    record_id: document.record_id,
    workdrive_parent_id: '', // Add missing property
    history: document.history || [], // Add missing property
    comments: document.comments || [], // Add missing property
    __v: 0 // Add missing property
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[95vw] sm:w-[80vw] md:w-[70vw] lg:w-[60vw] xl:w-[1140px] !max-w-[1140px] p-0 rounded-l-3xl">
        <div className="flex flex-col h-full">
          {/* Header Bar */}
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="sr-only">Document Review</SheetTitle>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mx-2 sm:mx-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Requested by {document.requested_review.requested_by}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {document.formattedRequestDate || 'Unknown date'}
                  </span>
                </div>
                {document.isOverdue && (
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600 font-medium">
                      Overdue ({document.daysSinceRequest} days)
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={document.requested_review.status} />
              </div>
            </div>
          </SheetHeader>

          {/* Main Content */}
          <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden overflow-y-auto">
            {/* Document Section - Top on mobile, Left on desktop */}
            <div className="flex-1 p-2 sm:p-4 relative order-1 lg:order-1">
              <DocumentPreview document={documentForPreview} />

              {/* Action Buttons */}
              <div className="mt-4 space-y-2">
                {canReview && (
                  <div className="space-y-2">
                    <Button
                      onClick={() => setIsReviewing(!isReviewing)}
                      variant={isReviewing ? "outline" : "default"}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isReviewing ? 'Cancel Review' : 'Mark as Reviewed'}
                    </Button>
                    {isReviewing && (
                      <div className="space-y-2">
                        <textarea
                          placeholder="Add your review comment..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="w-full min-h-[80px] p-3 border rounded-md resize-none"
                        />
                        <Button
                          onClick={handleMarkAsReviewed}
                          disabled={updateStatusMutation.isPending || !reviewComment.trim()}
                          className="w-full"
                        >
                          {updateStatusMutation.isPending ? 'Marking...' : 'Submit Review'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {canDelete && (
                  <Button
                    variant="destructive"
                    onClick={handleDeleteRequest}
                    disabled={deleteDocumentMutation.isPending}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleteDocumentMutation.isPending ? 'Deleting...' : 'Delete Request'}
                  </Button>
                )}
              </div>
            </div>

            {/* Messages Section - Bottom on mobile, Right on desktop */}
            <div className="w-full lg:flex-shrink-0 lg:w-80 xl:w-96 order-2 lg:order-2 border-t lg:border-t-0 lg:border-l">
              <RequestedDocumentMessages
                documentId={document._id}
                reviewId={document.requested_review._id}
                type={type}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}