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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { DatePicker } from '@/components/ui/date-picker';
import { Upload, X, FileText, File } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useUploadStage2Document, useUpdateStage2Document } from '@/hooks/useStage2Documents';
import { Combobox } from '@/components/ui/combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AUSTRALIAN_VISA_SUBCLASSES,
  AUSTRALIAN_STATES,
} from '@/lib/constants/australianData';
import type { EOIModalProps } from '@/types/stage2Documents';

interface UploadedFile {
  file: File;
  progress: number;
  id: string;
}

export function EOIModal({
  isOpen,
  onClose,
  applicationId,
  document,
  mode = 'create',
}: EOIModalProps) {
  const { user } = useAuth();
  const [documentName, setDocumentName] = useState('');
  const [subclass, setSubclass] = useState('');
  const [state, setState] = useState('');
  const [point, setPoint] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadStage2Document();
  const updateMutation = useUpdateStage2Document();

  // Prepare combobox options
  const subclassOptions = AUSTRALIAN_VISA_SUBCLASSES.filter((s) =>
    ['189', '190', '491'].includes(s.code)
  ).map((s) => ({
    value: s.code,
    label: s.label,
  }));

  const stateOptions = AUSTRALIAN_STATES.map((s) => ({
    value: s.code,
    label: `${s.code} - ${s.name}`,
  }));

  const pointOptions = Array.from({ length: Math.floor((110 - 65) / 5) + 1 }, (_, index) =>
    (65 + index * 5).toString()
  );

  // Pre-fill form in edit mode
  useEffect(() => {
    if (mode === 'edit' && document) {
      setDocumentName(document.document_name || '');
      setSubclass(document.subclass || '');
      setState(document.state || '');
      setPoint(document.point?.toString() || '');
      setDate(document.date ? new Date(document.date) : undefined);
    } else {
      setDocumentName('');
      setSubclass('');
      setState('');
      setPoint('');
      setDate(undefined);
      setUploadedFiles([]);
    }
  }, [mode, document, isOpen]);

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
      toast.error(
        `${file.name} has an unsupported MIME type. Only PDF, Word, and image files are allowed.`
      );
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(validateFile);

    const newFiles: UploadedFile[] = validFiles.map((file) => ({
      file,
      progress: 0,
      id: Math.random().toString(36).substr(2, 9),
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer.files);
    const validFiles = files.filter(validateFile);

    const newFiles: UploadedFile[] = validFiles.map((file) => ({
      file,
      progress: 0,
      id: Math.random().toString(36).substr(2, 9),
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleSubmit = async () => {
    if (!documentName.trim()) {
      toast.error('Please enter a document name.');
      return;
    }

    if (!subclass) {
      toast.error('Please select a subclass.');
      return;
    }

    if (!point) {
      toast.error('Please select points.');
      return;
    }

    if (!date) {
      toast.error('Please select a date.');
      return;
    }

    const formattedDate = format(date, 'yyyy-MM-dd');

    if (mode === 'create' && uploadedFiles.length === 0) {
      toast.error('Please upload at least one file.');
      return;
    }

    if (!user?.username) {
      toast.error('User information not available. Please login again.');
      return;
    }

    setIsUploading(true);

    try {
      if (mode === 'edit' && document) {
        // Update existing document metadata
        await updateMutation.mutateAsync({
          applicationId,
          documentId: document._id,
          metadata: {
            document_name: documentName,
            subclass,
            state,
            point: Number(point),
            date: formattedDate,
          },
        });
      } else {
        // Create new document
        const progressInterval = setInterval(() => {
          setUploadedFiles((prev) =>
            prev.map((file) => ({ ...file, progress: Math.min(file.progress + 5, 90) }))
          );
        }, 200);

        try {
          await uploadMutation.mutateAsync({
            applicationId,
            files: uploadedFiles.map((uf) => uf.file),
            file_name: uploadedFiles[0].file.name,
            document_name: documentName,
            document_type: uploadedFiles[0].file.type,
            uploaded_by: user.username,
            type: 'eoi',
            subclass,
            state,
            point: Number(point),
            date: formattedDate,
          });

          setUploadedFiles((prev) => prev.map((file) => ({ ...file, progress: 100 })));
          clearInterval(progressInterval);
        } catch (error) {
          clearInterval(progressInterval);
          throw error;
        }
      }

      handleClose();
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setDocumentName('');
      setSubclass('');
      setState('');
      setPoint('');
      setDate(undefined);
      setUploadedFiles([]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit EOI Document' : 'Create EOI Document'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Name */}
          <div className="space-y-2">
            <Label htmlFor="document-name">Document Name *</Label>
            <Input
              id="document-name"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Enter document name"
              disabled={isUploading}
            />
          </div>

          {/* Subclass */}
          <div className="space-y-2">
            <Label>Subclass *</Label>
            <Combobox
              options={subclassOptions}
              value={subclass}
              onValueChange={setSubclass}
              placeholder="Select a subclass..."
              searchPlaceholder="Search subclass..."
              emptyMessage="No subclass found."
              disabled={isUploading}
            />
          </div>

          {/* State */}
          <div className="space-y-2">
            <Label>State</Label>
            <Combobox
              options={stateOptions}
              value={state}
              onValueChange={setState}
              placeholder="Select a state..."
              searchPlaceholder="Search state..."
              emptyMessage="No state found."
              disabled={isUploading}
            />
          </div>

          {/* Points */}
          <div className="space-y-2">
            <Label htmlFor="point">Points *</Label>
            <Select
              value={point}
              onValueChange={setPoint}
              disabled={isUploading}
            >
              <SelectTrigger id="point">
                <SelectValue placeholder="Select points" />
              </SelectTrigger>
              <SelectContent>
                {pointOptions.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <DatePicker
              value={date}
              onChange={setDate}
              placeholder="Select date"
              disabled={isUploading}
            />
          </div>

          {/* File Upload - Only in create mode */}
          {mode === 'create' && (
            <div className="space-y-3">
              <Label>Upload Files *</Label>
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
                <p className="text-sm text-muted-foreground mb-2">
                  Drop your files here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>PDF, Word (.doc, .docx), and image files (.jpg, .jpeg, .png)</strong> •
                  Max file size 5MB per file
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/jpg,image/png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Show existing file name in edit mode */}
          {mode === 'edit' && document && (
            <div className="space-y-2">
              <Label>Current File</Label>
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted">
                <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                <span className="text-sm font-medium">{document.file_name}</span>
              </div>
            </div>
          )}

          {/* Uploaded Files List - Only in create mode */}
          {mode === 'create' && uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <Label>Files to Upload</Label>
              <div className="space-y-2">
                {uploadedFiles.map((uploadedFile) => (
                  <div key={uploadedFile.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    {(() => {
                      const fileName = uploadedFile.file.name.toLowerCase();
                      if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')) {
                        return <File className="h-5 w-5 text-green-600 shrink-0" />;
                      } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
                        return <FileText className="h-5 w-5 text-blue-600 shrink-0" />;
                      } else {
                        return (
                          <Image
                            src="/icons/pdf_small.svg"
                            alt="PDF Icon"
                            width={20}
                            height={20}
                            className="shrink-0"
                          />
                        );
                      }
                    })()}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
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
                      <Button variant="ghost" size="sm" onClick={() => removeFile(uploadedFile.id)}>
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
          <Button onClick={handleSubmit} disabled={isUploading} className="flex items-center gap-2">
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {mode === 'edit' ? 'Updating...' : 'Uploading...'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {mode === 'edit' ? 'Update Document' : 'Upload Document'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

