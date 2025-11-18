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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, X, FileText, File, Plus } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useUploadStage2Document, useUpdateStage2Document } from '@/hooks/useStage2Documents';
import type { OutcomeModalProps } from '@/types/stage2Documents';
import { Combobox } from '@/components/ui/combobox';
import { ANZSCO_CODES, getAnzscoCodeByCode } from '@/lib/constants/australianData';

interface UploadedFile {
  file: File;
  progress: number;
  id: string;
}

export function OutcomeModal({
  isOpen,
  onClose,
  applicationId,
  document,
  mode = 'create',
}: OutcomeModalProps) {
  const { user } = useAuth();
  const [documentName, setDocumentName] = useState('');
  const [outcomeDate, setOutcomeDate] = useState<Date | undefined>(undefined);
  const [outcome, setOutcome] = useState('');
  const [selectedAnzscoCode, setSelectedAnzscoCode] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customAnzscoCode, setCustomAnzscoCode] = useState('');
  const [customAnzscoName, setCustomAnzscoName] = useState('');
  const [customAssessingAuthority, setCustomAssessingAuthority] = useState('');
  const [availableOptions, setAvailableOptions] = useState(
    ANZSCO_CODES.map((code) => ({
      value: code.anzsco_code,
      label: `${code.anzsco_code} - ${code.name} (${code.assessing_authority})`,
    }))
  );
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadStage2Document();
  const updateMutation = useUpdateStage2Document();

  // Pre-fill form in edit mode
  useEffect(() => {
    if (mode === 'edit' && document) {
      setDocumentName(document.document_name || '');
      setOutcomeDate(document.outcome_date ? new Date(document.outcome_date) : undefined);
      setOutcome(document.outcome || '');
      // skill_assessing_body contains the anzsco_code
      const skillBody = document.skill_assessing_body || '';
      if (skillBody) {
        // Check if it's a valid ANZSCO code
        const matchingCode = getAnzscoCodeByCode(skillBody);
        if (matchingCode) {
          setSelectedAnzscoCode(skillBody);
        } else {
          // If not found, it might be a custom value - add it as a custom option
          setSelectedAnzscoCode(skillBody);
          setAvailableOptions((prev) => {
            const exists = prev.some((opt) => opt.value === skillBody);
            if (!exists) {
              return [...prev, { value: skillBody, label: `Custom - ${skillBody}` }];
            }
            return prev;
          });
        }
      } else {
        setSelectedAnzscoCode('');
      }
      
      setIsCustomMode(false);
      setCustomAnzscoCode('');
      setCustomAnzscoName('');
      setCustomAssessingAuthority('');
    } else {
      setDocumentName('');
      setOutcomeDate(undefined);
      setOutcome('');
      setSelectedAnzscoCode('');
      setIsCustomMode(false);
      setCustomAnzscoCode('');
      setCustomAnzscoName('');
      setCustomAssessingAuthority('');
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

  const handleAddCustomAnzscoCode = () => {
    if (customAnzscoCode.trim() && customAnzscoName.trim() && customAssessingAuthority.trim()) {
      const customCode = customAnzscoCode.trim();
      const customName = customAnzscoName.trim();
      const customAuthority = customAssessingAuthority.trim();
      
      // Check if it already exists
      if (!availableOptions.some((opt) => opt.value === customCode)) {
        setAvailableOptions((prev) => [
          ...prev,
          { value: customCode, label: `${customCode} - ${customName} (${customAuthority})` },
        ]);
      }
      setSelectedAnzscoCode(customCode);
      setCustomAnzscoCode('');
      setCustomAnzscoName('');
      setCustomAssessingAuthority('');
      setIsCustomMode(false);
    }
  };

  const handleToggleCustomMode = () => {
    setIsCustomMode(!isCustomMode);
    setCustomAnzscoCode('');
    setCustomAnzscoName('');
    setCustomAssessingAuthority('');
    if (!isCustomMode) {
      setSelectedAnzscoCode('');
    }
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

    if (!outcomeDate) {
      toast.error('Please select an outcome date.');
      return;
    }

    if (!outcome.trim()) {
      toast.error('Please select an outcome.');
      return;
    }

    const formattedOutcomeDate = format(outcomeDate, 'yyyy-MM-dd');

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
      // Pass the anzsco_code directly to skill_assessing_body
      const anzscoCodeValue = selectedAnzscoCode || undefined;

      if (mode === 'edit' && document) {
        // Update existing document metadata
        await updateMutation.mutateAsync({
          applicationId,
          documentId: document._id,
          metadata: {
            document_name: documentName,
            outcome_date: formattedOutcomeDate,
            outcome,
            skill_assessing_body: anzscoCodeValue,
          },
        });
      } else {
        // Create new document
        // Simulate progress
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
            type: 'outcome',
            outcome_date: formattedOutcomeDate,
            outcome,
            skill_assessing_body: anzscoCodeValue,
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
      setOutcomeDate(undefined);
      setOutcome('');
      setSelectedAnzscoCode('');
      setIsCustomMode(false);
      setCustomAnzscoCode('');
      setCustomAnzscoName('');
      setCustomAssessingAuthority('');
      setUploadedFiles([]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Outcome Document' : 'Create Outcome Document'}
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

          {/* Outcome */}
          <div className="space-y-2">
            <Label htmlFor="outcome">Outcome *</Label>
            <Select
              value={outcome}
              onValueChange={setOutcome}
              disabled={isUploading}
            >
              <SelectTrigger id="outcome">
                <SelectValue placeholder="Select outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Skill Assessment Outcome">Skill Assessment Outcome</SelectItem>
                <SelectItem value="APHRA">APHRA</SelectItem>
                <SelectItem value="ECA">ECA</SelectItem>
                <SelectItem value="Visa grant">Visa grant</SelectItem>
                <SelectItem value="License/ Registration">License/ Registration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Outcome Date */}
          <div className="space-y-2">
            <Label htmlFor="outcome-date">Outcome Date *</Label>
            <DatePicker
              value={outcomeDate}
              onChange={setOutcomeDate}
              placeholder="Select outcome date"
              disabled={isUploading}
            />
          </div>

          {/* Skill Assessing Body (ANZSCO Code) */}
          <div className="space-y-2">
            <Label>Skill Assessing Body (ANZSCO Code)</Label>
            {!isCustomMode ? (
              <div className="space-y-2">
                <Combobox
                  options={availableOptions}
                  value={selectedAnzscoCode}
                  onValueChange={setSelectedAnzscoCode}
                  placeholder="Select ANZSCO code..."
                  searchPlaceholder="Search ANZSCO code or occupation..."
                  emptyMessage="No ANZSCO code found."
                  disabled={isUploading}
                />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200"></span>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleToggleCustomMode}
                  disabled={isUploading}
                  className="text-sm underline p-0 h-auto"
                >
                  Add new ANZSCO code
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="custom-anzsco-code">ANZSCO Code *</Label>
                    <Input
                      id="custom-anzsco-code"
                      type="text"
                      placeholder="e.g., 121111"
                      value={customAnzscoCode}
                      onChange={(e) => setCustomAnzscoCode(e.target.value)}
                      disabled={isUploading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-assessing-authority">Assessing Authority *</Label>
                    <Input
                      id="custom-assessing-authority"
                      type="text"
                      placeholder="e.g., VETASSESS"
                      value={customAssessingAuthority}
                      onChange={(e) => setCustomAssessingAuthority(e.target.value)}
                      disabled={isUploading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-anzsco-name">Occupation Name *</Label>
                  <Input
                    id="custom-anzsco-name"
                    type="text"
                    placeholder="e.g., Aquaculture Farmer"
                    value={customAnzscoName}
                    onChange={(e) => setCustomAnzscoName(e.target.value)}
                    disabled={isUploading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCustomAnzscoCode();
                      }
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddCustomAnzscoCode}
                    disabled={!customAnzscoCode.trim() || !customAnzscoName.trim() || !customAssessingAuthority.trim() || isUploading}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleCustomMode}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
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

