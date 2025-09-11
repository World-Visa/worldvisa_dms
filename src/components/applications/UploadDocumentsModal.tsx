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
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';
import { DocumentTypeSelector } from './DocumentTypeSelector';

interface UploadDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
}

interface UploadedFile {
  file: File;
  progress: number;
  id: string;
}


export function UploadDocumentsModal({ isOpen, onClose, applicationId }: UploadDocumentsModalProps) {
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addDocumentMutation = useAddDocument();

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
      toast.error('Please select a document type and upload at least one file.');
      return;
    }

    setIsUploading(true);

    try {
      // Upload files one by one
      for (const uploadedFile of uploadedFiles) {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadedFiles(prev => 
            prev.map(file => 
              file.id === uploadedFile.id 
                ? { ...file, progress: Math.min(file.progress + 10, 90) }
                : file
            )
          );
        }, 200);

        try {
          await addDocumentMutation.mutateAsync({
            applicationId,
            file: uploadedFile.file,
            token: undefined,
          });

          // Complete progress
          setUploadedFiles(prev => 
            prev.map(file => 
              file.id === uploadedFile.id 
                ? { ...file, progress: 100 }
                : file
            )
          );

          clearInterval(progressInterval);
        } catch (error) {
          clearInterval(progressInterval);
          throw error;
        }
      }

      toast.success('All documents uploaded successfully!');
      onClose();
      
      // Reset state
      setSelectedDocumentType('');
      setUploadedFiles([]);
    } catch {
      toast.error('Failed to upload documents. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedDocumentType('');
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
          {/* Step 1: Document Type Selection */}
          <DocumentTypeSelector
            selectedDocumentType={selectedDocumentType}
            onDocumentTypeChange={setSelectedDocumentType}
          />

          {/* Step 2: File Upload */}
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
                  : 'Select a document type first'}
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
