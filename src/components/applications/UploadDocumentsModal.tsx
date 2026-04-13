"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/primitives/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAddDocument } from "@/hooks/useMutationsDocuments";
import { useClientUploadDocument } from "@/hooks/useClientDocumentMutations";
import { useReuploadDocument } from "@/hooks/useReuploadDocument";
import { useClientReuploadDocument } from "@/hooks/useClientDocumentMutations";
import { useDocumentData } from "@/hooks/useDocumentData";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, X, FileText, File, RotateCcw } from "lucide-react";
import {
  DocumentUploadModalProps,
  UploadDocumentsModalProps,
  ReuploadDocumentModalProps,
  UploadedFile,
  ApiDocument,
} from "@/types/documents";
import {
  generateCompanyDescription,
  generateCurrentEmploymentDescription,
  generatePastEmploymentDescription,
} from "@/utils/dateCalculations";
import { getChecklistDocumentMeta } from "@/lib/documents/metadata";
import { resolveFileFormats, isFileValid } from "@/lib/documents/fileFormats";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_TOTAL_SIZE_BYTES,
  DEFAULT_MAX_FILES,
} from "@/lib/documents/uploadLimits";
import { InlineToast } from "@/components/ui/primitives/inline-toast";
import { SampleDocumentModal } from "./SampleDocumentModal";
import { useChecklistTemplateForDocument } from "@/hooks/useChecklistTemplateForDocument";
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
} from "../ui/primitives/sonner-helpers";
import { RiDeleteBin2Line, RiDeleteBin3Line, RiFileAddLine, RiFileUploadFill, RiFileUploadLine } from "react-icons/ri";
import { CompactButton } from "../ui/primitives/button-compact";
import { cn } from "@/lib/utils";

interface FileRowProps {
  uploadedFile: UploadedFile;
  isUploading: boolean;
  onRemove: () => void;
}

function getFileTypeIcon(fileName: string): React.ReactNode {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")) {
    return <File className="h-5 w-5 shrink-0 text-emerald-600" />;
  }
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) {
    return <FileText className="h-5 w-5 shrink-0 text-blue-600" />;
  }
  if (lower.endsWith(".txt")) {
    return <File className="h-5 w-5 shrink-0 text-zinc-500" />;
  }
  return (
    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-red-100">
      <span className="text-[10px] font-semibold uppercase text-red-700">PDF</span>
    </div>
  );
}

function FileRow({ uploadedFile, isUploading, onRemove }: FileRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/10 p-3">
      {getFileTypeIcon(uploadedFile.file.name)}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {uploadedFile.file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
        </p>
        {isUploading && (
          <div className="mt-2 space-y-1">
            <Progress value={uploadedFile.progress} className="h-1.5" />
            <p className="text-xs text-muted-foreground">{uploadedFile.progress}%</p>
          </div>
        )}
      </div>
      {!isUploading && (
        <CompactButton
          icon={RiDeleteBin3Line}
          variant="ghost"
          size="md"
          className="text-muted-foreground hover:text-destructive cursor-pointer"
          onClick={onRemove}
          aria-label="Remove file"
         />
      )}
    </li>
  );
}

