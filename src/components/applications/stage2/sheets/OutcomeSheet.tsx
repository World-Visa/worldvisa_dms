"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetMain,
  SheetTitle,
} from "@/components/ui/primitives/sheet";
import { Button } from "@/components/ui/primitives/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/primitives/select";
import { Upload, X, FileText, File } from "lucide-react";
import Image from "next/image";
import { RiFileAddLine, RiFileEditLine } from "react-icons/ri";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import {
  useUploadStage2Document,
  useUpdateStage2Document,
} from "@/hooks/useStage2Documents";
import type { OutcomeSheetProps } from "@/types/stage2Documents";
import { AnzscoCombobox } from "@/components/ui/anzsco-combox";
import { DatePicker } from "@/components/ui/date-picker";
import { getAnzscoCodeByCode } from "@/lib/constants/australianData";
import {
  computeOutcomeExpiryDate,
  formatOutcomeExpiryForApi,
  getOutcomeExpiryDisplayParts,
} from "@/lib/stage2/outcomeExpiry";
import TruncatedText from "@/components/ui/truncated-text";
import { formatDate } from "@/utils/format";

interface UploadedFile {
  file: File;
  id: string;
}

const ENGLISH_LANGUAGE_TEST_OPTIONS = [
  { value: "IELTS", label: "IELTS" },
  { value: "TOEFL", label: "TOEFL" },
  { value: "PTE", label: "PTE" },
  { value: "CELPI", label: "CELPI" },
];

const OUTCOME_OPTIONS = [
  { value: "English Language Test", label: "English Language Test" },
  { value: "Skill Assessment Outcome", label: "Skill Assessment Outcome" },
  { value: "APHRA", label: "APHRA" },
  { value: "ECA", label: "ECA" },
  { value: "Visa grant", label: "Visa grant" },
  { value: "License/ Registration(ROI)", label: "License/ Registration(ROI)" },
];

