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
import { useClientReuploadDocument } from '@/hooks/useClientDocumentMutations';
import { useDocumentData } from '@/hooks/useDocumentData';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Upload, X, AlertCircle, FileText, File } from 'lucide-react';
import { Document } from '@/types/applications';

interface ReuploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  document: Document | null;
  documentType: string;
  category: string;
  isClientView?: boolean;
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
  category,
  isClientView = false
}: ReuploadDocumentModalProps) {
  const finalDocumentType = documentType || document?.document_type || 'Document';
  const finalCategory = category || document?.document_category || 'Other Documents';
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reuploadMutation = useReuploadDocument();
  const clientReuploadMutation = useClientReuploadDocument();
  const { user } = useAuth();

  // Get real-time document data from cache
  const { document: currentDocument } = useDocumentData(document?._id || '');
  
  // Use the current document from cache, fallback to prop
  const displayDocument = currentDocument || document;

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

    // Validate file type and extension
    const fileName = file.name.toLowerCase();
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    const hasValidMimeType = allowedMimeTypes.includes(file.type);
    
    if (!hasValidExtension || !hasValidMimeType) {
      toast.error(`${file.name} is not a supported file type. Only PDF, Word (.doc, .docx), and text (.txt) files are allowed.`);
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
    if (!uploadedFile || !displayDocument || !user?.username) {
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
        // Use the appropriate reupload API
        if (isClientView) {
          await clientReuploadMutation.mutateAsync({
            clientId: applicationId, // Use applicationId as clientId for client uploads
            documentId: displayDocument._id,
            file: uploadedFile.file,
            document_name: finalDocumentType,
            document_category: finalCategory,
            uploaded_by: user.username,
          });
        } else {
          await reuploadMutation.mutateAsync({
            applicationId,
            documentId: displayDocument._id,
            file: uploadedFile.file,
            document_name: finalDocumentType,
            document_category: finalCategory,
            uploaded_by: user.username,
          });
        }

        // Complete progress
        setUploadedFile(prev => 
          prev ? { ...prev, progress: 100 } : null
        );

        clearInterval(progressInterval);

        toast.success('Document reuploaded successfully!');
        
        setTimeout(() => {
          onClose();
        }, 500);
        
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

  if (!displayDocument) return null;

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
              <strong>Replacing:</strong> {displayDocument.file_name}
            </div>
            <div className="text-sm text-gray-600">
              <strong>Document Type:</strong> {finalDocumentType}
            </div>
            <div className="text-sm text-gray-600">
              <strong>Category:</strong> {finalCategory}
            </div>
            {displayDocument.reject_message && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                <strong>Rejection Reason:</strong> {displayDocument.reject_message}
              </div>
            )}
          </div>

          {/* File Upload Area */}
          <div className="space-y-4">
            <div className="text-sm font-medium">Select new file to replace the rejected document:</div>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isUploading
                  ? 'border-muted-foreground/25 bg-muted/25 cursor-not-allowed'
                  : 'border-primary bg-primary/5 hover:bg-primary/10 cursor-pointer'
              }`}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                {isUploading
                  ? 'Uploading file...'
                  : 'Drop your file here, or click to browse'}
              </p>
              <p className="text-xs text-gray-500">
                <strong>PDF, Word (.doc, .docx), and text (.txt) files</strong> • Max file size 5MB
              </p>
            </div>

            {/* Uploaded File Display */}
            {uploadedFile && (
              <div className="space-y-3">
                <label className="text-sm font-medium">File to Upload</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    {(() => {
                      const fileName = uploadedFile.file.name.toLowerCase();
                      
                      if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
                        return <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />;
                      } else if (fileName.endsWith('.txt')) {
                        return <File className="h-5 w-5 text-gray-600 flex-shrink-0" />;
                      } else {
                        return (
                          <div className="w-5 h-5 bg-red-100 rounded flex items-center justify-center">
                            <span className="text-xs text-red-600 font-medium">PDF</span>
                          </div>
                        );
                      }
                    })()}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {uploadedFile.file.name.length > 15 
                          ? `${uploadedFile.file.name.substring(0, 15)}...` 
                          : uploadedFile.file.name}
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
                        onClick={removeFile}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
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
