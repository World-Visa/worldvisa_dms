"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
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
import { useAddDocument } from "@/hooks/useMutationsDocuments";
import { useClientUploadDocument } from "@/hooks/useClientDocumentMutations";
import { useReuploadDocument } from "@/hooks/useReuploadDocument";
import { useClientReuploadDocument } from "@/hooks/useClientDocumentMutations";
import { useDocumentData } from "@/hooks/useDocumentData";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Upload,
  X,
  FileText,
  File,
  AlertCircle,
  FileCheck,
  RotateCcw,
  Eye,
} from "lucide-react";
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
import {
  getChecklistDocumentMeta,
  isDocumentTypeWithSampleInModal,
} from "@/lib/documents/metadata";
import { SampleDocumentModal } from "./SampleDocumentModal";

// ─── Module-scope helpers ─────────────────────────────────────────────────────

interface FileRowProps {
  uploadedFile: UploadedFile;
  isUploading: boolean;
  onRemove: () => void;
}

function getFileTypeIcon(fileName: string): React.ReactNode {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
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
      <span className="text-[10px] font-semibold uppercase text-red-700">
        PDF
      </span>
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
            <p className="text-xs text-muted-foreground">
              {uploadedFile.progress}%
            </p>
          </div>
        )}
      </div>
      {!isUploading && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </li>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPT_IMAGE = ".jpg,.jpeg,image/jpeg,image/jpg";
const ACCEPT_DOCUMENTS =
  ".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

// ─── Main Component ───────────────────────────────────────────────────────────

export function UploadDocumentsModal(props: DocumentUploadModalProps) {
  const isReupload = props.mode === "reupload";

  // Type-safe mode-specific prop extraction
  const uploadProps = isReupload
    ? undefined
    : (props as UploadDocumentsModalProps);
  const reuploadProps = isReupload
    ? (props as ReuploadDocumentModalProps)
    : undefined;

  const { isOpen, onClose, applicationId, isClientView = false, instruction } =
    props;

  // ── State ─────────────────────────────────────────────────────────────────
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>(
    uploadProps?.selectedDocumentType ?? "",
  );
  const [selectedDocumentCategory, setSelectedDocumentCategory] =
    useState<string>(uploadProps?.selectedDocumentCategory ?? "");
  const [description, setDescription] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Hooks (all called unconditionally — Rules of Hooks) ───────────────────
  const addDocumentMutation = useAddDocument();
  const clientUploadDocumentMutation = useClientUploadDocument();
  const reuploadMutation = useReuploadDocument();
  const clientReuploadMutation = useClientReuploadDocument();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Empty string → disabled internally in useDocumentData when not reupload mode
  const documentId = reuploadProps?.document?._id ?? "";
  const { document: currentDocument } = useDocumentData(documentId);

  // ── Derived values ────────────────────────────────────────────────────────
  const effectiveDocumentType = isReupload
    ? (reuploadProps?.documentType ||
      reuploadProps?.document?.document_type ||
      "Document")
    : selectedDocumentType;

  const effectiveCategory = isReupload
    ? (reuploadProps?.category ||
      reuploadProps?.document?.document_category ||
      "Other Documents")
    : selectedDocumentCategory;

  const displayDocument = isReupload
    ? (currentDocument ?? reuploadProps?.document ?? null)
    : null;

  const documentMeta = useMemo(
    () => getChecklistDocumentMeta(effectiveCategory, effectiveDocumentType),
    [effectiveCategory, effectiveDocumentType],
  );

  const hasSample = isDocumentTypeWithSampleInModal(
    effectiveDocumentType,
    effectiveCategory,
  );

  const isIdentityPhotograph = useMemo(() => {
    const cat =
      effectiveCategory === "Identity Documents" ||
      effectiveCategory === "Identity";
    const type = effectiveDocumentType.toLowerCase();
    return (
      cat &&
      (type.includes("photograph") ||
        type.includes("photo") ||
        type.includes("picture"))
    );
  }, [effectiveCategory, effectiveDocumentType]);

  const fileAcceptAttribute = isIdentityPhotograph
    ? ACCEPT_IMAGE
    : ACCEPT_DOCUMENTS;

  const fileHintText = isIdentityPhotograph
    ? "JPG and JPEG files only · Max 5MB per file"
    : "PDF, Word (.doc, .docx), or text (.txt) · Max 5MB per file";

  const isUploadZoneDisabled = !isReupload && !selectedDocumentType;

  const filesArray = isReupload
    ? uploadedFile
      ? [uploadedFile]
      : []
    : uploadedFiles;

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen && !isReupload && selectedDocumentCategory) {
      let autoDescription = "";
      const docs = uploadProps?.documents;

      if (docs && docs.length > 0) {
        const existingDoc = docs.find(
          (doc: ApiDocument) =>
            doc.document_category === selectedDocumentCategory &&
            doc.description,
        );
        if (existingDoc?.description) {
          autoDescription = existingDoc.description;
        }
      }

      if (
        !autoDescription &&
        selectedDocumentCategory.includes("Documents") &&
        ![
          "Identity Documents",
          "Education Documents",
          "Other Documents",
          "Self Employment/Freelance",
        ].includes(selectedDocumentCategory) &&
        uploadProps?.company
      ) {
        autoDescription = generateCompanyDescription(
          uploadProps.company.fromDate,
          uploadProps.company.toDate ?? "2025-12-31",
        );
      }

      if (autoDescription) {
        setDescription(autoDescription);
      }
    }
  }, [isOpen, isReupload, selectedDocumentCategory]);

  // Sync upload-mode prop changes
  useEffect(() => {
    if (!isReupload) {
      const nextType = uploadProps?.selectedDocumentType;
      const nextCat = uploadProps?.selectedDocumentCategory;
      if (nextType) setSelectedDocumentType(nextType);
      if (nextCat) setSelectedDocumentCategory(nextCat);
    }
  }, [
    isReupload,
    uploadProps?.selectedDocumentType,
    uploadProps?.selectedDocumentCategory,
  ]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUploadedFile(null);
      setUploadedFiles([]);
      setIsUploading(false);
      setSampleModalOpen(false);
      setIsDragOver(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen]);

  // ── File validation ───────────────────────────────────────────────────────

  function validateSingleFile(file: File): boolean {
    const fileName = file.name.toLowerCase();

    const allowedExtensions = isIdentityPhotograph
      ? [".jpg", ".jpeg"]
      : [".pdf", ".doc", ".docx", ".txt"];

    const allowedMimeTypes = isIdentityPhotograph
      ? ["image/jpeg", "image/jpg"]
      : [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];

    const errorMessage = isIdentityPhotograph
      ? `${file.name} is not supported. Only JPG and JPEG files are allowed for photographs.`
      : `${file.name} is not supported. Only PDF, Word (.doc, .docx), and text (.txt) files are allowed.`;

    const hasValidExtension = allowedExtensions.some((ext) =>
      fileName.endsWith(ext),
    );
    if (!hasValidExtension) {
      toast.error(errorMessage);
      return false;
    }

    if (!allowedMimeTypes.includes(file.type)) {
      toast.error(errorMessage);
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
  }

  function validateAllowedDocumentLimit(fileCount: number): boolean {
    const allowedDocument = documentMeta?.allowedDocument;
    if (allowedDocument === undefined) return true;

    const currentCount = uploadedFiles.length;
    const totalCount = currentCount + fileCount;

    if (totalCount > allowedDocument) {
      toast.error(
        `Maximum ${allowedDocument} file${allowedDocument === 1 ? "" : "s"} allowed for "${effectiveDocumentType}". ` +
        `You are trying to upload ${fileCount} file${fileCount === 1 ? "" : "s"}, ` +
        `but you already have ${currentCount} file${currentCount === 1 ? "" : "s"} selected.`,
      );
      return false;
    }

    return true;
  }

  // ── File selection handlers ───────────────────────────────────────────────

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    if (isReupload) {
      const file = files[0];
      if (!validateSingleFile(file)) return;
      setUploadedFile({
        file,
        progress: 0,
        id: Math.random().toString(36).slice(2, 11),
      });
    } else {
      if (!validateAllowedDocumentLimit(files.length)) return;
      const validFiles = files.filter(validateSingleFile);
      const newFiles: UploadedFile[] = validFiles.map((file) => ({
        file,
        progress: 0,
        id: Math.random().toString(36).slice(2, 11),
      }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isUploading && !isUploadZoneDisabled) {
      setIsDragOver(true);
    }
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
      toast.error("Please select a document type first");
      return;
    }

    const files = Array.from(event.dataTransfer.files);

    if (isReupload && files.length > 1) {
      toast.error("Please drop only one file for reupload.");
      return;
    }

    const fakeEvent = {
      target: { files },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    handleFileSelect(fakeEvent);
  };

  // ── Upload helpers ────────────────────────────────────────────────────────

  const getDocumentCategory = (category: string): string => {
    if (
      category.includes("Documents") &&
      ![
        "Identity Documents",
        "Education Documents",
        "Other Documents",
        "Self Employment/Freelance",
      ].includes(category)
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
      ![
        "Identity Documents",
        "Education Documents",
        "Other Documents",
        "Self Employment/Freelance",
      ].includes(apiCategory)
    ) {
      return apiCategory;
    }

    return reverseMap[apiCategory] ?? apiCategory;
  };

  const getCompanyDescription = (category: string): string => {
    const docs = uploadProps?.documents;

    if (docs && docs.length > 0) {
      const existingDoc = docs.find(
        (doc: ApiDocument) =>
          doc.document_category === category && doc.description,
      );
      if (existingDoc?.description) return existingDoc.description;
    }

    const company = uploadProps?.company;
    if (
      company &&
      category.includes("Documents") &&
      !["Identity Documents", "Education Documents", "Other Documents"].includes(
        category,
      )
    ) {
      if (company.description) return company.description;
      if (company.isCurrentEmployment) {
        return generateCurrentEmploymentDescription(
          company.name,
          company.fromDate,
        );
      }
      if (company.toDate) {
        return generatePastEmploymentDescription(
          company.name,
          company.fromDate,
          company.toDate,
        );
      }
      return generateCompanyDescription(
        company.fromDate,
        company.toDate ?? "2025-12-31",
      );
    }

    return "";
  };

  // Prefer non-empty _id, then non-empty lead_id; in client view fall back to applicationId
  const getClientId = (): string | undefined => {
    const a = user?._id?.trim();
    const b = user?.lead_id?.trim();
    if (a) return a;
    if (b) return b;
    if (isClientView && applicationId?.trim()) return applicationId.trim();
    return undefined;
  };

  // ── Submit handlers ───────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!effectiveDocumentType || uploadedFiles.length === 0) {
      toast.error("Please upload at least one file.");
      return;
    }

    if (!user?.username) {
      toast.error("User information not available. Please login again.");
      return;
    }

    const totalSize = uploadedFiles.reduce((sum, f) => sum + f.file.size, 0);
    if (totalSize > 50 * 1024 * 1024) {
      toast.error(
        `Total file size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds the maximum limit of 50MB.`,
      );
      return;
    }

    if (uploadedFiles.length > 10) {
      toast.error("Maximum 10 files can be uploaded at once.");
      return;
    }

    const clientId = getClientId();
    if (isClientView && !clientId) {
      toast.error("Client information not available. Please login again.");
      return;
    }

    setIsUploading(true);

    try {
      const progressInterval = window.setInterval(() => {
        setUploadedFiles((prev) =>
          prev.map((f) => ({ ...f, progress: Math.min(f.progress + 5, 90) })),
        );
      }, 200);

      try {
        const finalDescription =
          getCompanyDescription(effectiveCategory) || description;
        const finalCategory = getDocumentCategory(effectiveCategory);

        const uploadResult = isClientView
          ? await clientUploadDocumentMutation.mutateAsync({
            clientId: clientId!,
            files: uploadedFiles.map((uf) => uf.file),
            document_name: effectiveDocumentType,
            document_category: finalCategory,
            uploaded_by: user.username,
            description: finalDescription,
            document_type: effectiveDocumentType
              .toLowerCase()
              .replace(/\s+/g, "_"),
          })
          : await addDocumentMutation.mutateAsync({
            applicationId,
            files: uploadedFiles.map((uf) => uf.file),
            document_name: effectiveDocumentType,
            document_category: finalCategory,
            uploaded_by: user.username,
            description: finalDescription,
            document_type: effectiveDocumentType
              .toLowerCase()
              .replace(/\s+/g, "_"),
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
              uploaded_by: user.username,
              status: "pending" as const,
              history: [],
              uploaded_at: doc.uploaded_at,
              comments: [],
              __v: 0,
              document_type: effectiveDocumentType
                .toLowerCase()
                .replace(/\s+/g, "_"),
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
                data: {
                  ...oldData.data,
                  documents: [...oldData.data.documents, ...newDocuments],
                },
              };
            },
          );

          queryClient.setQueryData(
            ["client-documents-all"],
            (oldData: { data?: { documents?: unknown[] } } | undefined) => {
              if (!oldData?.data?.documents) return oldData;
              return {
                ...oldData,
                data: {
                  ...oldData.data,
                  documents: [...oldData.data.documents, ...newDocuments],
                },
              };
            },
          );

          setTimeout(() => {
            queryClient.invalidateQueries({
              queryKey: ["application-documents", applicationId],
            });
            queryClient.invalidateQueries({
              queryKey: ["application-documents-all", applicationId],
            });
            queryClient.invalidateQueries({ queryKey: ["client-documents"] });
            queryClient.invalidateQueries({
              queryKey: ["client-documents-all"],
            });
          }, 100);
        }
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }

      toast.success("All documents uploaded successfully!");
      onClose();
      uploadProps?.onSuccess?.();

      setSelectedDocumentType("");
      setSelectedDocumentCategory("");
      setUploadedFiles([]);
    } catch (error) {
      setUploadedFiles((prev) => prev.map((f) => ({ ...f, progress: 0 })));
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to upload documents: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReupload = async () => {
    if (!uploadedFile || !displayDocument || !user?.username) {
      toast.error(
        "Please select a file and ensure user information is available.",
      );
      return;
    }

    const clientId = getClientId();
    if (isClientView && !clientId) {
      toast.error("Client information not available. Please login again.");
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
            uploaded_by: user.username,
          });
        } else {
          await reuploadMutation.mutateAsync({
            applicationId,
            documentId: displayDocument._id,
            file: uploadedFile.file,
            document_name: effectiveDocumentType,
            document_category: effectiveCategory,
            uploaded_by: user.username,
          });
        }

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
    if (isReupload) {
      void handleReupload();
    } else {
      void handleUpload();
    }
  };

  const isSubmitDisabled = isReupload
    ? !uploadedFile || isUploading
    : !effectiveDocumentType || uploadedFiles.length === 0 || isUploading;

  // ── Upload zone styles ────────────────────────────────────────────────────
  const uploadZoneClasses = [
    "rounded-xl border-2 border-dashed p-8 text-center transition-all duration-150 select-none outline-none",
    isUploading || (!isReupload && isUploadZoneDisabled)
      ? "cursor-not-allowed border-muted-foreground/20 bg-muted/20"
      : isReupload
        ? isDragOver
          ? "cursor-copy border-border/80 bg-muted/20"
          : "cursor-pointer border-border/50 bg-muted/5 hover:border-border/70 hover:bg-muted/10"
        : isDragOver
          ? "cursor-copy border-primary/80 bg-primary/15"
          : "cursor-pointer border-primary/50 bg-primary/5 hover:border-primary/70 hover:bg-primary/10",
  ].join(" ");

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent
          className="flex h-auto max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl rounded-2xl"
          showCloseButton
        >
          {/* ── Fixed Header ─────────────────────────────────────────────── */}
          <DialogHeader className="shrink-0 border-b border-border/80 bg-muted/30 px-6 pr-12 py-4">
            <DialogTitle className="flex items-center gap-2.5 font-medium tracking-tight text-foreground">
              {isReupload ? (
                <>
                  Reupload document
                </>
              ) : (
                <>
                  Upload documents
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* ── Scrollable Content ───────────────────────────────────────── */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-4">

            {/* Instruction banner */}
            {instruction?.trim() ? (
              <div className="rounded-md border border-border/80 bg-muted/20 px-2 py-2">
                <strong>Note:</strong> {instruction}
              </div>
            ) : null}

            {/* Document info card */}
            {(effectiveDocumentType || (isReupload && displayDocument)) ? (
              <section className="rounded-md border border-border/80 bg-muted/20 p-2">
                {isReupload && displayDocument ? (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Replacing
                    </p>
                    <p className="mt-1 truncate font-medium text-foreground">
                      {displayDocument.file_name}
                    </p>
                    <dl className="mt-3 space-y-1 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">
                          Type:
                        </span>{" "}
                        {effectiveDocumentType}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">
                          Category:
                        </span>{" "}
                        {effectiveCategory}
                      </div>
                    </dl>
                  </>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Document type
                      </p>
                      <p className="mt-1 font-medium text-foreground">
                        {effectiveDocumentType}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-border/60 bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {documentMeta?.allowedDocument !== undefined
                        ? `Max ${documentMeta.allowedDocument} file${documentMeta.allowedDocument === 1 ? "" : "s"}`
                        : "Multiple files allowed"}
                    </span>
                  </div>
                )}
              </section>
            ) : null}

            {/* Rejection reason — reupload only */}
            {isReupload && displayDocument?.reject_message ? (
              <div className="rounded-lg border border-red-200/80 bg-red-50/80 px-3 py-2.5 text-xs text-red-800">
                <strong>Rejection reason:</strong>{" "}
                {displayDocument.reject_message}
              </div>
            ) : null}

            {/* Important note alert */}
            {documentMeta?.importantNote ? (
              <Alert className="border-amber-200/80 bg-amber-50/80 text-amber-900">
                <AlertCircle className="h-4 w-4 text-amber-600" />
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

            {/* ★ Prominent Sample Document Card */}
            {hasSample ? (
              <section className="rounded-md border border-violet-200/80 px-2 py-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100">
                    <FileCheck className="h-5 w-5 text-violet-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Sample document available
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      View a reference template before uploading your{" "}
                      <span className="font-medium">{effectiveDocumentType}</span>.
                      This helps ensure your document meets the required format.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3 gap-1.5 border-violet-300 text-violet-700 hover:border-violet-400 hover:bg-violet-100 focus-visible:ring-violet-400/30"
                      onClick={() => setSampleModalOpen(true)}
                    >
                      View sample document
                    </Button>
                  </div>
                </div>
              </section>
            ) : null}

            {/* Upload zone */}
            <section className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                {isReupload
                  ? "Select new file to replace the rejected document"
                  : "Upload files"}
              </p>
              <div
                className={uploadZoneClasses}
                role="button"
                tabIndex={
                  isUploading || (!isReupload && isUploadZoneDisabled) ? -1 : 0
                }
                aria-label={
                  isReupload
                    ? "Drop your replacement file here or click to browse"
                    : isUploadZoneDisabled
                      ? "Please select a document type first"
                      : "Drop your files here or click to browse"
                }
                onClick={() => {
                  if (!isUploading && !isUploadZoneDisabled) {
                    fileInputRef.current?.click();
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !isUploading &&
                    !isUploadZoneDisabled
                  ) {
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
                  accept={fileAcceptAttribute}
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading || (!isReupload && isUploadZoneDisabled)}
                  aria-label="Choose file to upload"
                />

                <div
                  className={[
                    "mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                    isReupload ? "bg-gray-100" : "bg-gray-100",
                  ].join(" ")}
                >
                  {isReupload ? (
                    <RotateCcw
                      className={[
                        "h-6 w-6 transition-colors",
                        isUploading
                          ? "text-muted-foreground/40"
                          : "text-foreground",
                      ].join(" ")}
                    />
                  ) : (
                    <Upload
                      className={[
                        "h-6 w-6 transition-colors",
                        isUploadZoneDisabled
                          ? "text-muted-foreground/40"
                          : "text-foreground",
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
                <p className="mt-1 text-xs text-muted-foreground">
                  {fileHintText}
                </p>
              </div>
            </section>

            {/* Files list */}
            {filesArray.length > 0 && (
              <section className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {isReupload
                    ? "File to upload"
                    : `Files to upload (${filesArray.length})`}
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
                          setUploadedFiles((prev) =>
                            prev.filter((f) => f.id !== uf.id),
                          );
                        }
                      }}
                    />
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* ── Fixed Footer ─────────────────────────────────────────────── */}
          <DialogFooter className="shrink-0 flex-row items-center gap-2 border-t border-border/80 bg-muted/20 px-6 py-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              className="min-w-20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className={[
                "min-w-36 gap-2",
                isReupload
                  ? "bg-primary-blue text-white hover:bg-primary-blue/90 focus-visible:ring-primary-blue/30"
                  : "",
              ].join(" ")}
            >
              {isUploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {isReupload ? "Reuploading…" : "Uploading…"}
                </>
              ) : isReupload ? (
                <>
                  Reupload document
                </>
              ) : (
                <>
                  Upload documents
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SampleDocumentModal
        isOpen={sampleModalOpen}
        onClose={() => setSampleModalOpen(false)}
        documentType={effectiveDocumentType}
        category={effectiveCategory}
        samplePath=""
      />
    </>
  );
}
