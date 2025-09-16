'use client';

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Eye, 
  MessageSquare, 
  User, 
  Calendar,
  CheckCircle,
  X,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { RequestedDocument } from '@/lib/api/requestedDocuments';
import { StatusBadge } from './StatusBadge';
import { useUpdateDocumentStatus, useDeleteRequestedDocument } from '@/hooks/useRequestedDocumentActions';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
  const [reviewComment, setReviewComment] = useState('');
  const { user } = useAuth();
  const updateStatusMutation = useUpdateDocumentStatus();
  const deleteDocumentMutation = useDeleteRequestedDocument();

  if (!document) return null;

  const isRequestedToMe = type === 'requested-to-me';
  const canReview = isRequestedToMe && document.requested_review.status === 'pending';
  const canDelete = !isRequestedToMe; // Can only delete documents I requested

  const handleMarkAsReviewed = async () => {
    if (!user?.username || !reviewComment.trim()) {
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
  };

  const handleDeleteRequest = async () => {
    if (!document.requested_review._id) {
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
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Review
          </SheetTitle>
          <SheetDescription>
            Review and manage document request details
          </SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Left Side - Document Preview */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Document Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-8 w-8 text-blue-600 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {document.document_name || document.file_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {document.document_category || 'Document'}
                    </p>
                    {document.isOverdue && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-red-600 font-medium">
                          Overdue ({document.daysSinceRequest} days)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Requested By</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">
                        {document.requested_review.requested_by}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <StatusBadge status={document.requested_review.status} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Requested Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {document.formattedRequestDate || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Uploaded By</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {document.uploaded_by}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document Preview */}
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-2">Document Preview</p>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-2">
                      {document.file_name}
                    </p>
                    {document.document_link && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(document.document_link, '_blank')}
                        className="mt-2"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Document
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Comments and Actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Review Comments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing Comments */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {document.comments && document.comments.length > 0 ? (
                    document.comments.map((comment, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">{comment.added_by || 'Unknown'}</span>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.added_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.comment}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No comments yet</p>
                    </div>
                  )}
                </div>

                {/* Add Comment Section */}
                {canReview && (
                  <div className="pt-4 border-t">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Add Review Comment
                    </label>
                    <Textarea
                      placeholder="Add your review comment..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {canReview && (
                <Button
                  onClick={handleMarkAsReviewed}
                  disabled={updateStatusMutation.isPending || !reviewComment.trim()}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {updateStatusMutation.isPending ? 'Marking...' : 'Mark as Reviewed'}
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

              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>

            {/* Status History */}
            {document.history && document.history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {document.history.map((entry, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                        <StatusBadge status={entry.status === 'reviewed' ? 'approved' : entry.status as 'pending' | 'approved' | 'rejected'} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{entry.changed_by}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(entry.changed_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
