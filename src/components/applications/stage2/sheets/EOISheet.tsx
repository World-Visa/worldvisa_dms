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
import { Upload, X, FileText, File, Plus } from "lucide-react";
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
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AUSTRALIAN_VISA_SUBCLASSES,
  AUSTRALIAN_STATES,
  getAnzscoCodeByCode,
} from "@/lib/constants/australianData";
import { AnzscoCombobox } from "@/components/ui/anzsco-combox";
import type { EOISheetProps } from "@/types/stage2Documents";
import TruncatedText from "@/components/ui/truncated-text";
import {
  computeEoiExpiryDate,
  formatEoiExpiryForApi,
  formatEoiExpiryForPatch,
  getEoiExpiryPeriodLabel,
} from "@/lib/stage2/eoiExpiry";
import { formatDate } from "@/utils/format";

interface UploadedFile {
  file: File;
  progress: number;
  id: string;
}

export function EOISheet({
  isOpen,
  onClose,
  applicationId,
  document,
  mode = "create",
}: EOISheetProps) {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const sheetContainerRef = useRef<HTMLDivElement>(null);
  const [subclass, setSubclass] = useState("");
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [point, setPoint] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedAnzscoCode, setSelectedAnzscoCode] = useState("");
  const [isCustomAnzscoMode, setIsCustomAnzscoMode] = useState(false);
  const [customAnzscoCode, setCustomAnzscoCode] = useState("");
  const [customAnzscoName, setCustomAnzscoName] = useState("");
  const [customAssessingAuthority, setCustomAssessingAuthority] = useState("");
  const [extraAnzscoItems, setExtraAnzscoItems] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
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

  const computedExpiry = useMemo(() => computeEoiExpiryDate(date), [date]);

  const expiryDisplayText = useMemo(() => {
    if (!computedExpiry) return "N/A";
    return `${formatDate(computedExpiry, "short")} (${getEoiExpiryPeriodLabel()} from EOI date)`;
  }, [computedExpiry]);

  useEffect(() => {
    if (mode === "edit" && document) {
      setSubclass(document.subclass || "");
      setSelectedStates(document.state ? [document.state] : []);
      setPoint(document.point?.toString() || "");
      setDate(document.date ? new Date(document.date) : undefined);
      const skillBody = document.skill_assessing_body || "";
      if (skillBody) {
        const matchingCode = getAnzscoCodeByCode(skillBody);
        setSelectedAnzscoCode(skillBody);
        if (!matchingCode) {
          setExtraAnzscoItems([
            { value: skillBody, label: `Custom - ${skillBody}` },
          ]);
        } else {
          setExtraAnzscoItems([]);
        }
      } else {
        setSelectedAnzscoCode("");
        setExtraAnzscoItems([]);
      }
      setIsCustomAnzscoMode(false);
      setCustomAnzscoCode("");
      setCustomAnzscoName("");
      setCustomAssessingAuthority("");
      setReplacementFile(null);
    } else {
      setSubclass("");
      setSelectedStates([]);
      setPoint("");
      setDate(undefined);
      setSelectedAnzscoCode("");
      setExtraAnzscoItems([]);
      setIsCustomAnzscoMode(false);
      setCustomAnzscoCode("");
      setCustomAnzscoName("");
      setCustomAssessingAuthority("");
      setUploadedFiles([]);
      setUploadProgress({ current: 0, total: 0 });
      setReplacementFile(null);
    }
  }, [mode, document, isOpen]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newFiles: UploadedFile[] = files.map((file) => ({
      file,
      progress: 0,
      id: Math.random().toString(36).substr(2, 9),
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    const newFiles: UploadedFile[] = files.map((file) => ({
      file,
      progress: 0,
      id: Math.random().toString(36).substr(2, 9),
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleAddCustomAnzsco = () => {
    if (
      customAnzscoCode.trim() &&
      customAnzscoName.trim() &&
      customAssessingAuthority.trim()
    ) {
      const code = customAnzscoCode.trim();
      const name = customAnzscoName.trim();
      const authority = customAssessingAuthority.trim();
      setExtraAnzscoItems((prev) => {
        if (prev.some((o) => o.value === code)) return prev;
        return [
          ...prev,
          { value: code, label: `${code} - ${name} (${authority})` },
        ];
      });
      setSelectedAnzscoCode(code);
      setCustomAnzscoCode("");
      setCustomAnzscoName("");
      setCustomAssessingAuthority("");
      setIsCustomAnzscoMode(false);
    }
  };

  const handleToggleCustomAnzscoMode = () => {
    setIsCustomAnzscoMode(!isCustomAnzscoMode);
    setCustomAnzscoCode("");
    setCustomAnzscoName("");
    setCustomAssessingAuthority("");
    if (!isCustomAnzscoMode) setSelectedAnzscoCode("");
  };

  const handleSubmit = async () => {
    if (!subclass) {
      toast.error("Please select a subclass.");
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
    if (mode === "create") {
      if (selectedStates.length === 0) {
        toast.error("Please select at least one state.");
        return;
      }
      if (uploadedFiles.length === 0) {
        toast.error("Please upload at least one file.");
        return;
      }
    }

    const formattedDate = format(date, "yyyy-MM-dd");
    const anzscoValue = selectedAnzscoCode || undefined;
    const expiryAtApi =
      computedExpiry != null ? formatEoiExpiryForApi(computedExpiry) : undefined;
    const expiryAtPatch =
      computedExpiry != null ? formatEoiExpiryForPatch(computedExpiry) : undefined;

    setIsUploading(true);

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
            uploaded_by: user?.username ?? user?.email ?? "",
            subclass,
            state: document.state,
            point: Number(point),
            date: formattedDate,
            skill_assessing_body: anzscoValue,
            ...(expiryAtPatch ? { expiry_at: expiryAtPatch } : {}),
          });
        } else {
          await updateMutation.mutateAsync({
            applicationId,
            documentId: document._id,
            metadata: {
              document_name: document.file_name,
              subclass,
              state: document.state,
              point: Number(point),
              date: formattedDate,
              skill_assessing_body: anzscoValue,
              ...(expiryAtPatch ? { expiry_at: expiryAtPatch } : {}),
            },
          });
        }
        clearFormState();
        onClose();
        return;
      }

      const total = uploadedFiles.length * selectedStates.length;
      setUploadProgress({ current: 0, total });
      let done = 0;
      const failed: string[] = [];

      for (const uploadedFile of uploadedFiles) {
        const file = uploadedFile.file;
        const documentName = file.name;
        const documentType = file.type;

        for (const stateCode of selectedStates) {
          try {
            await uploadMutation.mutateAsync({
              applicationId,
              files: [file],
              file_name: documentName,
              document_name: documentName,
              document_type: documentType,
              uploaded_by: user?.username ?? user?.email ?? "",
              type: "eoi",
              subclass,
              state: stateCode,
              point: Number(point),
              date: formattedDate,
              skill_assessing_body: anzscoValue,
              ...(expiryAtApi ? { expiry_at: expiryAtApi } : {}),
            });
          } catch {
            failed.push(`${documentName} (${stateCode})`);
          }
          done += 1;
          setUploadProgress({ current: done, total });
        }
      }

      if (failed.length > 0) {
        toast.error(`${failed.length} upload(s) failed. Please try again.`);
      } else {
        clearFormState();
        onClose();
      }
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  function clearFormState() {
    setSubclass("");
    setSelectedStates([]);
    setPoint("");
    setDate(undefined);
    setSelectedAnzscoCode("");
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
    setReplacementFile(file);
    event.target.value = "";
  };

  const clearReplacementFile = () => {
    setReplacementFile(null);
    if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
  };

  const totalUploads = uploadProgress.total;
  const currentUpload = uploadProgress.current;
  const showProgress = mode === "create" && isUploading && totalUploads > 0;

  const title =
    mode === "edit" ? "Edit EOI Document" : "Create EOI Document";

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
              {/* Visa Information */}
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
                    State{mode === "create" ? "s" : ""} *
                  </Label>
                  {mode === "create" ? (
                    <MultiSelect
                      options={stateOptions}
                      value={selectedStates}
                      onChange={setSelectedStates}
                      placeholder="Select state(s)..."
                      disabled={isUploading}
                      portalContainer={sheetContainerRef.current}
                    />
                  ) : (
                    <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                      {document?.state ? getStateDisplay(document.state) : "N/A"}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Skill Assessing Body */}
              <div className="space-y-3 px-4 py-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">
                    ANZSCO
                  </Label>
                  <div className="space-y-1.5">
                    <AnzscoCombobox
                      value={selectedAnzscoCode || null}
                      onValueChange={(code) =>
                        setSelectedAnzscoCode(code ?? "")
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

              {/* Points & Date */}
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
                      Date *
                    </Label>
                    <DatePicker
                      value={date}
                      onChange={setDate}
                      placeholder="Select date"
                      disabled={isUploading}
                    />
                  </div>
                </div>

                {date ? (
                  <div className="space-y-1.5 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Expiry date (calculated)
                    </Label>
                    <p className="text-sm font-medium text-foreground">
                      {expiryDisplayText}
                    </p>
                  </div>
                ) : null}
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
                        Any file type • Max 5MB per file. Document name = file name.
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
                        Optionally choose a new file to replace the current document.
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
                    {uploadedFiles.length > 0 && selectedStates.length > 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        {uploadedFiles.length} file(s) × {selectedStates.length}{" "}
                        state(s) ={" "}
                        {uploadedFiles.length * selectedStates.length} EOI
                        document(s) will be created.
                      </p>
                    )}
                    <div className="space-y-1.5">
                      {uploadedFiles.map((uf) => (
                        <div
                          key={uf.id}
                          className="flex min-w-0 items-center gap-2.5 rounded-lg border border-border/80 bg-muted/20 p-2.5"
                        >
                          {uf.file.name.toLowerCase().match(/\.(jpg|jpeg|png)$/) ? (
                            <File className="h-4 w-4 shrink-0 text-green-600" />
                          ) : uf.file.name.toLowerCase().match(/\.(doc|docx)$/) ? (
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
                              {uf.file.name}
                            </TruncatedText>
                            <p className="text-xs text-muted-foreground">
                              {(uf.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          {!isUploading && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(uf.id)}
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

          {showProgress && (
            <div className="shrink-0 border-t border-border bg-background px-4 py-2.5">
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>Uploading EOI documents…</span>
                <span className="font-medium tabular-nums text-foreground">
                  {currentUpload} of {totalUploads}
                </span>
              </div>
              <Progress
                value={totalUploads ? (currentUpload / totalUploads) * 100 : 0}
                className="h-1.5"
              />
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
                    {mode === "edit"
                      ? "Updating..."
                      : `Uploading ${currentUpload > 0 ? `${currentUpload}/${totalUploads}...` : "..."}`}
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
