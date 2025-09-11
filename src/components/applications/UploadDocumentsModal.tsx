'use client';

import React, { useState, useRef } from 'react';
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
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';
import { UploadDocumentsModalProps, UploadedFile } from '@/types/documents';


export function UploadDocumentsModal({ isOpen, onClose, applicationId, selectedDocumentType: propSelectedDocumentType, selectedDocumentCategory: propSelectedDocumentCategory }: UploadDocumentsModalProps) {
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>(propSelectedDocumentType || '');
  const [selectedDocumentCategory, setSelectedDocumentCategory] = useState<string>(propSelectedDocumentCategory || '');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addDocumentMutation = useAddDocument();
  const { user } = useAuth();

  // Update selectedDocumentType and category when props change
  React.useEffect(() => {
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
      if (file.type !== 'application/pdf') {
        toast.error(`${file.name} is not a PDF file. Only PDF files are allowed.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error(`${file.name} is too large. Maximum file size is 5MB.`);
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

  const handleUpload = async () => {
    if (!selectedDocumentType || uploadedFiles.length === 0) {
      toast.error('Please upload at least one file.');
      return;
    }

    if (!user?.username) {
      toast.error('User information not available. Please login again.');
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
        // Upload all files at once with the new API
        await addDocumentMutation.mutateAsync({
          applicationId,
          files: uploadedFiles.map(uf => uf.file),
          document_name: selectedDocumentType,
          document_category: getDocumentCategory(selectedDocumentType, selectedDocumentCategory),
          uploaded_by: user.username,
        });

        // Complete progress for all files
        setUploadedFiles(prev => 
          prev.map(file => ({ ...file, progress: 100 }))
        );

        clearInterval(progressInterval);
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
      // Extract company name from category (e.g., "WorldVisa Documents" -> "WorldVisa(company1)")
      const companyName = category.replace(' Documents', '');
      return `${companyName}(company1)`;
    }
    
    // Map categories to API categories
    const categoryMap: Record<string, string> = {
      'Identity Documents': 'identity',
      'Education Documents': 'education',
      'Other Documents': 'other',
    };

    return categoryMap[category] || 'other';
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedDocumentType('');
      setSelectedDocumentCategory('');
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
                Supports: PDF, Max file size 5MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf"
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
