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
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { RequestedDocument } from '@/lib/api/requestedDocuments';
import { StatusBadge } from './StatusBadge';
import { RequestedDocumentType } from '@/types/common';
import { useUpdateDocumentStatus, useDeleteRequestedDocument } from '@/hooks/useRequestedDocumentActions';
import { useRequestedDocumentData } from '@/hooks/useRequestedDocumentData';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import DocumentPreview from '@/components/applications/DocumentPreview';
import { RequestedDocumentMessages } from './RequestedDocumentMessages';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { sendRequestedDocumentMessage } from '@/lib/api/requestedDocumentMessages';
import { useApplicationDetails } from '@/hooks/useApplicationDetails';
import { ApplicationDetailsAccordion } from './ApplicationDetailsAccordion';

interface RequestedDocumentViewSheetProps {
  document: RequestedDocument | null;
  isOpen: boolean;
  onClose: () => void;
  type: 'requested-to-me' | 'my-requests' | 'all-requests';
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
  const queryClient = useQueryClient();
  const router = useRouter();
  
  // Use the custom hook to get real-time document data (like ViewDocumentSheet pattern)
  const { document: currentDoc } = useRequestedDocumentData(document?._id || '');
  
  // Fallback to the passed document if not in cache
  const displayDoc = currentDoc || document;
  
  // Fetch application details for the compact application details card
  const { data: applicationResponse, isLoading: isApplicationLoading } = useApplicationDetails(displayDoc?.record_id || '');
  const application = applicationResponse?.data;
  
  // Ensure the document is cached for real-time updates
  useEffect(() => {
    if (displayDoc && !currentDoc && document) {
      queryClient.setQueryData(['requested-document', document._id], document);
    }
  }, [displayDoc, currentDoc, document, queryClient]);
  
  const [reviewComment, setReviewComment] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setReviewComment('');
      setIsReviewing(false);
      setIsAccordionOpen(false);
    }
  }, [isOpen]);

  // Define callbacks before early return to avoid conditional hook calls
  const handleMarkAsReviewed = useCallback(async () => {
    if (!displayDoc || !user?.username || !reviewComment.trim()) {
      toast.error('Please add a review comment');
      return;
    }

    try {
      // First, update the document status
      await updateStatusMutation.mutateAsync({
        documentId: displayDoc._id,
        data: {
          reviewId: displayDoc.requested_review._id,
          requested_by: displayDoc.requested_review.requested_by,
          requested_to: displayDoc.requested_review.requested_to,
          message: reviewComment.trim(),
          status: 'reviewed'
        }
      });

      // Then, send the review comment as a message
      try {
        await sendRequestedDocumentMessage(
          displayDoc._id,
          displayDoc.requested_review._id,
          { message: reviewComment.trim() }
        );
      } catch (messageError) {
        console.warn('Failed to send review comment as message:', messageError);
        // Don't fail the entire operation if message sending fails
      }

      setReviewComment('');
      setIsAccordionOpen(false); // Close accordion when review is submitted
      onClose();
    } catch {
      // Error is handled by the mutation
    }
  }, [displayDoc, user?.username, reviewComment, updateStatusMutation, onClose]);

  const handleDeleteRequest = useCallback(async () => {
    if (!displayDoc || !displayDoc.requested_review._id) {
      toast.error('Cannot delete: Review ID not found');
      return;
    }

    try {
      await deleteDocumentMutation.mutateAsync({
        documentId: displayDoc._id,
        data: {
          reviewId: displayDoc.requested_review._id
        }
      });
      onClose();
    } catch {
      // Error is handled by the mutation
    }
  }, [displayDoc, deleteDocumentMutation, onClose]);

  const handleViewApplication = useCallback(() => {
    if (!displayDoc?.record_id) {
      toast.error('Application record ID not found');
      return;
    }
    
    // Navigate to the application page
    router.push(`/admin/applications/${displayDoc.record_id}`);
    onClose(); // Close the sheet after navigation
  }, [displayDoc?.record_id, router, onClose]);

  if (!displayDoc) return null;

  const isRequestedToMe = type === 'requested-to-me';
  const canReview = isRequestedToMe && displayDoc.requested_review.status === 'pending';
  const canDelete = !isRequestedToMe; // Can only delete documents I requested

  // Convert RequestedDocument to Document format for DocumentPreview
  const documentForPreview = {
    _id: displayDoc._id,
    file_name: displayDoc.file_name,
    document_name: displayDoc.document_name,
    document_type: displayDoc.document_name || 'Document', // Use document_name as fallback
    document_category: displayDoc.document_category,
    document_link: displayDoc.document_link,
    uploaded_by: displayDoc.uploaded_by,
    uploaded_at: displayDoc.uploaded_at,
    status: displayDoc.status,
    description: '', // RequestedDocument doesn't have description
    workdrive_file_id: displayDoc.workdrive_file_id,
    record_id: displayDoc.record_id,
    workdrive_parent_id: '', // Add missing property
    history: displayDoc.history || [], // Add missing property
    comments: displayDoc.comments || [], // Add missing property
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
                    Requested by {displayDoc.requested_review.requested_by}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {displayDoc.requested_review.requested_at 
                      ? new Date(displayDoc.requested_review.requested_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          timeZone: 'UTC'
                        })
                      : 'Unknown date'
                    }
                  </span>
                </div>
                {displayDoc.isOverdue && (
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600 font-medium">
                      Overdue ({displayDoc.daysSinceRequest} days)
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={displayDoc.requested_review.status} />
              </div>
            </div>
          </SheetHeader>

          {/* Main Content */}
          <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden overflow-y-auto">
            {/* Document Section - Top on mobile, Left on desktop */}
            <div className="flex-1 p-2 sm:p-4 relative order-1 lg:order-1">
              {/* Application Details Accordion */}
              {displayDoc?.record_id && (
                <ApplicationDetailsAccordion
                  application={application}
                  isLoading={isApplicationLoading}
                  isOpen={isAccordionOpen}
                  onToggle={() => setIsAccordionOpen(!isAccordionOpen)}
                />
              )}

              <DocumentPreview document={documentForPreview} />

              {/* Action Buttons */}
              <div className="mt-4 space-y-2">
                {/* Top row buttons */}
                <div className="flex flex-row gap-2">
                  {/* View Application Button - Always visible */}
                  <Button
                    onClick={handleViewApplication}
                    variant="outline"
                    className="flex-1 cursor-pointer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Application
                  </Button>

                  {canReview && (
                    <Button
                      onClick={() => {
                        setIsReviewing(!isReviewing);
                        if (!isReviewing) {
                          setIsAccordionOpen(false); 
                        }
                      }}
                      variant={isReviewing ? "outline" : "default"}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isReviewing ? 'Cancel Review' : 'Mark as Reviewed'}
                    </Button>
                  )}

                  {canDelete && (
                    <Button
                      variant="destructive"
                      onClick={handleDeleteRequest}
                      disabled={deleteDocumentMutation.isPending}
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleteDocumentMutation.isPending ? 'Deleting...' : 'Delete Request'}
                    </Button>
                  )}
                </div>

                {/* Review comment section */}
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
            </div>

            {/* Messages Section - Bottom on mobile, Right on desktop */}
            <div className="w-full lg:flex-shrink-0 lg:w-80 xl:w-96 order-2 lg:order-2 border-t lg:border-t-0 lg:border-l">
              <RequestedDocumentMessages
                documentId={displayDoc._id}
                reviewId={displayDoc.requested_review._id}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}