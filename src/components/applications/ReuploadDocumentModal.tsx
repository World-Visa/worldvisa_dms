"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useReuploadDocument } from "@/hooks/useReuploadDocument";
import { useClientReuploadDocument } from "@/hooks/useClientDocumentMutations";
import { useDocumentData } from "@/hooks/useDocumentData";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Upload,
  X,
  AlertCircle,
  FileText,
  File,
  FileCheck,
} from "lucide-react";
import { Document } from "@/types/applications";
import {
  getChecklistDocumentMeta,
  isDocumentTypeWithSampleInModal,
} from "@/lib/documents/metadata";
import { SampleDocumentModal } from "./SampleDocumentModal";

const ACCEPT_IMAGE = ".jpg,.jpeg,image/jpeg,image/jpg";
const ACCEPT_DOCUMENTS =
  ".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

function getFileTypeIcon(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return <File className="h-5 w-5 text-emerald-600 shrink-0" />;
  }
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) {
    return <FileText className="h-5 w-5 text-blue-600 shrink-0" />;
  }
  if (lower.endsWith(".txt")) {
    return <File className="h-5 w-5 text-zinc-500 shrink-0" />;
  }
  return (
    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-red-100">
      <span className="text-[10px] font-semibold uppercase text-red-700">
        PDF
      </span>
    </div>
  );
}

