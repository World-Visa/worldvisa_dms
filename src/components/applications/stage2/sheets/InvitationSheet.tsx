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
import { Button } from "@/components/ui/button";
import { Button as SheetFooterButton } from "@/components/ui/primitives/button";
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
  useReuploadStage2Document,
} from "@/hooks/useStage2Documents";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnzscoCombobox } from "@/components/ui/anzsco-combox";
import {
  AUSTRALIAN_VISA_SUBCLASSES,
  AUSTRALIAN_STATES,
  getAnzscoCodeByCode,
} from "@/lib/constants/australianData";
import type { InvitationSheetProps } from "@/types/stage2Documents";
import TruncatedText from "@/components/ui/truncated-text";
import {
  INVITATION_TYPE_OPTIONS,
  INVITATION_TYPE_STATE_NOMINATION,
  computeInvitationExpiryDate,
  formatInvitationExpiryForApi,
  formatInvitationExpiryForPatch,
  getInvitationExpiryOffsetDays,
} from "@/lib/stage2/invitationExpiry";

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
  const sheetContainerRef = useRef<HTMLDivElement>(null);
  const [subclass, setSubclass] = useState("");
  const [state, setState] = useState("");
  const [point, setPoint] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [invitationType, setInvitationType] = useState(
    INVITATION_TYPE_STATE_NOMINATION,
  );
  const [skillAnzscoCode, setSkillAnzscoCode] = useState("");
  const [extraAnzscoItems, setExtraAnzscoItems] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [stripProgress, setStripProgress] = useState(0);
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadStage2Document();
  const updateMutation = useUpdateStage2Document();
  const reuploadMutation = useReuploadStage2Document();

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
      setInvitationType(
        document.invitation_type?.trim() || INVITATION_TYPE_STATE_NOMINATION,
      );
      const skill = document.skill_assessing_body?.trim() || "";
      setSkillAnzscoCode(skill);
      if (skill && !getAnzscoCodeByCode(skill)) {
        setExtraAnzscoItems([
          { value: skill, label: `${skill} (saved)` },
        ]);
      } else {
        setExtraAnzscoItems([]);
      }
      setReplacementFile(null);
    } else {
      setSubclass("");
      setState("");
      setPoint("");
      setDate(undefined);
      setInvitationType(INVITATION_TYPE_STATE_NOMINATION);
      setSkillAnzscoCode("");
      setExtraAnzscoItems([]);
      setUploadedFiles([]);
      setReplacementFile(null);
    }
  }, [mode, document, isOpen]);

  const computedExpiry = useMemo(() => {
    if (!date || !invitationType) return null;
    return computeInvitationExpiryDate(date, invitationType);
  }, [date, invitationType]);

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

    if (!invitationType) {
      toast.error("Please select an invitation type.");
      return;
    }

    if (!skillAnzscoCode.trim()) {
      toast.error("Please select a skill assessing body (ANZSCO).");
      return;
    }

    const formattedDate = format(date, "yyyy-MM-dd");
    const expiryDate = computeInvitationExpiryDate(date, invitationType);
    if (!expiryDate) {
      toast.error("Could not calculate expiry from the selected date.");
      return;
    }
    const expiryAtCreate = formatInvitationExpiryForApi(expiryDate);
    const expiryAtPatch = formatInvitationExpiryForPatch(expiryDate);
    const skillBody = skillAnzscoCode.trim();

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
        if (replacementFile) {
          await reuploadMutation.mutateAsync({
            applicationId,
            documentId: document._id,
            file: replacementFile,
            file_name: replacementFile.name,
            document_name: replacementFile.name,
            document_type: replacementFile.type,
            uploaded_by: user.username,
            subclass,
            state: document.state,
            point: Number(point),
            date: formattedDate,
            skill_assessing_body: skillBody,
            invitation_type: invitationType,
            expiry_at: expiryAtPatch,
          });
        } else {
          await updateMutation.mutateAsync({
            applicationId,
            documentId: document._id,
            metadata: {
              document_name: document.file_name,
              subclass,
              state,
              point: Number(point),
              date: formattedDate,
              invitation_type: invitationType,
              skill_assessing_body: skillBody,
              expiry_at: expiryAtPatch,
            },
          });
        }
        clearFormState();
        onClose();
        return;
      }

      const stripInterval = window.setInterval(() => {
        setStripProgress((p) => Math.min(p + 5, 90));
      }, 200);

      try {
        await uploadMutation.mutateAsync({
          applicationId,
          files: uploadedFiles.map((uf) => uf.file),
          file_name: uploadedFiles[0].file.name,
          document_name: uploadedFiles[0].file.name,
          document_type: "invitation",
          uploaded_by: user.username,
          type: "invitation",
          subclass,
          state,
          point: Number(point),
          date: formattedDate,
          invitation_type: invitationType,
          skill_assessing_body: skillBody,
          expiry_at: expiryAtCreate,
        });
        setStripProgress(100);
      } finally {
        window.clearInterval(stripInterval);
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
    setInvitationType(INVITATION_TYPE_STATE_NOMINATION);
    setSkillAnzscoCode("");
    setExtraAnzscoItems([]);
    setUploadedFiles([]);
    setReplacementFile(null);
    if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
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

  const handleReplaceFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!validateFile(file)) return;
    setReplacementFile(file);
    event.target.value = "";
  };

  const clearReplacementFile = () => {
    setReplacementFile(null);
    if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
  };

  const title =
    mode === "edit" ? "Edit Invitation Document" : "Create Invitation Document";

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
              {/* Visa information */}
              <div className="space-y-3 px-4 py-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">
                    Subclass *
                  </Label>
                  <Select
                    value={subclass}
                    onValueChange={setSubclass}
                    disabled={isUploading}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Select a subclass…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Subclass</SelectLabel>
                        {subclassOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">
                    State *
                  </Label>
                  {mode === "create" ? (
                    <Select
                      value={state}
                      onValueChange={setState}
                      disabled={isUploading}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="Select a state…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>State / territory</SelectLabel>
                          {stateOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                      {document?.state ? getStateDisplay(document.state) : "N/A"}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">
                    Invitation type *
                  </Label>
                  <Select
                    value={invitationType}
                    onValueChange={setInvitationType}
                    disabled={isUploading}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Select invitation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Invitation</SelectLabel>
                        {INVITATION_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* ANZSCO */}
              <div className="space-y-3 px-4 py-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">
                    ANZSCO
                  </Label>
                  <div className="space-y-1.5">
                    <AnzscoCombobox
                      value={skillAnzscoCode || null}
                      onValueChange={(code) =>
                        setSkillAnzscoCode(code ?? "")
                      }
                      disabled={isUploading}
                      placeholder="Search code, occupation, or assessing authority…"
                      extraItems={extraAnzscoItems}
                      portalContainer={sheetContainerRef.current}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Points & invitation date */}
              <div className="space-y-3 px-4 py-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="point"
                      className="text-xs font-medium text-foreground"
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
                        <SelectGroup>
                          <SelectLabel>Points</SelectLabel>
                          {pointOptions.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="date"
                      className="text-xs font-medium text-foreground"
                    >
                      Invitation date *
                    </Label>
                    <DatePicker
                      value={date}
                      onChange={setDate}
                      placeholder="Select date"
                      disabled={isUploading}
                    />
                    {computedExpiry ? (
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        Expiry (auto):{" "}
                        <span className="font-medium text-foreground">
                          {format(computedExpiry, "MMM d, yyyy")}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {getInvitationExpiryOffsetDays(invitationType)}{" "}
                          days from invitation date
                        </span>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Files */}
              <div className="space-y-3 px-4 py-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {mode === "edit" ? "File" : "Upload Files"}
                </p>

                {mode === "create" && (
                  <div className="space-y-2">
                    <div
                      className="cursor-pointer rounded-lg border border-dashed border-border bg-muted/25 px-4 py-5 text-center transition-colors hover:bg-muted/40"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <Image
                        src="/icons/pdf_icon_modal.svg"
                        alt="Upload"
                        width={56}
                        height={72}
                        className="mx-auto mb-3"
                      />
                      <p className="mb-1 text-xs text-muted-foreground">
                        Drop your files here, or click to browse
                      </p>
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        PDF, Word, or images • Max 5MB per file. Document name =
                        file name.
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}

                {mode === "edit" && document && (
                  <div className="space-y-2">
                    <div className="flex min-w-0 items-center gap-2.5 rounded-lg border bg-muted/50 p-2.5">
                      <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                      <TruncatedText className="min-w-0 flex-1 text-sm font-medium">
                        {document.file_name}
                      </TruncatedText>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Replace with new file
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Optionally choose a new file to replace the current
                        invitation. Same types: PDF, Word, images. Max 5MB.
                      </p>
                      {replacementFile ? (
                        <div className="flex min-w-0 items-center gap-2.5 rounded-lg border border-border bg-muted/30 p-2.5">
                          <FileText className="h-4 w-4 shrink-0" />
                          <TruncatedText className="min-w-0 flex-1 text-sm font-medium">
                            {replacementFile.name}
                          </TruncatedText>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 shrink-0 p-0"
                            onClick={clearReplacementFile}
                            disabled={isUploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer rounded-lg border border-dashed border-border bg-muted/25 px-3 py-3.5 text-center transition-colors hover:bg-muted/40"
                          onClick={() => replaceFileInputRef.current?.click()}
                        >
                          <Upload className="mx-auto mb-1.5 h-7 w-7 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Click to choose a file
                          </p>
                          <input
                            ref={replaceFileInputRef}
                            type="file"
                            onChange={handleReplaceFileSelect}
                            className="hidden"
                          />
                        </div>
                      )}
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
                          {uploadedFile.file.name
                            .toLowerCase()
                            .match(/\.(jpg|jpeg|png)$/) ? (
                            <File className="h-4 w-4 shrink-0 text-green-600" />
                          ) : uploadedFile.file.name
                              .toLowerCase()
                              .match(/\.(doc|docx)$/) ? (
                            <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                          ) : (
                            <Image
                              src="/icons/pdf_small.svg"
                              alt="PDF"
                              width={20}
                              height={20}
                              className="shrink-0"
                            />
                          )}
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
          <div className="flex w-full items-center justify-end gap-3 border-t bg-background px-4 py-2.5">
            <div className="flex shrink-0 items-center gap-2">
              <SheetFooterButton
                variant="secondary"
                mode="outline"
                size="sm"
                onClick={handleClose}
                disabled={isUploading}
                className="text-xs"
              >
                Cancel
              </SheetFooterButton>
              <SheetFooterButton
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
                    {mode === "edit" ? "Update Document" : "Upload Documents"}
                  </>
                )}
              </SheetFooterButton>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function getStateDisplay(code: string): string {
  const state = AUSTRALIAN_STATES.find((s) => s.code === code);
  return state ? `${state.code} - ${state.name}` : code;
}
