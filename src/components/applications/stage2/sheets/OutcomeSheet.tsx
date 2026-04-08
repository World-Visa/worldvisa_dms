"use client";

import React, { useState, useRef, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, FileText, File, Plus } from "lucide-react";
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
import { Combobox } from "@/components/ui/combobox";
import {
  ANZSCO_CODES,
  getAnzscoCodeByCode,
} from "@/lib/constants/australianData";
import TruncatedText from "@/components/ui/truncated-text";

interface UploadedFile {
  file: File;
  id: string;
}

export function OutcomeSheet({
  isOpen,
  onClose,
  applicationId,
  document,
  mode = "create",
}: OutcomeSheetProps) {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const [outcomeDate, setOutcomeDate] = useState<Date | undefined>(undefined);
  const [outcome, setOutcome] = useState("");
  const [selectedAnzscoCode, setSelectedAnzscoCode] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customAnzscoCode, setCustomAnzscoCode] = useState("");
  const [customAnzscoName, setCustomAnzscoName] = useState("");
  const [customAssessingAuthority, setCustomAssessingAuthority] = useState("");
  const [availableOptions, setAvailableOptions] = useState(
    ANZSCO_CODES.map((code) => ({
      value: code.anzsco_code,
      label: `${code.anzsco_code} - ${code.name} (${code.assessing_authority})`,
    })),
  );
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [stripProgress, setStripProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadStage2Document();
  const updateMutation = useUpdateStage2Document();

  useEffect(() => {
    if (mode === "edit" && document) {
      setOutcomeDate(
        document.outcome_date ? new Date(document.outcome_date) : undefined,
      );
      setOutcome(document.outcome || "");
      const skillBody = document.skill_assessing_body || "";
      if (skillBody) {
        const matchingCode = getAnzscoCodeByCode(skillBody);
        if (matchingCode) {
          setSelectedAnzscoCode(skillBody);
        } else {
          setSelectedAnzscoCode(skillBody);
          setAvailableOptions((prev) => {
            const exists = prev.some((opt) => opt.value === skillBody);
            if (!exists) {
              return [
                ...prev,
                { value: skillBody, label: `Custom - ${skillBody}` },
              ];
            }
            return prev;
          });
        }
      } else {
        setSelectedAnzscoCode("");
      }

      setIsCustomMode(false);
      setCustomAnzscoCode("");
      setCustomAnzscoName("");
      setCustomAssessingAuthority("");
    } else {
      setOutcomeDate(undefined);
      setOutcome("");
      setSelectedAnzscoCode("");
      setIsCustomMode(false);
      setCustomAnzscoCode("");
      setCustomAnzscoName("");
      setCustomAssessingAuthority("");
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

  const handleAddCustomAnzscoCode = () => {
    if (
      customAnzscoCode.trim() &&
      customAnzscoName.trim() &&
      customAssessingAuthority.trim()
    ) {
      const customCode = customAnzscoCode.trim();
      const customName = customAnzscoName.trim();
      const customAuthority = customAssessingAuthority.trim();

      if (!availableOptions.some((opt) => opt.value === customCode)) {
        setAvailableOptions((prev) => [
          ...prev,
          {
            value: customCode,
            label: `${customCode} - ${customName} (${customAuthority})`,
          },
        ]);
      }
      setSelectedAnzscoCode(customCode);
      setCustomAnzscoCode("");
      setCustomAnzscoName("");
      setCustomAssessingAuthority("");
      setIsCustomMode(false);
    }
  };

  const handleToggleCustomMode = () => {
    setIsCustomMode(!isCustomMode);
    setCustomAnzscoCode("");
    setCustomAnzscoName("");
    setCustomAssessingAuthority("");
    if (!isCustomMode) {
      setSelectedAnzscoCode("");
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

    if (mode === "create" && uploadedFiles.length === 0) {
      toast.error("Please upload at least one file.");
      return;
    }

    if (!user?.username) {
      toast.error("User information not available. Please login again.");
      return;
    }

    setIsUploading(true);
    setStripProgress(0);

    const anzscoCodeValue = selectedAnzscoCode || undefined;

    try {
      if (mode === "edit" && document) {
        await updateMutation.mutateAsync({
          applicationId,
          documentId: document._id,
          metadata: {
            document_name: document.file_name,
            outcome_date: formattedOutcomeDate,
            outcome,
            skill_assessing_body: anzscoCodeValue,
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
            skill_assessing_body: anzscoCodeValue,
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
    setIsCustomMode(false);
    setCustomAnzscoCode("");
    setCustomAnzscoName("");
    setCustomAssessingAuthority("");
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
      <SheetContent className="flex h-full max-h-dvh flex-col gap-0 p-0 sm:max-w-lg">
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
                <div className="grid grid-cols-1 gap-1 w-full sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="outcome"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Outcome *
                    </Label>
                    <Select
                      value={outcome}
                      onValueChange={setOutcome}
                      disabled={isUploading}
                    >
                      <SelectTrigger id="outcome" className="h-9 w-full">
                        <SelectValue placeholder="Select outcome" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Skill Assessment Outcome">
                          Skill Assessment Outcome
                        </SelectItem>
                        <SelectItem value="APHRA">APHRA</SelectItem>
                        <SelectItem value="ECA">ECA</SelectItem>
                        <SelectItem value="Visa grant">Visa grant</SelectItem>
                        <SelectItem value="License/ Registration">
                          License/ Registration
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="outcome-date"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Outcome Date *
                    </Label>
                    <DatePicker
                      value={outcomeDate}
                      onChange={setOutcomeDate}
                      placeholder="Select outcome date"
                      disabled={isUploading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Skill Assessing Body (ANZSCO Code)
                  </Label>
                  {!isCustomMode ? (
                    <div className="space-y-1.5">
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
                          <span className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-background px-2 text-muted-foreground">
                            or
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={handleToggleCustomMode}
                        disabled={isUploading}
                        className="h-auto p-0 text-xs font-normal text-muted-foreground underline underline-offset-2 hover:text-foreground"
                      >
                        Add new ANZSCO code
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="custom-anzsco-code"
                            className="text-xs font-medium text-muted-foreground"
                          >
                            ANZSCO Code *
                          </Label>
                          <Input
                            id="custom-anzsco-code"
                            type="text"
                            placeholder="e.g., 121111"
                            value={customAnzscoCode}
                            onChange={(e) => setCustomAnzscoCode(e.target.value)}
                            disabled={isUploading}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="custom-assessing-authority"
                            className="text-xs font-medium text-muted-foreground"
                          >
                            Assessing Authority *
                          </Label>
                          <Input
                            id="custom-assessing-authority"
                            type="text"
                            placeholder="e.g., VETASSESS"
                            value={customAssessingAuthority}
                            onChange={(e) =>
                              setCustomAssessingAuthority(e.target.value)
                            }
                            disabled={isUploading}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="custom-anzsco-name"
                          className="text-xs font-medium text-muted-foreground"
                        >
                          Occupation Name *
                        </Label>
                        <Input
                          id="custom-anzsco-name"
                          type="text"
                          placeholder="e.g., Aquaculture Farmer"
                          value={customAnzscoName}
                          onChange={(e) => setCustomAnzscoName(e.target.value)}
                          disabled={isUploading}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
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
                          disabled={
                            !customAnzscoCode.trim() ||
                            !customAnzscoName.trim() ||
                            !customAssessingAuthority.trim() ||
                            isUploading
                          }
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

                {mode === "create" && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
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
                    <Label className="text-xs font-medium text-muted-foreground">
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
                    <Label className="text-xs font-medium text-muted-foreground">
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
          <div className="flex w-full items-center justify-between gap-3 border-t bg-background px-4 py-2.5">
            <p className="min-w-0 truncate text-xs text-neutral-500">
              Outcome • PDF, Word, or images up to 5MB
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isUploading}
                className="flex items-center gap-2"
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
