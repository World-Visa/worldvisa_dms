'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, FileText, File as FileIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useUploadSampleDocument } from '@/hooks/useSampleDocuments';

interface SampleDocumentsUploadModalProps {
  applicationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SampleDocumentsUploadModal({ applicationId, isOpen, onClose }: SampleDocumentsUploadModalProps) {
  const [documentName, setDocumentName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileProgress, setFileProgress] = useState<Record<string, number>>({});

  const uploadMutation = useUploadSampleDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setDocumentName('');
      setFiles([]);
      setFileProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  const validateFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    const hasValidExtension = allowedExtensions.some((ext) => fileName.endsWith(ext));
    if (!hasValidExtension) {
      toast.error(
        `${file.name} is not a supported file type. Only PDF, Word (.doc, .docx), and image files (.jpg, .jpeg, .png) are allowed.`
      );
      return false;
    }

    if (!allowedMimeTypes.includes(file.type)) {
      toast.error(`${file.name} has an unsupported MIME type. Only PDF, Word, and image files are allowed.`);
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${file.name} is too large. Maximum file size is 5MB.`);
      return false;
    }

    if (file.size === 0) {
      toast.error(`${file.name} is empty. Please select a valid file.`);
      return false;
    }

    return true;
  };

  const addFiles = (incomingFiles: File[]) => {
    const validFiles = incomingFiles.filter(validateFile);
    if (validFiles.length === 0) {
      return;
    }

    setFiles((prev) => [...prev, ...validFiles]);

    const progressUpdates: Record<string, number> = {};
    validFiles.forEach((file) => {
      progressUpdates[file.name] = 0;
    });
    setFileProgress((prev) => ({ ...prev, ...progressUpdates }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    addFiles(selectedFiles);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const droppedFiles = Array.from(event.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((file) => file.name !== fileName));
    setFileProgress((prev) => {
      const { [fileName]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const getFileIcon = (fileName: string) => {
    const lowerName = fileName.toLowerCase();
    if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png')) {
      return <FileIcon className="h-5 w-5 text-green-600 shrink-0" />;
    }

    if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) {
      return <FileText className="h-5 w-5 text-blue-600 shrink-0" />;
    }

    return (
      <Image
        src="/icons/pdf_small.svg"
        alt="PDF Icon"
        width={20}
        height={20}
        className="shrink-0"
      />
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!documentName.trim()) {
      toast.error('Please provide a document name.');
      return;
    }

    if (files.length === 0) {
      toast.error('Please select at least one file to upload.');
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        applicationId,
        document_name: documentName.trim(),
        files,
      });
      onClose();
    } catch (error) {
      console.error('Upload sample document error:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Sample Documents</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sample-document-name">Document name</Label>
            <Input
              id="sample-document-name"
              placeholder="Enter document name"
              value={documentName}
              onChange={(event) => setDocumentName(event.target.value)}
              disabled={uploadMutation.isPending}
            />
          </div>

          <div className="space-y-3">
            <Label>Upload files *</Label>
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center transition-colors border-primary bg-primary/5 hover:bg-primary/10 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Image
                src="/icons/pdf_icon_modal.svg"
                alt="Upload Icon"
                width={78}
                height={96}
                className="mx-auto mb-4"
              />
              <p className="text-sm text-muted-foreground mb-2">Drop your files here, or click to browse</p>
              <p className="text-xs text-muted-foreground">
                <strong>PDF, Word (.doc, .docx), and image files (.jpg, .jpeg, .png)</strong> • Max file size 5MB per file
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/jpg,image/png"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploadMutation.isPending}
              />
            </div>
            <p className="text-xs text-muted-foreground text-left">You can upload multiple files for the same sample document.</p>
          </div>

          {files.length > 0 && (
            <div className="space-y-3">
              <Label>Files to upload</Label>
              <div className="space-y-2">
                {files.map((file) => (
                  <div key={file.name} className="flex items-center gap-3 p-3 border rounded-lg">
                    {getFileIcon(file.name)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      {uploadMutation.isPending && (
                        <div className="mt-2">
                          <Progress value={fileProgress[file.name] ?? 0} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">{fileProgress[file.name] ?? 0}%</p>
                        </div>
                      )}
                    </div>
                    {!uploadMutation.isPending && (
                      <Button variant="ghost" size="sm" onClick={() => removeFile(file.name)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={uploadMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploadMutation.isPending} className="flex items-center gap-2">
              {uploadMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


