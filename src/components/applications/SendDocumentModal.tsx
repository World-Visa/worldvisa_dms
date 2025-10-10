'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, FileText, Users, AlertCircle } from 'lucide-react';
import { Document } from '@/types/applications';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useReviewRequest } from '@/hooks/useReviewRequest';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SendDocumentModalProps {
  documents: Document[];
  selectedDocument: Document;
  onSend?: (documentIds: string[], notes: string, sendToUsers: string[]) => void;
  applicationId?: string; // Add applicationId for review requests
}

export function SendDocumentModal({
  documents,
  selectedDocument,
  onSend,
}: SendDocumentModalProps) {
  const { user } = useAuth();
  const { data: adminUsers, isLoading: isLoadingAdmins, error: adminError } = useAdminUsers();
  
  // Review request mutation
  const reviewRequestMutation = useReviewRequest({
    onSuccess: (documentIds, requestedTo) => {
      // Call the original onSend callback if provided
      onSend?.(documentIds, notes, requestedTo);
    },
    onError: (error) => {
      console.error('Review request failed:', error);
    }
  });
  
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([selectedDocument._id]);
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);

  // Memoize admin options for performance - role-based filtering
  const adminOptions: MultiSelectOption[] = useMemo(() => {
    if (!adminUsers || !user?.role) return [];
    
    // Define role-based permissions
    const getRolePermissions = (userRole: string) => {
      switch (userRole) {
        case 'admin':
          return ['team_leader'];
        case 'team_leader':
          return ['master_admin', 'supervisor', 'admin'];
        case 'master_admin':
          return ['team_leader', 'supervisor', 'admin', 'master_admin'];
        case 'supervisor':
          return ['team_leader', 'master_admin', 'admin', 'supervisor'];
        default:
          return [];
      }
    };
    
    const allowedRoles = getRolePermissions(user.role);
    
    return adminUsers
      .filter(admin => 
        allowedRoles.includes(admin.role) && 
        admin.username !== user.username // Exclude current user
      )
      .map(admin => ({
        value: admin.username,
        label: admin.username,
        role: admin.role
      }));
  }, [adminUsers, user?.role, user?.username]);

  const handleDocumentToggle = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSend = async () => {
    // Comprehensive input validation
    if (!user?.username) {
      toast.error('You must be logged in to send review requests.');
      return;
    }

    if (selectedDocuments.length === 0) {
      toast.error('Please select at least one document to send for review.');
      return;
    }

    if (selectedAdmins.length === 0) {
      toast.error('Please select at least one admin to send the documents to.');
      return;
    }

    // Validate document IDs
    const invalidDocuments = selectedDocuments.filter(id => !id || typeof id !== 'string');
    if (invalidDocuments.length > 0) {
      toast.error('Some selected documents have invalid IDs. Please refresh and try again.');
      return;
    }

    // Validate admin usernames
    const invalidAdmins = selectedAdmins.filter(admin => !admin || typeof admin !== 'string');
    if (invalidAdmins.length > 0) {
      toast.error('Some selected admins have invalid usernames. Please refresh and try again.');
      return;
    }

    // Check for duplicate selections
    const uniqueDocuments = [...new Set(selectedDocuments)];
    const uniqueAdmins = [...new Set(selectedAdmins)];
    
    if (uniqueDocuments.length !== selectedDocuments.length) {
      toast.error('Duplicate documents detected. Please refresh and try again.');
      return;
    }

    if (uniqueAdmins.length !== selectedAdmins.length) {
      toast.error('Duplicate admins detected. Please refresh and try again.');
      return;
    }

    // Validate message length
    const message = notes.trim() || 'Please review these documents for verification.';
    if (message.length > 500) {
      toast.error('Message is too long. Please keep it under 500 characters.');
      return;
    }
    
    try {
      // Use the review request mutation
      await reviewRequestMutation.mutateAsync({
        documentIds: uniqueDocuments,
        requestedTo: uniqueAdmins,
        message,
        requestedBy: user.username
      });
      
      // Reset form state
      setIsOpen(false);
      setNotes('');
      setSelectedDocuments([selectedDocument._id]);
      setSelectedAdmins([]);
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Failed to send review requests:', error);
    }
  };

  const selectedCount = selectedDocuments.length;
  const isSubmitting = reviewRequestMutation.isPending;
  
  // Enhanced validation states
  const hasValidSelection = selectedCount > 0 && selectedAdmins.length > 0;
  const isFormValid = hasValidSelection && !!user?.username && !isSubmitting;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 cursor-pointer hover:bg-blue-700 w-full sm:w-auto">
          <Send className="h-4 w-4 mr-2" />
          Send for verification
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] mx-4 flex flex-col">
        <DialogHeader className="pb-4 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">Send Documents for Verification</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-y-auto pr-2">
          {/* Document Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">
              Select Documents ({selectedCount} selected)
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2 sm:p-3">
              {documents.map((document) => (
                <div
                  key={document._id}
                  className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedDocuments.includes(document._id)
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => !isSubmitting && handleDocumentToggle(document._id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedDocuments.includes(document._id)}
                    onChange={() => handleDocumentToggle(document._id)}
                    disabled={isSubmitting}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0 disabled:opacity-50"
                  />
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                      {document.file_name?.slice(0, 15)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      Uploaded by {document.uploaded_by} • {new Date(document.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  {document._id === selectedDocument._id && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0">
                      Current
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Send To Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              <h3 className="text-sm font-medium text-gray-900">
                Send to Admins *
              </h3>
            </div>
            
            {!user?.username ? (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  You must be logged in to send review requests.
                </div>
              </div>
            ) : adminError ? (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  Failed to load admin users. Please refresh and try again.
                </div>
              </div>
            ) : adminOptions.length === 0 && !isLoadingAdmins ? (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                <div className="text-sm text-yellow-700">
                  No admin users available. Please contact support.
                </div>
              </div>
            ) : (
              <MultiSelect
                options={adminOptions}
                value={selectedAdmins}
                onChange={setSelectedAdmins}
                placeholder="Select admins to send documents to..."
                loading={isLoadingAdmins}
                disabled={isLoadingAdmins || isSubmitting}
                maxSelections={10}
                className="w-full"
              />
            )}
            
            {selectedAdmins.length > 0 && (
              <div className="text-xs text-gray-500">
                {selectedAdmins.length} admin{selectedAdmins.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="space-y-4">
            <label htmlFor="notes" className="text-sm font-medium text-gray-900">
              Notes (Optional)
            </label>
            <Textarea
              id="notes"
              placeholder="Add any notes or instructions for verification..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              className="mt-1 min-h-[80px] sm:min-h-[100px] border border-gray-300 resize-none text-sm disabled:opacity-50"
              maxLength={500}
            />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <span className="text-xs text-gray-500">
                {notes.length}/500 characters
              </span>
              <div className="flex flex-col sm:flex-row gap-2 text-xs text-gray-500">
                <span>
                  {selectedCount} document{selectedCount !== 1 ? 's' : ''} selected
                </span>
                <span>
                  {selectedAdmins.length} admin{selectedAdmins.length !== 1 ? 's' : ''} selected
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t bg-white flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!isFormValid}
            className="cursor-pointer bg-blue-600 hover:bg-blue-700 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending Review Requests...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send {selectedCount} Document{selectedCount !== 1 ? 's' : ''} to {selectedAdmins.length} Admin{selectedAdmins.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