export function OutcomeSheet({
  isOpen,
  onClose,
  applicationId,
  document,
  mode = "create",
}: OutcomeSheetProps) {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const sheetContainerRef = useRef<HTMLDivElement>(null);
  const [outcomeDate, setOutcomeDate] = useState<Date | undefined>(undefined);
  const [outcome, setOutcome] = useState("");
  const [selectedAnzscoCode, setSelectedAnzscoCode] = useState("");
  /** IELTS / PTE / etc. when outcome is English Language Test — persisted as language_assessing_body */
  const [englishLanguageTest, setEnglishLanguageTest] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [stripProgress, setStripProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadStage2Document();
  const updateMutation = useUpdateStage2Document();

  const anzscoExtraItems = useMemo(() => {
    if (mode !== "edit" || !document?.skill_assessing_body) return undefined;
    const raw = document.skill_assessing_body.trim();
    if (!raw) return undefined;
    if (getAnzscoCodeByCode(raw)) return undefined;
    return [{ value: raw, label: `Custom - ${raw}` }];
  }, [mode, document]);

  const computedExpiry = useMemo(() => {
    if (!outcomeDate || !outcome.trim()) return null;
    return computeOutcomeExpiryDate({
      outcome,
      outcome_date: format(outcomeDate, "yyyy-MM-dd"),
      skill_assessing_body:
        outcome !== "English Language Test" ? selectedAnzscoCode : undefined,
    });
  }, [outcomeDate, outcome, selectedAnzscoCode]);

  const expiryDisplayText = useMemo(() => {
    if (!outcomeDate || !outcome.trim()) return "N/A";
    const parts = getOutcomeExpiryDisplayParts({
      outcome,
      outcome_date: format(outcomeDate, "yyyy-MM-dd"),
      skill_assessing_body:
        outcome !== "English Language Test" ? selectedAnzscoCode : undefined,
    });
    if (!parts) return "N/A";
    return `${formatDate(parts.date, "short")} (${parts.periodLabel})`;
  }, [outcomeDate, outcome, selectedAnzscoCode]);

  useEffect(() => {
    if (mode === "edit" && document) {
      setOutcomeDate(
        document.outcome_date ? new Date(document.outcome_date) : undefined,
      );
      const docOutcome = document.outcome || "";
      setOutcome(docOutcome);
      if (docOutcome === "English Language Test") {
        setEnglishLanguageTest(document.language_assessing_body?.trim() || "");
        setSelectedAnzscoCode("");
      } else {
        setEnglishLanguageTest("");
        const skillBody = document.skill_assessing_body || "";
        setSelectedAnzscoCode(skillBody || "");
      }
    } else {
      setOutcomeDate(undefined);
      setOutcome("");
      setSelectedAnzscoCode("");
      setEnglishLanguageTest("");
      setUploadedFiles([]);
    }
  }, [mode, document, isOpen]);

  const validateFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    const allowedExtensions = [
      ".pdf",
      ".doc",
      ".docx",
      ".jpg",
      ".jpeg",
      ".png",
    ];
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    const hasValidExtension = allowedExtensions.some((ext) =>
      fileName.endsWith(ext),
    );
    if (!hasValidExtension) {
      toast.error(
        `${file.name} is not a supported file type. Only PDF, Word (.doc, .docx), and image files (.jpg, .jpeg, .png) are allowed.`,
      );
      return false;
    }

    if (!allowedMimeTypes.includes(file.type)) {
      toast.error(
        `${file.name} has an unsupported MIME type. Only PDF, Word, and image files are allowed.`,
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
      id: Math.random().toString(36).substr(2, 9),
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
      id: Math.random().toString(36).substr(2, 9),
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleSubmit = async () => {
    if (!outcomeDate) {
      toast.error("Please select an outcome date.");
      return;
    }

    if (!outcome.trim()) {
      toast.error("Please select an outcome.");
      return;
    }

    const formattedOutcomeDate = format(outcomeDate, "yyyy-MM-dd");
    const expiryAt =
      computedExpiry != null ? formatOutcomeExpiryForApi(computedExpiry) : undefined;

    if (mode === "create" && uploadedFiles.length === 0) {
      toast.error("Please upload at least one file.");
      return;
    }

    if (!user?.username) {
      toast.error("User information not available. Please login again.");
      return;
    }

    if (outcome === "English Language Test") {
      if (!englishLanguageTest.trim()) {
        toast.error("Please select an English language test.");
        return;
      }
    }

    setIsUploading(true);
    setStripProgress(0);

    const skillForApi =
      outcome !== "English Language Test"
        ? selectedAnzscoCode || undefined
        : undefined;
    const languageForApi =
      outcome === "English Language Test"
        ? englishLanguageTest.trim()
        : undefined;

    try {
      if (mode === "edit" && document) {
        await updateMutation.mutateAsync({
          applicationId,
          documentId: document._id,
          metadata: {
            document_name: document.file_name,
            outcome_date: formattedOutcomeDate,
            outcome,
            ...(skillForApi !== undefined
              ? { skill_assessing_body: skillForApi }
              : {}),
            ...(languageForApi !== undefined
              ? { language_assessing_body: languageForApi }
              : {}),
            ...(expiryAt ? { expiry_at: expiryAt } : {}),
          },
        });
      } else {
        const stripInterval = window.setInterval(() => {
          setStripProgress((p) => Math.min(p + 5, 90));
        }, 200);

        try {
          await uploadMutation.mutateAsync({
            applicationId,
            files: uploadedFiles.map((uf) => uf.file),
            file_name: uploadedFiles[0].file.name,
            document_name: uploadedFiles[0].file.name,
            document_type: uploadedFiles[0].file.type,
            uploaded_by: user.username,
            type: "outcome",
            outcome_date: formattedOutcomeDate,
            outcome,
            ...(skillForApi !== undefined
              ? { skill_assessing_body: skillForApi }
              : {}),
            ...(languageForApi !== undefined
              ? { language_assessing_body: languageForApi }
              : {}),
            ...(expiryAt ? { expiry_at: expiryAt } : {}),
          });
          setStripProgress(100);
        } finally {
          window.clearInterval(stripInterval);
        }
      }

      clearFormState();
      onClose();
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsUploading(false);
      setStripProgress(0);
    }
  };

  function clearFormState() {
    setOutcomeDate(undefined);
    setOutcome("");
    setSelectedAnzscoCode("");
    setEnglishLanguageTest("");
    setUploadedFiles([]);
  }

  const handleClose = () => {
    if (!isUploading) {
      clearFormState();
      onClose();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) handleClose();
  };

  const title =
    mode === "edit" ? "Edit Outcome Document" : "Create Outcome Document";

  const showStrip = mode === "create" && isUploading;

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        ref={sheetContainerRef}
        className="flex h-full max-h-dvh flex-col gap-0 p-0 sm:max-w-lg"
      >
        <SheetHeader className="p-0">
          <SheetTitle className="sr-only">{title}</SheetTitle>
          <header className="flex h-11 shrink-0 items-center gap-3 border-b px-4 pr-12">
            {mode === "create" ? (
              <RiFileAddLine className="size-[18px] shrink-0 text-neutral-500" />
            ) : (
              <RiFileEditLine className="size-[18px] shrink-0 text-neutral-500" />
            )}
            <span className="flex-1 truncate text-sm font-semibold text-neutral-900">
              {title}
            </span>
          </header>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <SheetMain className="min-h-0 flex-1 overflow-hidden p-0">
            <motion.div
              key={`${isOpen}-${mode}-${document?._id ?? "new"}`}
              className="h-full overflow-y-auto"
              initial={reduceMotion ? false : { opacity: 0.97, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="space-y-4 p-4 pb-5">
                <div className="flex flex-wrap gap-2">
                  <div className="space-y-1.5 flex-1">
                    <Label
                      htmlFor="outcome"
                      className="text-xs font-medium text-foreground"
                    >
                      Outcome *
                    </Label>
                    <Select
                      value={outcome}
                      onValueChange={(value) => {
                        setOutcome(value);
                        if (value === "English Language Test") {
                          setSelectedAnzscoCode("");
                        } else {
                          setEnglishLanguageTest("");
                        }
                      }}
                      disabled={isUploading}
                    >
                      <SelectTrigger id="outcome" className="h-9 w-full">
                        <SelectValue placeholder="Select outcome" />
                      </SelectTrigger>
                      <SelectContent className="text-neutral-900">
                        {OUTCOME_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-neutral-900">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">
                      Outcome date *
                    </Label>
                    <DatePicker
                      value={outcomeDate}
                      onChange={setOutcomeDate}
                      placeholder="Select outcome date"
                      disabled={isUploading}
                    />
                  </div>
                </div>

                {outcome && outcomeDate ? (
                  <div className="space-y-1.5 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Expiry date (calculated)
                    </Label>
                    <p className="text-sm font-medium text-foreground">
                      {expiryDisplayText}
                    </p>
                  </div>
                ) : null}

                {outcome !== "English Language Test" ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">
                      Skill Assessing Body (ANZSCO Code)
                    </Label>
                    <div className="space-y-1.5">
                      <AnzscoCombobox
                        value={selectedAnzscoCode}
                        onValueChange={(code) =>
                          setSelectedAnzscoCode(code ?? "")
                        }
                        placeholder="Select ANZSCO code..."
                        disabled={isUploading}
                        portalContainer={sheetContainerRef.current}
                        extraItems={anzscoExtraItems}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">
                      English Language Test *
                    </Label>
                    <Select
                      value={englishLanguageTest}
                      onValueChange={setEnglishLanguageTest}
                      disabled={isUploading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select English Language Test" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {ENGLISH_LANGUAGE_TEST_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-neutral-900">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {mode === "create" && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground">
                      Upload Files *
                    </Label>
                    <div
                      className="cursor-pointer rounded-lg border border-dashed border-border bg-muted/25 px-4 py-5 text-center transition-colors hover:bg-muted/40"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <Image
                        src="/icons/pdf_icon_modal.svg"
                        alt="Upload Icon"
                        width={56}
                        height={72}
                        className="mx-auto mb-3"
                      />
                      <p className="mb-1 text-xs text-muted-foreground">
                        Drop your files here, or click to browse
                      </p>
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        <span className="font-medium">
                          PDF, Word, or images
                        </span>{" "}
                        • Max 5MB per file
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

                {mode === "edit" && document && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">
                      Current File
                    </Label>
                    <div className="flex min-w-0 items-center gap-2.5 rounded-lg border bg-muted/50 p-2.5">
                      <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                      <TruncatedText className="min-w-0 flex-1 text-sm font-medium">
                        {document.file_name}
                      </TruncatedText>
                    </div>
                  </div>
                )}

                {mode === "create" && uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground">
                      Files to Upload
                    </Label>
                    <div className="space-y-1.5">
                      {uploadedFiles.map((uploadedFile) => (
                        <div
                          key={uploadedFile.id}
                          className="flex min-w-0 items-center gap-2.5 rounded-lg border border-border/80 bg-muted/20 p-2.5"
                        >
                          {(() => {
                            const fileName = uploadedFile.file.name.toLowerCase();
                            if (
                              fileName.endsWith(".jpg") ||
                              fileName.endsWith(".jpeg") ||
                              fileName.endsWith(".png")
                            ) {
                              return (
                                <File className="h-4 w-4 shrink-0 text-green-600" />
                              );
                            }
                            if (
                              fileName.endsWith(".doc") ||
                              fileName.endsWith(".docx")
                            ) {
                              return (
                                <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                              );
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
                          })()}
                          <div className="min-w-0 flex-1">
                            <TruncatedText className="text-sm font-medium">
                              {uploadedFile.file.name}
                            </TruncatedText>
                            <p className="text-xs text-muted-foreground">
                              {(uploadedFile.file.size / 1024 / 1024).toFixed(2)}{" "}
                              MB
                            </p>
                          </div>
                          {!isUploading && (
                            <Button
                              variant="secondary"
                              mode="ghost"
                              size="2xs"
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
            </motion.div>
          </SheetMain>

          {showStrip && (
            <div className="shrink-0 border-t border-border bg-background px-4 py-2.5">
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>Uploading outcome…</span>
                <span className="font-medium tabular-nums text-foreground">
                  {stripProgress}%
                </span>
              </div>
              <Progress value={stripProgress} className="h-1.5" />
            </div>
          )}
        </div>

        <Separator />

        <SheetFooter className="p-0">
          <div className="flex w-full items-center justify-end gap-3 border-t bg-background px-4 py-2.5">
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="secondary"
                mode="outline"
                size="sm"
                onClick={handleClose}
                disabled={isUploading}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isUploading}
                size="sm"
                mode="filled"
                variant="secondary"
                className="text-xs"
              >
                {isUploading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    {mode === "edit" ? "Updating..." : "Uploading..."}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    {mode === "edit" ? "Update Document" : "Upload Document"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