export function UploadDocumentsModal(props: DocumentUploadModalProps) {
  const isReupload = props.mode === "reupload";

  const uploadProps = isReupload ? undefined : (props as UploadDocumentsModalProps);
  const reuploadProps = isReupload ? (props as ReuploadDocumentModalProps) : undefined;

  const {
    isOpen,
    onClose,
    applicationId,
    isClientView = false,
    instruction,
    clientLeadId,
    visaServiceType,
  } = props;

  const [selectedDocumentType, setSelectedDocumentType] = useState<string>(
    uploadProps?.selectedDocumentType ?? "",
  );
  const [selectedDocumentCategory, setSelectedDocumentCategory] = useState<string>(
    uploadProps?.selectedDocumentCategory ?? "",
  );
  const [description, setDescription] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addDocumentMutation = useAddDocument();
  const clientUploadDocumentMutation = useClientUploadDocument();
  const reuploadMutation = useReuploadDocument();
  const clientReuploadMutation = useClientReuploadDocument();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const documentId = reuploadProps?.document?._id ?? "";
  const { document: currentDocument } = useDocumentData(documentId);

  const effectiveDocumentType = isReupload
    ? (reuploadProps?.documentType || reuploadProps?.document?.document_type || "Document")
    : selectedDocumentType;

  const effectiveCategory = isReupload
    ? (reuploadProps?.category || reuploadProps?.document?.document_category || "Other Documents")
    : selectedDocumentCategory;

  const displayDocument = isReupload
    ? (currentDocument ?? reuploadProps?.document ?? null)
    : null;

  const documentMeta = useMemo(
    () => getChecklistDocumentMeta(effectiveCategory, effectiveDocumentType),
    [effectiveCategory, effectiveDocumentType],
  );

  const dynamicTemplate = useChecklistTemplateForDocument(
    visaServiceType,
    effectiveCategory,
    effectiveDocumentType,
  );

  const hasSample = !!dynamicTemplate?.sampleDocumentUrl;
  const effectiveImportantNote = dynamicTemplate?.importantNote ?? documentMeta?.importantNote;
  const effectiveAllowedDocument = dynamicTemplate?.allowedDocument ?? documentMeta?.allowedDocument;

  const { acceptAttribute, allowedExtensions, allowedMimeTypes, hintText: fileHintText } =
    useMemo(() => resolveFileFormats(dynamicTemplate?.format), [dynamicTemplate?.format]);

  const isUploadZoneDisabled = !isReupload && !selectedDocumentType;

  const filesArray = isReupload ? (uploadedFile ? [uploadedFile] : []) : uploadedFiles;


  useEffect(() => {
    if (isOpen && !isReupload && selectedDocumentCategory) {
      const docs = uploadProps?.documents;
      let autoDescription = "";

      if (docs && docs.length > 0) {
        const existingDoc = docs.find(
          (doc: ApiDocument) =>
            doc.document_category === selectedDocumentCategory && doc.description,
        );
        if (existingDoc?.description) autoDescription = existingDoc.description;
      }

      if (
        !autoDescription &&
        selectedDocumentCategory.includes("Documents") &&
        !["Identity Documents", "Education Documents", "Other Documents", "Self Employment/Freelance"].includes(
          selectedDocumentCategory,
        ) &&
        uploadProps?.company
      ) {
        autoDescription = generateCompanyDescription(
          uploadProps.company.fromDate,
          uploadProps.company.toDate ?? "2025-12-31",
        );
      }

      if (autoDescription) setDescription(autoDescription);
    }
  }, [isOpen, isReupload, selectedDocumentCategory]);

  useEffect(() => {
    if (!isReupload) {
      const nextType = uploadProps?.selectedDocumentType;
      const nextCat = uploadProps?.selectedDocumentCategory;
      if (nextType) setSelectedDocumentType(nextType);
      if (nextCat) setSelectedDocumentCategory(nextCat);
    }
  }, [isReupload, uploadProps?.selectedDocumentType, uploadProps?.selectedDocumentCategory]);

  useEffect(() => {
    if (!isOpen) {
      setUploadedFile(null);
      setUploadedFiles([]);
      setIsUploading(false);
      setSampleModalOpen(false);
      setIsDragOver(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [isOpen]);


  function checkFileQuiet(file: File): boolean {
    return isFileValid(file, allowedExtensions, allowedMimeTypes, MAX_FILE_SIZE_BYTES);
  }

  function validateAllowedDocumentLimit(fileCount: number): boolean {
    const limit = effectiveAllowedDocument ?? DEFAULT_MAX_FILES;
    const existingCount = uploadProps?.existingDocumentCount ?? 0;
    const currentCount = uploadedFiles.length;
    const totalCount = existingCount + currentCount + fileCount;

    if (totalCount > limit) {
      showWarningToast(
        `Max ${limit} file${limit === 1 ? "" : "s"} allowed for "${effectiveDocumentType}"`,
      );
      return false;
    }
    return true;
  }


  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    if (isReupload) {
      const file = files[0];
      if (!checkFileQuiet(file)) {
        showWarningToast(`${file.name} — unsupported format or exceeds 5 MB`);
        return;
      }
      setUploadedFile({ file, progress: 0, id: Math.random().toString(36).slice(2, 11) });
    } else {
      if (!validateAllowedDocumentLimit(files.length)) return;

      const validFiles: File[] = [];
      const rejectedNames: string[] = [];
      for (const file of files) {
        if (checkFileQuiet(file)) {
          validFiles.push(file);
        } else {
          rejectedNames.push(file.name);
        }
      }

      if (rejectedNames.length > 0) {
        const preview = rejectedNames.slice(0, 3).join(", ");
        const extra = rejectedNames.length > 3 ? ` +${rejectedNames.length - 3} more` : "";
        showWarningToast(`${preview}${extra} — unsupported format or exceeds 5 MB`);
      }

      if (validFiles.length > 0) {
        const newFiles: UploadedFile[] = validFiles.map((file) => ({
          file,
          progress: 0,
          id: Math.random().toString(36).slice(2, 11),
        }));
        setUploadedFiles((prev) => [...prev, ...newFiles]);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isUploading && !isUploadZoneDisabled) setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    if (isUploadZoneDisabled || isUploading) return;
    if (!isReupload && !selectedDocumentType) {
      showWarningToast("Select a document type first");
      return;
    }

    const files = Array.from(event.dataTransfer.files);
    if (isReupload && files.length > 1) {
      showWarningToast("Drop one file at a time for reupload");
      return;
    }

    const fakeEvent = { target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleFileSelect(fakeEvent);
  };


  const getDocumentCategory = (category: string): string => {
    if (
      category.includes("Documents") &&
      !["Identity Documents", "Education Documents", "Other Documents", "Self Employment/Freelance"].includes(
        category,
      )
    ) {
      return category;
    }

    const categoryMap: Record<string, string> = {
      "Identity Documents": "Identity",
      Identity: "Identity",
      "Education Documents": "Education",
      Education: "Education",
      "Other Documents": "Other",
      Other: "Other",
      "Self Employment/Freelance": "Self Employment/Freelance",
    };

    return categoryMap[category] ?? "Other";
  };

  const getDisplayCategory = (apiCategory: string): string => {
    const reverseMap: Record<string, string> = {
      Identity: "Identity Documents",
      Education: "Education Documents",
      Other: "Other Documents",
      "Self Employment/Freelance": "Self Employment/Freelance",
    };

    if (
      apiCategory.includes("Company Documents") &&
      !["Identity Documents", "Education Documents", "Other Documents", "Self Employment/Freelance"].includes(
        apiCategory,
      )
    ) {
      return apiCategory;
    }

    return reverseMap[apiCategory] ?? apiCategory;
  };

  const getCompanyDescription = (category: string): string => {
    const docs = uploadProps?.documents;
    if (docs && docs.length > 0) {
      const existingDoc = docs.find(
        (doc: ApiDocument) => doc.document_category === category && doc.description,
      );
      if (existingDoc?.description) return existingDoc.description;
    }

    const company = uploadProps?.company;
    if (
      company &&
      category.includes("Documents") &&
      !["Identity Documents", "Education Documents", "Other Documents"].includes(category)
    ) {
      if (company.description) return company.description;
      if (company.isCurrentEmployment) {
        return generateCurrentEmploymentDescription(company.name, company.fromDate);
      }
      if (company.toDate) {
        return generatePastEmploymentDescription(company.name, company.fromDate, company.toDate);
      }
      return generateCompanyDescription(company.fromDate, company.toDate ?? "2025-12-31");
    }

    return "";
  };

  const isMongoObjectId = (value: string): boolean => /^[a-fA-F0-9]{24}$/.test(value);

  const getClientId = (): string | undefined => {
    const explicitLeadId = clientLeadId?.trim();
    const authLeadId = user?.lead_id?.trim();
    const appScopedId = applicationId?.trim();
    const authUserId = user?._id?.trim();

    if (explicitLeadId) return explicitLeadId;
    if (authLeadId) return authLeadId;
    if (isClientView && appScopedId && !isMongoObjectId(appScopedId)) return appScopedId;
    if (authUserId && !isMongoObjectId(authUserId)) return authUserId;

    return undefined;
  };

  // ── Submit handlers ───────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!effectiveDocumentType || uploadedFiles.length === 0) {
      showWarningToast("Add at least one file to continue");
      return;
    }

    const uploadedBy = user?.username ?? user?.email;
    if (!uploadedBy) {
      showErrorToast("User info unavailable — please sign in again");
      return;
    }

    const totalSize = uploadedFiles.reduce((sum, f) => sum + f.file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      showWarningToast("Total size exceeds 50 MB");
      return;
    }

    const clientId = getClientId();
    setIsUploading(true);
    try {
      const progressInterval = window.setInterval(() => {
        setUploadedFiles((prev) =>
          prev.map((f) => ({ ...f, progress: Math.min(f.progress + 5, 90) })),
        );
      }, 200);

      try {
        const finalDescription = getCompanyDescription(effectiveCategory) || description;
        const finalCategory = getDocumentCategory(effectiveCategory);

        const uploadResult = isClientView
          ? await clientUploadDocumentMutation.mutateAsync({
            clientId: clientId!,
            files: uploadedFiles.map((uf) => uf.file),
            document_name: effectiveDocumentType,
            document_category: finalCategory,
            uploaded_by: uploadedBy,
            description: finalDescription,
            document_type: effectiveDocumentType.toLowerCase().replace(/\s+/g, "_"),
          })
          : await addDocumentMutation.mutateAsync({
            applicationId,
            files: uploadedFiles.map((uf) => uf.file),
            document_name: effectiveDocumentType,
            document_category: finalCategory,
            uploaded_by: uploadedBy,
            description: finalDescription,
            document_type: effectiveDocumentType.toLowerCase().replace(/\s+/g, "_"),
          });

        setUploadedFiles((prev) => prev.map((f) => ({ ...f, progress: 100 })));
        clearInterval(progressInterval);

        if (uploadResult?.data) {
          const apiCategory = getDocumentCategory(effectiveCategory);
          const displayCategory = getDisplayCategory(apiCategory);

          const newDocuments = uploadResult.data.map(
            (doc: {
              id: string;
              name: string;
              size: number;
              type: string;
              uploaded_at: string;
            }) => ({
              _id: doc.id,
              record_id: applicationId,
              workdrive_file_id: doc.id,
              workdrive_parent_id: "",
              file_name: doc.name,
              uploaded_by: uploadedBy,
              status: "pending" as const,
              history: [],
              uploaded_at: doc.uploaded_at,
              comments: [],
              __v: 0,
              document_type: effectiveDocumentType.toLowerCase().replace(/\s+/g, "_"),
              document_category: displayCategory,
              description: finalDescription,
            }),
          );

          queryClient.setQueryData(
            ["application-documents", applicationId],
            (oldData: { data?: unknown[] } | undefined) => {
              if (!oldData?.data) return oldData;
              return { ...oldData, data: [...oldData.data, ...newDocuments] };
            },
          );

          queryClient.setQueryData(
            ["client-documents"],
            (oldData: { data?: { documents?: unknown[] } } | undefined) => {
              if (!oldData?.data?.documents) return oldData;
              return {
                ...oldData,
                data: { ...oldData.data, documents: [...oldData.data.documents, ...newDocuments] },
              };
            },
          );

          queryClient.setQueryData(
            ["client-documents-all"],
            (oldData: { data?: { documents?: unknown[] } } | undefined) => {
              if (!oldData?.data?.documents) return oldData;
              return {
                ...oldData,
                data: { ...oldData.data, documents: [...oldData.data.documents, ...newDocuments] },
              };
            },
          );

          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["application-documents", applicationId] });
            queryClient.invalidateQueries({
              queryKey: ["application-documents-all", applicationId],
            });
            queryClient.invalidateQueries({ queryKey: ["client-documents"] });
            queryClient.invalidateQueries({ queryKey: ["client-documents-all"] });
          }, 100);
        }
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }

      onClose();
      uploadProps?.onSuccess?.();
      setSelectedDocumentType("");
      setSelectedDocumentCategory("");
      setUploadedFiles([]);
    } catch (error) {
      setUploadedFiles((prev) => prev.map((f) => ({ ...f, progress: 0 })));
      const message = error instanceof Error ? error.message : "Unknown error";
      showErrorToast(`Upload failed — ${message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReupload = async () => {
    const uploadedBy = user?.username ?? user?.email;
    if (!uploadedFile || !displayDocument || !uploadedBy) {
      showErrorToast("Select a file and ensure you are signed in");
      return;
    }

    const clientId = getClientId();
    if (isClientView && !clientId) {
      showErrorToast("Client ID missing — please refresh and try again");
      return;
    }

    setIsUploading(true);

    try {
      const progressInterval = window.setInterval(() => {
        setUploadedFile((prev) =>
          prev ? { ...prev, progress: Math.min(prev.progress + 5, 90) } : null,
        );
      }, 200);

      try {
        if (isClientView) {
          await clientReuploadMutation.mutateAsync({
            clientId: clientId!,
            documentId: displayDocument._id,
            file: uploadedFile.file,
            document_name: effectiveDocumentType,
            document_category: effectiveCategory,
            uploaded_by: uploadedBy,
            description: displayDocument.description,
          });
        } else {
          await reuploadMutation.mutateAsync({
            applicationId,
            documentId: displayDocument._id,
            file: uploadedFile.file,
            document_name: effectiveDocumentType,
            document_category: effectiveCategory,
            uploaded_by: uploadedBy,
            description: displayDocument.description,
          });
        }

        setUploadedFile((prev) => (prev ? { ...prev, progress: 100 } : null));
        clearInterval(progressInterval);

        showSuccessToast("Document reuploaded successfully");
        setTimeout(onClose, 500);
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    } catch {
      setUploadedFile((prev) => (prev ? { ...prev, progress: 0 } : null));
      showErrorToast("Reupload failed — please try again");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    setSelectedDocumentType("");
    setSelectedDocumentCategory("");
    setDescription("");
    setUploadedFiles([]);
    setUploadedFile(null);
    setSampleModalOpen(false);
    setIsDragOver(false);
    onClose();
  };

  const handleSubmit = () => {
    if (isReupload) void handleReupload();
    else void handleUpload();
  };

  const isSubmitDisabled = isReupload
    ? !uploadedFile || isUploading
    : !effectiveDocumentType || uploadedFiles.length === 0 || isUploading;

  const uploadZoneClasses = [
    "rounded-xl border-2 border-dashed border-muted-foreground/20 p-8 text-center transition-all duration-150 select-none outline-none",
    isUploading || (!isReupload && isUploadZoneDisabled)
      ? "cursor-not-allowed border-muted-foreground/20 bg-muted/20"
      : isReupload
        ? isDragOver
          ? "cursor-copy border-border/80 bg-muted/20"
          : "cursor-pointer border-border/50 bg-bg-weak hover:border-border/70 hover:bg-bg-weak"
        : isDragOver
          ? "cursor-copy border-muted-foreground/80 bg-neutral-50"
          : "cursor-pointer border-muted-foreground/50 bg-bg-weak hover:border-muted-foreground/70 hover:bg-neutral-50/10",
  ].join(" ");

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent
          className="flex h-auto max-h-[90vh] w-full flex-col gap-0 overflow-hidden rounded-2xl p-0 max-w-xl"
        >
          {/* Fixed Header */}
          <DialogHeader className="shrink-0 border-b border-border/80 bg-muted/30 px-6 pr-12 py-4">
            <DialogTitle className="flex items-center gap-2.5 font-medium tracking-tight text-foreground">
              {isReupload ? "Reupload document" : "Upload documents"}
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-4">

            {instruction?.trim() ? (
              <InlineToast variant="warning" title="Instruction" description={instruction} />
            ) : null}

            {(effectiveDocumentType || (isReupload && displayDocument)) ? (
              <section className="rounded-md border border-border/80 bg-bg-weak p-2">
                <div className="flex items-center text-sm justify-between gap-2">
                  <p className="text-xs flex items-center gap-1 font-medium uppercase tracking-wider text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {effectiveAllowedDocument
                        ? `Max ${effectiveAllowedDocument} file${effectiveAllowedDocument === 1 ? "" : "s"}`
                        : "Multiple files allowed"}
                    </span>
                  </p>
                  <p className="font-medium text-foreground">{effectiveDocumentType}</p>
                </div>
              </section>
            ) : null}

            {hasSample ? (
              <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2.5">
                <span className="text-sm text-muted-foreground">Sample document available</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 shrink-0 text-xs"
                  onClick={() => setSampleModalOpen(true)}
                >
                  View sample
                </Button>
              </div>
            ) : null}

            {/* Upload zone */}
            <section className="space-y-3">
              {isReupload ? (
                <p className="text-sm font-medium text-foreground">
                  Select new file to replace the rejected document
                </p>
              ) : null}
              <div
                className={uploadZoneClasses}
                role="button"
                tabIndex={isUploading || (!isReupload && isUploadZoneDisabled) ? -1 : 0}
                aria-label={
                  isReupload
                    ? "Drop your replacement file here or click to browse"
                    : isUploadZoneDisabled
                      ? "Please select a document type first"
                      : "Drop your files here or click to browse"
                }
                onClick={() => {
                  if (!isUploading && !isUploadZoneDisabled) fileInputRef.current?.click();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isUploading && !isUploadZoneDisabled) {
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple={!isReupload}
                  accept={acceptAttribute}
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading || (!isReupload && isUploadZoneDisabled)}
                  aria-label="Choose file to upload"
                />

                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 transition-colors">
                  {isReupload ? (
                    <RiFileUploadFill
                      size={24}
                      className={cn(
                        "transition-colors",
                        isUploading ? "text-muted-foreground/40" : "text-foreground",
                      )}
                    />
                  ) : (
                    <RiFileAddLine 
                      className={[
                        "h-6 w-6 transition-colors",
                        isUploadZoneDisabled ? "text-muted-foreground/40" : "text-foreground",
                      ].join(" ")}
                    />
                  )}
                </div>

                <p className="text-sm font-medium text-foreground">
                  {isUploading
                    ? "Uploading…"
                    : isUploadZoneDisabled
                      ? "Please select a document type first"
                      : "Drop your file here or click to browse"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{fileHintText}</p>
              </div>
            </section>

            {/* Files list */}
            {filesArray.length > 0 && (
              <section className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {isReupload ? "File to upload" : ``}
                </p>
                <ul className="space-y-2">
                  {filesArray.map((uf) => (
                    <FileRow
                      key={uf.id}
                      uploadedFile={uf}
                      isUploading={isUploading}
                      onRemove={() => {
                        if (isReupload) {
                          setUploadedFile(null);
                        } else {
                          setUploadedFiles((prev) => prev.filter((f) => f.id !== uf.id));
                        }
                      }}
                    />
                  ))}
                </ul>
              </section>
            )}

            {effectiveImportantNote ? (
              <InlineToast
                variant="warning"
                title="Important"
                description={
                  <div
                    className="prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_mark]:bg-yellow-200 [&_mark]:rounded-[2px] [&_mark]:px-0.5 [&_p]:my-0.5"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: effectiveImportantNote }}
                  />
                }
              />
            ) : null}
          </div>

          {/* Fixed Footer */}
          <div className="shrink-0 flex flex-row items-center justify-end gap-2 border-t border-neutral-alpha-200 bg-bg-weak px-6 py-4 rounded-b-2xl">
            
            <Button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className={[
                "min-w-36 gap-2 text-sm bg-neutral-900 text-white hover:bg-neutral-900/90 focus-visible:ring-neutral-900/30",
                isSubmitDisabled ? "cursor-not-allowed opacity-50" : "",
              ].join(" ")}
            >
              {isUploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {isReupload ? "Reuploading…" : "Uploading…"}
                </>
              ) : isReupload ? (
                "Reupload document"
              ) : (
                "Upload documents"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SampleDocumentModal
        isOpen={sampleModalOpen}
        onClose={() => setSampleModalOpen(false)}
        documentType={effectiveDocumentType}
        category={effectiveCategory}
        sampleDocumentUrl={dynamicTemplate?.sampleDocumentUrl ?? undefined}
        importantNote={effectiveImportantNote ?? undefined}
      />
    </>
  );
}
