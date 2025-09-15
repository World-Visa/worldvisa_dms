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
import { useReuploadDocument } from '@/hooks/useReuploadDocument';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Upload, X, AlertCircle } from 'lucide-react';
import { Document } from '@/types/applications';

interface ReuploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  document: Document | null;
  documentType: string;
  category: string;
}

interface UploadedFile {
  file: File;
  progress: number;
  id: string;
}

export function ReuploadDocumentModal({ 
  isOpen, 
  onClose, 
  applicationId,
  document,
  documentType,
  category
}: ReuploadDocumentModalProps) {
  const finalDocumentType = documentType || document?.document_type || 'Document';
  const finalCategory = category || document?.document_category || 'Other Documents';
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reuploadMutation = useReuploadDocument();
  const { user } = useAuth();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setUploadedFile(null);
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error(`${file.name} is not a PDF file. Only PDF files are allowed.`);
      return;
    }

    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error(`${file.name} does not have a PDF extension. Only PDF files are allowed.`);
      return;
    }

    // Check file size
    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error(`${file.name} is too large. Maximum file size is 5MB.`);
      return;
    }
    
    // Check if file is empty
    if (file.size === 0) {
      toast.error(`${file.name} is empty. Please select a valid file.`);
      return;
    }

    // Add file to uploaded files list
    const newFile: UploadedFile = {
      file,
      progress: 0,
      id: Math.random().toString(36).substr(2, 9),
    };

    setUploadedFile(newFile);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = Array.from(event.dataTransfer.files);
    
    if (files.length > 1) {
      toast.error('Please select only one file for reupload.');
      return;
    }
    
    // Create a fake event object to reuse the existing validation logic
    const fakeEvent = {
      target: { files }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    handleFileSelect(fakeEvent);
  };

  const handleReupload = async () => {
    if (!uploadedFile || !document || !user?.username) {
      toast.error('Please select a file and ensure user information is available.');
      return;
    }

    setIsUploading(true);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadedFile(prev => 
          prev ? { ...prev, progress: Math.min(prev.progress + 5, 90) } : null
        );
      }, 200);

      try {
        // Use the reupload API
        await reuploadMutation.mutateAsync({
          applicationId,
          documentId: document._id,
          file: uploadedFile.file,
          document_name: finalDocumentType,
          document_category: finalCategory,
          uploaded_by: user.username,
        });

        // Complete progress
        setUploadedFile(prev => 
          prev ? { ...prev, progress: 100 } : null
        );

        clearInterval(progressInterval);

        toast.success('Document reuploaded successfully!');
        onClose();
        
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }

    } catch {
      toast.error('Failed to reupload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Reupload Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Document Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <strong>Replacing:</strong> {document.file_name}
            </div>
            <div className="text-sm text-gray-600">
              <strong>Document Type:</strong> {finalDocumentType}
            </div>
            <div className="text-sm text-gray-600">
              <strong>Category:</strong> {finalCategory}
            </div>
            {document.reject_message && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                <strong>Rejection Reason:</strong> {document.reject_message}
              </div>
            )}
          </div>

          {/* File Upload Area */}
          <div className="space-y-4">
            <div className="text-sm font-medium">Select new file to replace the rejected document:</div>
            
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop a PDF file here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-500 underline"
                  disabled={isUploading}
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-gray-500">
                Maximum file size: 5MB
              </p>
            </div>

            {/* Uploaded File Display */}
            {uploadedFile && (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                      <span className="text-xs text-red-600 font-medium">PDF</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    disabled={isUploading}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Progress Bar */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadedFile.progress}%</span>
                    </div>
                    <Progress value={uploadedFile.progress} className="w-full" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReupload}
            disabled={!uploadedFile || isUploading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isUploading ? 'Reuploading...' : 'Reupload Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
