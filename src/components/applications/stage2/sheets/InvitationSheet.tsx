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
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { DatePicker } from "@/components/ui/date-picker";
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
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AUSTRALIAN_VISA_SUBCLASSES,
  AUSTRALIAN_STATES,
} from "@/lib/constants/australianData";
import type { InvitationSheetProps } from "@/types/stage2Documents";
import TruncatedText from "@/components/ui/truncated-text";

interface UploadedFile {
  file: File;
  id: string;
}

export function InvitationSheet({
  isOpen,
  onClose,
  applicationId,
  document,
  mode = "create",
}: InvitationSheetProps) {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const [subclass, setSubclass] = useState("");
  const [state, setState] = useState("");
  const [point, setPoint] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [stripProgress, setStripProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadStage2Document();
  const updateMutation = useUpdateStage2Document();

  const subclassOptions = AUSTRALIAN_VISA_SUBCLASSES.filter((s) =>
    ["189", "190", "491"].includes(s.code),
  ).map((s) => ({
    value: s.code,
    label: s.label,
  }));

  const stateOptions = AUSTRALIAN_STATES.map((s) => ({
    value: s.code,
    label: `${s.code} - ${s.name}`,
  }));

  const pointOptions = Array.from(
    { length: Math.floor((110 - 65) / 5) + 1 },
    (_, index) => (65 + index * 5).toString(),
  );

  useEffect(() => {
    if (mode === "edit" && document) {
      setSubclass(document.subclass || "");
      setState(document.state || "");
      setPoint(document.point?.toString() || "");
      setDate(document.date ? new Date(document.date) : undefined);
      setDeadlineDate(
        document.deadline ? new Date(document.deadline) : undefined,
      );
    } else {
      setSubclass("");
      setState("");
      setPoint("");
      setDate(undefined);
      setDeadlineDate(undefined);
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
    if (!subclass) {
      toast.error("Please select a subclass.");
      return;
    }

    if (!state) {
      toast.error("Please select a state.");
      return;
    }

    if (!point) {
      toast.error("Please select points.");
      return;
    }

    if (!date) {
      toast.error("Please select a date.");
      return;
    }

    if (!deadlineDate) {
      toast.error("Please select a deadline date.");
      return;
    }

    const formattedDate = format(date, "yyyy-MM-dd");
    const formattedDeadlineDate = format(deadlineDate, "yyyy-MM-dd");

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

    try {
      if (mode === "edit" && document) {
        await updateMutation.mutateAsync({
          applicationId,
          documentId: document._id,
          metadata: {
            document_name: document.file_name,
            subclass,
            state,
            point: Number(point),
            date: formattedDate,
            deadline: formattedDeadlineDate,
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
            type: "invitation",
            subclass,
            state,
            point: Number(point),
            date: formattedDate,
            deadline: formattedDeadlineDate,
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
    setSubclass("");
    setState("");
    setPoint("");
    setDate(undefined);
    setDeadlineDate(undefined);
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
    mode === "edit" ? "Edit Invitation Document" : "Create Invitation Document";

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
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Subclass *
                  </Label>
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

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                      State *
                    </Label>
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

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="point"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Points *
                    </Label>
                    <Select
                      value={point}
                      onValueChange={setPoint}
                      disabled={isUploading}
                    >
                      <SelectTrigger id="point" className="h-9 w-full">
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
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="date"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Date *
                    </Label>
                    <DatePicker
                      value={date}
                      onChange={setDate}
                      placeholder="Select date"
                      disabled={isUploading}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="deadline-date"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Deadline *
                    </Label>
                    <DatePicker
                      value={deadlineDate}
                      onChange={setDeadlineDate}
                      placeholder="Select deadline date"
                      disabled={isUploading}
                    />
                  </div>
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
                <span>Uploading invitation…</span>
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
              Invitation • PDF, Word, or images up to 5MB
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