interface ReuploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  document: Document | null;
  documentType: string;
  category: string;
  isClientView?: boolean;
  instruction?: string;
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
  isClientView = false,
  instruction,
}: ReuploadDocumentModalProps) {
  const finalDocumentType =
    documentType || document?.document_type || "Document";
  const finalCategory =
    category || document?.document_category || "Other Documents";
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reuploadMutation = useReuploadDocument();
  const clientReuploadMutation = useClientReuploadDocument();
  const { user } = useAuth();

  // Get real-time document data from cache
  const { document: currentDocument } = useDocumentData(document?._id || "");

  // Use the current document from cache, fallback to prop
  const displayDocument = currentDocument || document;
  const documentMeta = useMemo(
    () => getChecklistDocumentMeta(finalCategory, finalDocumentType),
    [finalCategory, finalDocumentType],
  );

  const isIdentityPhotograph = useMemo(() => {
    const cat =
      finalCategory === "Identity Documents" || finalCategory === "Identity";
    const type = finalDocumentType.toLowerCase();
    return (
      cat &&
      (type.includes("photograph") ||
        type.includes("photo") ||
        type.includes("picture"))
    );
  }, [finalCategory, finalDocumentType]);

  const fileAcceptAttribute = isIdentityPhotograph ? ACCEPT_IMAGE : ACCEPT_DOCUMENTS;
  const fileHintText = isIdentityPhotograph
    ? "JPG and JPEG files only • Max 5MB"
    : "PDF, Word (.doc, .docx), and text (.txt) • Max 5MB";

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setUploadedFile(null);
      setIsUploading(false);
      setSampleModalOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen]);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      const fileName = file.name.toLowerCase();

      let allowedExtensions: string[];
      let allowedMimeTypes: string[];
      let errorMessage: string;

      if (isIdentityPhotograph) {
        allowedExtensions = [".jpg", ".jpeg"];
        allowedMimeTypes = ["image/jpeg", "image/jpg"];
        errorMessage = `${file.name} is not a supported file type. Only JPG and JPEG files are allowed for photographs.`;
      } else {
        allowedExtensions = [".pdf", ".doc", ".docx", ".txt"];
        allowedMimeTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
        ];
        errorMessage = `${file.name} is not a supported file type. Only PDF, Word (.doc, .docx), and text (.txt) files are allowed.`;
      }

      const hasValidExtension = allowedExtensions.some((ext) =>
        fileName.endsWith(ext),
      );
      const hasValidMimeType = allowedMimeTypes.includes(file.type);

      if (!hasValidExtension || !hasValidMimeType) {
        toast.error(errorMessage);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum file size is 5MB.`);
        return;
      }

      if (file.size === 0) {
        toast.error(`${file.name} is empty. Please select a valid file.`);
        return;
      }

      const newFile: UploadedFile = {
        file,
        progress: 0,
        id: Math.random().toString(36).substr(2, 9),
      };

      setUploadedFile(newFile);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [
      isIdentityPhotograph,
      finalCategory,
      finalDocumentType,
    ],
  );

  const removeFile = useCallback(() => {
    setUploadedFile(null);
  }, []);

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer.files);

    if (files.length > 1) {
      toast.error("Please select only one file for reupload.");
      return;
    }

    // Create a fake event object to reuse the existing validation logic
    const fakeEvent = {
      target: { files },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    handleFileSelect(fakeEvent);
  };

  const handleReupload = async () => {
    if (!uploadedFile || !displayDocument || !user?.username) {
      toast.error(
        "Please select a file and ensure user information is available.",
      );
      return;
    }

    setIsUploading(true);

    try {
      const clientId = user?._id || user?.lead_id;

      if (isClientView && !clientId) {
        toast.error("Client information not available. Please login again.");
        return;
      }

      // Simulate progress updates
      const progressInterval = window.setInterval(() => {
        setUploadedFile((prev) =>
          prev ? { ...prev, progress: Math.min(prev.progress + 5, 90) } : null,
        );
      }, 200);

      try {
        // Use the appropriate reupload API
        if (isClientView) {
          await clientReuploadMutation.mutateAsync({
            clientId: clientId!,
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
        setUploadedFile((prev) => (prev ? { ...prev, progress: 100 } : null));

        clearInterval(progressInterval);

        toast.success("Document reuploaded successfully!");

        setTimeout(() => {
          onClose();
        }, 500);
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    } catch {
      setUploadedFile((prev) => (prev ? { ...prev, progress: 0 } : null));
      toast.error("Failed to reupload document. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!displayDocument) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="flex h-auto max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg rounded-2xl"
          showCloseButton={true}
        >
          {/* Fixed header — Airbnb-style */}
          <DialogHeader className="shrink-0 border-b border-border/80 bg-muted/30 px-6 pr-12 py-4">
            <DialogTitle className="flex items-center gap-2.5 font-semibold tracking-tight text-foreground">
              Reupload document
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable content only */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
            {instruction?.trim() ? (
              <div className="mb-4 rounded-lg border border-sky-200/80 bg-sky-50/80 px-3 py-2.5 text-xs text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200">
                <strong>Note:</strong> {instruction}
              </div>
            ) : null}

            <div className="space-y-4">
              {/* Current document card */}
              <section className="rounded-xl border border-border/80 bg-muted/20 p-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Replacing
                </p>
                <p className="mt-1 truncate font-medium text-foreground">
                  {displayDocument.file_name}
                </p>
                <dl className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">Type:</span>{" "}
                    {finalDocumentType}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Category:</span>{" "}
                    {finalCategory}
                  </div>
                </dl>
                {displayDocument.reject_message ? (
                  <div className="mt-3 rounded-lg border border-red-200/80 bg-red-50/80 p-2.5 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                    <strong>Rejection reason:</strong>{" "}
                    {displayDocument.reject_message}
                  </div>
                ) : null}
                {isDocumentTypeWithSampleInModal(
                  finalDocumentType,
                  finalCategory,
                ) ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-1.5"
                    onClick={() => setSampleModalOpen(true)}
                  >
                    <FileCheck className="h-4 w-4" />
                    View sample
                  </Button>
                ) : null}
              </section>

              {documentMeta?.importantNote ? (
                <Alert className="border-amber-200/80 bg-amber-50/80 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide">
                      Important
                    </p>
                    <p className="whitespace-pre-line text-sm font-medium">
                      {documentMeta.importantNote}
                    </p>
                  </AlertDescription>
                </Alert>
              ) : null}

              {/* Upload zone */}
              <section className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  Select new file to replace the rejected document
                </p>
                <div
                  className={
                    isUploading
                      ? "cursor-not-allowed rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/20 p-8 text-center transition-colors"
                      : "cursor-pointer rounded-xl border-2 border-dashed border-amber-400/50 bg-amber-500/5 p-8 text-center transition-colors hover:border-amber-500/70 hover:bg-amber-500/10"
                  }
                  onClick={() =>
                    !isUploading && fileInputRef.current?.click()
                  }
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={fileAcceptAttribute}
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading}
                    aria-label="Choose file to reupload"
                  />
                  <Upload className="mx-auto mb-3 h-10 w-10 text-amber-600/80" />
                  <p className="text-sm font-medium text-foreground">
                    {isUploading
                      ? "Uploading…"
                      : "Drop your file here or click to browse"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {fileHintText}
                  </p>
                </div>

                {uploadedFile ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      File to upload
                    </p>
                    <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-muted/10 p-3">
                      {getFileTypeIcon(uploadedFile.file.name)}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {uploadedFile.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(uploadedFile.file.size / 1024 / 1024).toFixed(2)}{" "}
                          MB
                        </p>
                        {isUploading ? (
                          <div className="mt-2">
                            <Progress
                              value={uploadedFile.progress}
                              className="h-1.5"
                            />
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {uploadedFile.progress}%
                            </p>
                          </div>
                        ) : null}
                      </div>
                      {!isUploading ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={removeFile}
                          aria-label="Remove file"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          </div>

          {/* Fixed footer — Airbnb-style */}
          <DialogFooter className="shrink-0 flex-row gap-2 border-t border-border/80 bg-muted/20 px-6 py-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
              className="min-w-18"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReupload}
              disabled={!uploadedFile || isUploading}
              className="min-w-32 bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-500/30"
            >
              {isUploading ? "Reuploading…" : "Reupload document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <SampleDocumentModal
        isOpen={sampleModalOpen}
        onClose={() => setSampleModalOpen(false)}
        documentType={finalDocumentType}
        category={finalCategory}
        samplePath=""
      />
    </>
  );
}
