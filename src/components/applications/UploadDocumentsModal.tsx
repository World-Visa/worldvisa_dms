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
import { Upload, X } from 'lucide-react';
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
          console.log('Auto-set description from existing document:', autoDescription);
        }
      }
      
      // Fallback to generating from company data (for first time)
      if (!autoDescription && selectedDocumentCategory.includes('Documents') && 
          !['Identity Documents', 'Education Documents', 'Other Documents'].includes(selectedDocumentCategory) && 
          company) {
        autoDescription = generateCompanyDescription(company.fromDate, company.toDate);
        console.log('Auto-set description from company data (first time):', autoDescription);
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
      if (!fileName.endsWith('.pdf')) {
        toast.error(`${file.name} is not a PDF file. Only PDF files are allowed.`);
        return false;
      }
      
      // Check MIME type
      if (file.type !== 'application/pdf') {
        toast.error(`${file.name} is not a PDF file. Only PDF files are allowed.`);
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

        // Debug logging
        console.log('Upload Debug Info:', {
          selectedDocumentType,
          selectedDocumentCategory,
          company,
          finalCategory,
          finalDescription,
          isCompanyDocument: selectedDocumentCategory.includes('Documents') && !['Identity Documents', 'Education Documents', 'Other Documents'].includes(selectedDocumentCategory)
        });
      
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
          queryClient.setQueryData(['application-documents', applicationId], (oldData: { data?: unknown[] } | undefined) => {
            if (!oldData?.data) return oldData;
            
            // Add the new documents to the existing data
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
              document_category: getDocumentCategory(selectedDocumentType, selectedDocumentCategory),
            }));
            
            return {
              ...oldData,
              data: [...oldData.data, ...newDocuments]
            };
          });
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

  // Helper function to get company description based on company data or existing documents
  const getCompanyDescription = (category: string): string => {
    console.log('getCompanyDescription called with:', { category, company, documents });
    
    // First, try to get description from existing documents for this category
    if (documents && documents.length > 0) {
      const existingDoc = documents.find((doc: ApiDocument) => 
        doc.document_category === category && doc.description
      );
      if (existingDoc && existingDoc.description) {
        console.log('Using description from existing document:', existingDoc.description);
        return existingDoc.description;
      }
    }
    
    // Fallback to generating from company data (for first time)
    if (category.includes('Documents') && !['Identity Documents', 'Education Documents', 'Other Documents'].includes(category) && company) {
      const description = generateCompanyDescription(company.fromDate, company.toDate);
      console.log('Generated company description (first time):', description);
      return description;
    }
    
    console.log('No company description generated');
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
                  ? 'Drop your PDF files here, or click to browse'
                  : 'Please select a document type first'}
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>PDF files only</strong> • Max file size 5MB per file
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,application/pdf"
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
                    <Image
                      src="/icons/pdf_small.svg"
                      alt="PDF Icon"
                      width={20}
                      height={20}
                      className="flex-shrink-0"
                    />
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
