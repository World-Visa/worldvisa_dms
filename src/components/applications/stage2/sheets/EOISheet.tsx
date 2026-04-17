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
import { Combobox } from "@/components/ui/combobox";
import { MultiSelect } from "@/components/ui/multi-select";
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
  ANZSCO_CODES,
  getAnzscoCodeByCode,
} from "@/lib/constants/australianData";
import type { EOISheetProps } from "@/types/stage2Documents";
import TruncatedText from "@/components/ui/truncated-text";

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
  const [availableAnzscoOptions, setAvailableAnzscoOptions] = useState(
    ANZSCO_CODES.map((code) => ({
      value: code.anzsco_code,
      label: `${code.anzsco_code} - ${code.name} (${code.assessing_authority})`,
    })),
  );
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

  useEffect(() => {
    if (mode === "edit" && document) {
      setSubclass(document.subclass || "");
      setSelectedStates(document.state ? [document.state] : []);
      setPoint(document.point?.toString() || "");
      setDate(document.date ? new Date(document.date) : undefined);
      const skillBody = document.skill_assessing_body || "";
      if (skillBody) {
        const matchingCode = getAnzscoCodeByCode(skillBody);
        if (matchingCode) {
          setSelectedAnzscoCode(skillBody);
        } else {
          setSelectedAnzscoCode(skillBody);
          setAvailableAnzscoOptions((prev) => {
            const exists = prev.some((opt) => opt.value === skillBody);
            if (!exists)
              return [
                ...prev,
                { value: skillBody, label: `Custom - ${skillBody}` },
              ];
            return prev;
          });
        }
      } else {
        setSelectedAnzscoCode("");
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
      setIsCustomAnzscoMode(false);
      setCustomAnzscoCode("");
      setCustomAnzscoName("");
      setCustomAssessingAuthority("");
      setUploadedFiles([]);
      setUploadProgress({ current: 0, total: 0 });
      setReplacementFile(null);
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
    if (
      !allowedExtensions.some((ext) => fileName.endsWith(ext)) ||
      !allowedMimeTypes.includes(file.type)
    ) {
      toast.error(
        `${file.name}: only PDF, Word (.doc, .docx), and image files (.jpg, .jpeg, .png) are allowed.`,
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
    const validFiles = files.filter(validateFile);
    const newFiles: UploadedFile[] = validFiles.map((file) => ({
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
      if (!availableAnzscoOptions.some((o) => o.value === code)) {
        setAvailableAnzscoOptions((prev) => [
          ...prev,
          { value: code, label: `${code} - ${name} (${authority})` },
        ]);
      }
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
    if (!user?.username) {
      toast.error("User information not available. Please login again.");
      return;
    }

    const formattedDate = format(date, "yyyy-MM-dd");
    const anzscoValue = selectedAnzscoCode || undefined;

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
            uploaded_by: user.username,
            subclass,
            state: document.state,
            point: Number(point),
            date: formattedDate,
            skill_assessing_body: anzscoValue,
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
              uploaded_by: user.username,
              type: "eoi",
              subclass,
              state: stateCode,
              point: Number(point),
              date: formattedDate,
              skill_assessing_body: anzscoValue,
            });
          } catch {
            failed.push(`${documentName} (${stateCode})`);
          }
          done += 1;
          setUploadProgress({ current: done, total });
        }
      }

      if (failed.length > 0) {
        toast.error(
          `Failed to upload: ${failed.slice(0, 3).join(", ")}${failed.length > 3 ? "..." : ""}`,
        );
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
              initial={
                reduceMotion ? false : { opacity: 0.97, y: 4 }
              }
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

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    State{mode === "create" ? "s" : ""} *
                  </Label>
                  {mode === "create" ? (
                    <MultiSelect
                      options={stateOptions}
                      value={selectedStates}
                      onChange={setSelectedStates}
                      placeholder="Select state(s)..."
                      disabled={isUploading}
                      className="w-full min-h-[36px] rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:border-ring focus:ring-2 focus:ring-ring"
                    />
                  ) : (
                    <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                      {document?.state ? getStateDisplay(document.state) : "N/A"}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Skill Assessing Body (ANZSCO Code)
                  </Label>
                  {!isCustomAnzscoMode ? (
                    <div className="space-y-1.5">
                      <Combobox
                        options={availableAnzscoOptions}
                        value={selectedAnzscoCode}
                        onValueChange={setSelectedAnzscoCode}
                        placeholder="Select ANZSCO code..."
                        searchPlaceholder="Search ANZSCO code or occupation..."
                        emptyMessage="No ANZSCO code found."
                        disabled={isUploading}
                        portalContainer={sheetContainerRef.current}
                      />
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
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
                        onClick={handleToggleCustomAnzscoMode}
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
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleAddCustomAnzsco()
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddCustomAnzsco}
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
                          onClick={handleToggleCustomAnzscoMode}
                          disabled={isUploading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                        alt="Upload"
                        width={56}
                        height={72}
                        className="mx-auto mb-3"
                      />
                      <p className="mb-1 text-xs text-muted-foreground">
                        Drop your files here, or click to browse
                      </p>
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        <span className="font-medium">PDF, Word, images</span> •
                        Max 5MB per file. Document name = file name.
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
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Current File
                    </Label>
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
                        Same types: PDF, Word, images. Max 5MB.
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
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/jpg,image/png"
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
                value={
                  totalUploads ? (currentUpload / totalUploads) * 100 : 0
                }
                className="h-1.5"
              />
            </div>
          )}
        </div>

        <Separator />

        <SheetFooter className="p-0">
          <div className="flex w-full items-center justify-between gap-3 border-t bg-background px-4 py-2.5">
            <p className="min-w-0 truncate text-xs text-neutral-500">
              EOI • Document name follows file name
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
                    {mode === "edit"
                      ? "Updating..."
                      : `Uploading ${currentUpload > 0 ? `${currentUpload}/${totalUploads}...` : "..."}`}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    {mode === "edit" ? "Update Document" : "Upload Document(s)"}
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

function getStateDisplay(code: string): string {
  const state = AUSTRALIAN_STATES.find((s) => s.code === code);
  return state ? `${state.code} - ${state.name}` : code;
}
