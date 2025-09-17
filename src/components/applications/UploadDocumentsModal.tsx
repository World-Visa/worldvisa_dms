'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAddDocument } from '@/hooks/useMutationsDocuments';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, X, FileText, File } from 'lucide-react';
import Image from 'next/image';
import { UploadDocumentsModalProps, UploadedFile, ApiDocument } from '@/types/documents';
import { generateCompanyDescription } from '@/utils/dateCalculations';


export function UploadDocumentsModal({ 
  isOpen, 
  onClose, 
  applicationId, 
  selectedDocumentType: propSelectedDocumentType, 
  selectedDocumentCategory: propSelectedDocumentCategory, 
  company,
  documents,
}: UploadDocumentsModalProps) {
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>(propSelectedDocumentType || '');
  const [selectedDocumentCategory, setSelectedDocumentCategory] = useState<string>(propSelectedDocumentCategory || '');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [description, setDescription] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addDocumentMutation = useAddDocument();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Auto-set description when modal opens or category changes
  useEffect(() => {
    if (isOpen && selectedDocumentCategory) {
      // First, try to get description from existing documents for this category
      let autoDescription = '';
      
      if (documents && documents.length > 0) {
        const existingDoc = documents.find((doc: ApiDocument) => 
          doc.document_category === selectedDocumentCategory && doc.description
        );
        if (existingDoc && existingDoc.description) {
          autoDescription = existingDoc.description;
        }
      }
      
      // Fallback to generating from company data (for first time)
      if (!autoDescription && selectedDocumentCategory.includes('Documents') && 
          !['Identity Documents', 'Education Documents', 'Other Documents'].includes(selectedDocumentCategory) && 
          company) {
        autoDescription = generateCompanyDescription(company.fromDate, company.toDate);
      }
      
      if (autoDescription) {
        setDescription(autoDescription);
      }
    }
  }, [isOpen, selectedDocumentCategory, company, documents]);

  // Update selectedDocumentType and category when props change
  useEffect(() => {
    if (propSelectedDocumentType) {
      setSelectedDocumentType(propSelectedDocumentType);
    }
    if (propSelectedDocumentCategory) {
      setSelectedDocumentCategory(propSelectedDocumentCategory);
    }
  }, [propSelectedDocumentType, propSelectedDocumentCategory]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate files
    const validFiles = files.filter(file => {
      // Check file extension
      const fileName = file.name.toLowerCase();
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
      const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
      
      if (!hasValidExtension) {
        toast.error(`${file.name} is not a supported file type. Only PDF, Word (.doc, .docx), and text (.txt) files are allowed.`);
        return false;
      }
      
      // Check MIME type
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (!allowedMimeTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported file type. Only PDF, Word (.doc, .docx), and text (.txt) files are allowed.`);
        return false;
      }
      
      // Check file size
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error(`${file.name} is too large. Maximum file size is 5MB.`);
        return false;
      }
      
      // Check if file is empty
      if (file.size === 0) {
        toast.error(`${file.name} is empty. Please select a valid file.`);
        return false;
      }
      
      return true;
    });

    // Add valid files to uploaded files list
    const newFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      progress: 0,
      id: Math.random().toString(36).substr(2, 9),
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!selectedDocumentType) {
      toast.error('Please select a document type first');
      return;
    }
    
    const files = Array.from(event.dataTransfer.files);
    
    // Create a fake event object to reuse the existing validation logic
    const fakeEvent = {
      target: { files }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    handleFileSelect(fakeEvent);
  };

  const handleUpload = async () => {
    if (!selectedDocumentType || uploadedFiles.length === 0) {
      toast.error('Please upload at least one file.');
      return;
    }

    if (!user?.username) {
      toast.error('User information not available. Please login again.');
      return;
    }

    const totalSize = uploadedFiles.reduce((sum, file) => sum + file.file.size, 0);
    const maxTotalSize = 50 * 1024 * 1024; 
    
    if (totalSize > maxTotalSize) {
      toast.error(`Total file size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds the maximum limit of 50MB.`);
      return;
    }

    // Limit number of files
    if (uploadedFiles.length > 10) {
      toast.error('Maximum 10 files can be uploaded at once.');
      return;
    }

    setIsUploading(true);

    try {
      // Simulate progress updates for all files
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev => 
          prev.map(file => 
            ({ ...file, progress: Math.min(file.progress + 5, 90) })
          )
        );
      }, 200);

      try {
        // Get description - use company description for company documents, otherwise use user input
        const finalDescription = getCompanyDescription(selectedDocumentCategory) || description;
        const finalCategory = getDocumentCategory(selectedDocumentType, selectedDocumentCategory);
        

        // Upload all files at once with the new API
        const uploadResult = await addDocumentMutation.mutateAsync({
          applicationId,
          files: uploadedFiles.map(uf => uf.file),
          document_name: selectedDocumentType,
          document_category: finalCategory,
          uploaded_by: user.username,
          description: finalDescription,
          document_type: selectedDocumentType.toLowerCase().replace(/\s+/g, '_'), 
        });

        // Complete progress for all files
        setUploadedFiles(prev => 
          prev.map(file => ({ ...file, progress: 100 }))
        );

        clearInterval(progressInterval);

        // Optimistically update the documents cache to immediately reflect the upload
        if (uploadResult?.data) {
          const apiCategory = getDocumentCategory(selectedDocumentType, selectedDocumentCategory);
          const displayCategory = getDisplayCategory(apiCategory);
          
          const newDocuments = uploadResult.data.map((doc: { id: string; name: string; size: number; type: string; uploaded_at: string }) => ({
            _id: doc.id, // Use _id to match Document interface
            record_id: applicationId,
            workdrive_file_id: doc.id,
            workdrive_parent_id: '',
            file_name: doc.name, // This is the correct property name
            uploaded_by: user.username,
            status: 'pending' as const, // Default status for new uploads
            history: [],
            uploaded_at: doc.uploaded_at,
            comments: [],
            __v: 0,
            // Store document type and category for matching
            document_type: selectedDocumentType.toLowerCase().replace(/\s+/g, '_'),
            document_category: displayCategory, // Use display category for UI matching
            description: finalDescription,
          }));

          // Update application documents cache
          queryClient.setQueryData(['application-documents', applicationId], (oldData: { data?: unknown[] } | undefined) => {
            if (!oldData?.data) return oldData;
            return {
              ...oldData,
              data: [...oldData.data, ...newDocuments]
            };
          });

          // Also update client documents cache for immediate UI reflection
          queryClient.setQueryData(['client-documents'], (oldData: { data?: { documents?: unknown[] } } | undefined) => {
            if (!oldData?.data?.documents) return oldData;
            return {
              ...oldData,
              data: {
                ...oldData.data,
                documents: [...oldData.data.documents, ...newDocuments]
              }
            };
          });

          // Update client-documents-all cache for checklist table
          queryClient.setQueryData(['client-documents-all'], (oldData: { data?: { documents?: unknown[] } } | undefined) => {
            if (!oldData?.data?.documents) return oldData;
            return {
              ...oldData,
              data: {
                ...oldData.data,
                documents: [...oldData.data.documents, ...newDocuments]
              }
            };
          });

          // Force immediate refetch to ensure UI updates
          setTimeout(() => {
            queryClient.invalidateQueries({
              queryKey: ['application-documents', applicationId],
            });
            queryClient.invalidateQueries({
              queryKey: ['application-documents-all', applicationId],
            });
            queryClient.invalidateQueries({
              queryKey: ['client-documents'],
            });
            queryClient.invalidateQueries({
              queryKey: ['client-documents-all'],
            });
          }, 100);
        }
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }

      toast.success('All documents uploaded successfully!');
      onClose();
      
      // Reset state
      setSelectedDocumentType('');
      setSelectedDocumentCategory('');
      setUploadedFiles([]);
    } catch {
      toast.error('Failed to upload documents. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Helper function to determine document category based on document type and category
  const getDocumentCategory = (documentType: string, category: string): string => {
    // Check if it's a company document (contains company name pattern)
    if (category.includes('Documents') && !['Identity Documents', 'Education Documents', 'Other Documents'].includes(category)) {
      return category;
    }
    
    // Map categories to API categories
    const categoryMap: Record<string, string> = {
      'Identity Documents': 'Identity',
      'Education Documents': 'Education', 
      'Other Documents': 'Other',
    };
    
    return categoryMap[category] || 'Other';
  };

  // Helper function to get the display category for UI matching
  const getDisplayCategory = (apiCategory: string): string => {
    const reverseMap: Record<string, string> = {
      'Identity': 'Identity Documents',
      'Education': 'Education Documents',
      'Other': 'Other Documents',
    };
    
    // If it's already a company-specific category, return as-is
    if (apiCategory.includes('Company Documents') && !['Identity Documents', 'Education Documents', 'Other Documents'].includes(apiCategory)) {
      return apiCategory;
    }
    
    return reverseMap[apiCategory] || apiCategory;
  };

  // Helper function to get company description based on company data or existing documents
  const getCompanyDescription = (category: string): string => {
    // First, try to get description from existing documents for this category
    if (documents && documents.length > 0) {
      const existingDoc = documents.find((doc: ApiDocument) => 
        doc.document_category === category && doc.description
      );
      if (existingDoc && existingDoc.description) {
        return existingDoc.description;
      }
    }
    
    // Use company description if available (new format with experience details)
    if (category.includes('Documents') && !['Identity Documents', 'Education Documents', 'Other Documents'].includes(category) && company) {
      if (company.description) {
        return company.description;
      }
      
      // Fallback to generating from company data (for backward compatibility)
      const description = generateCompanyDescription(company.fromDate, company.toDate);
      return description;
    }
    
    return '';
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedDocumentType('');
      setSelectedDocumentCategory('');
      setDescription('');
      setUploadedFiles([]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Type Display (if pre-selected) */}
          {selectedDocumentType && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Document Type</label>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{selectedDocumentType}</p>
              </div>
            </div>
          )}


          {/* File Upload */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Upload Files</label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                selectedDocumentType
                  ? 'border-primary bg-primary/5 hover:bg-primary/10 cursor-pointer'
                  : 'border-muted-foreground/25 bg-muted/25 cursor-not-allowed'
              }`}
              onClick={() => selectedDocumentType && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Image
                src="/icons/pdf_icon_modal.svg"
                alt="PDF Icon"
                width={78}
                height={96}
                className="mx-auto mb-4"
              />
              <p className="text-sm text-muted-foreground mb-2">
                {selectedDocumentType
                  ? 'Drop your files (PDF, Word (.doc, .docx), and text (.txt)) here, or click to browse'
                  : 'Please select a document type first'}
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>PDF, Word (.doc, .docx), and text (.txt) files</strong> • Max file size 5MB per file
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={handleFileSelect}
                className="hidden"
                disabled={!selectedDocumentType}
              />
            </div>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Files to Upload</label>
              <div className="space-y-2">
                {uploadedFiles.map((uploadedFile) => (
                  <div
                    key={uploadedFile.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    {(() => {
                      const fileName = uploadedFile.file.name.toLowerCase();
                      
                      if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
                        return <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />;
                      } else if (fileName.endsWith('.txt')) {
                        return <File className="h-5 w-5 text-gray-600 flex-shrink-0" />;
                      } else {
                        return (
                          <Image
                            src="/icons/pdf_small.svg"
                            alt="PDF Icon"
                            width={20}
                            height={20}
                            className="flex-shrink-0"
                          />
                        );
                      }
                    })()}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {isUploading && (
                        <div className="mt-2">
                          <Progress value={uploadedFile.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {uploadedFile.progress}%
                          </p>
                        </div>
                      )}
                    </div>
                    {!isUploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadedFile.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedDocumentType || uploadedFiles.length === 0 || isUploading}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Documents
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
