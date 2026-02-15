"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { DatePicker } from "@/components/ui/date-picker";
import { Upload, X, FileText, File, Plus } from "lucide-react";
import Image from "next/image";
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
import type { EOIModalProps } from "@/types/stage2Documents";

interface UploadedFile {
  file: File;
  progress: number;
  id: string;
}

export function EOIModal({
  isOpen,
  onClose,
  applicationId,
  document,
  mode = "create",
}: EOIModalProps) {
  const { user } = useAuth();
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
        handleClose();
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
          } catch (err) {
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
        handleClose();
      }
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSubclass("");
      setSelectedStates([]);
      setPoint("");
      setDate(undefined);
      setSelectedAnzscoCode("");
      setUploadedFiles([]);
      setReplacementFile(null);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
      onClose();
    }
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit EOI Document" : "Create EOI Document"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Subclass */}
          <div className="space-y-2">
            <Label>Subclass *</Label>
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

          {/* States - multi-select in create, single display in edit */}
          <div className="space-y-2">
            <Label>State{mode === "create" ? "s" : ""} *</Label>
            {mode === "create" ? (
              <MultiSelect
                options={stateOptions}
                value={selectedStates}
                onChange={setSelectedStates}
                placeholder="Select state(s)..."
                disabled={isUploading}
                className="w-full min-h-[40px] px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:ring-2 focus:ring-ring focus:border-ring"
              />
            ) : (
              <div className="px-3 py-2 border rounded-md bg-muted/50 text-sm">
                {document?.state ? getStateDisplay(document.state) : "N/A"}
              </div>
            )}
          </div>

          {/* ANZSCO */}
          <div className="space-y-2">
            <Label>Skill Assessing Body (ANZSCO Code)</Label>
            {!isCustomAnzscoMode ? (
              <div className="space-y-2">
                <Combobox
                  options={availableAnzscoOptions}
                  value={selectedAnzscoCode}
                  onValueChange={setSelectedAnzscoCode}
                  placeholder="Select ANZSCO code..."
                  searchPlaceholder="Search ANZSCO code or occupation..."
                  emptyMessage="No ANZSCO code found."
                  disabled={isUploading}
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
                    <Label htmlFor="custom-assessing-authority">
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
                <div className="space-y-2">
                  <Label htmlFor="custom-anzsco-name">Occupation Name *</Label>
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

          {/* Points */}
          <div className="space-y-2">
            <Label htmlFor="point">Points *</Label>
            <Select
              value={point}
              onValueChange={setPoint}
              disabled={isUploading}
            >
              <SelectTrigger id="point">
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

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <DatePicker
              value={date}
              onChange={setDate}
              placeholder="Select date"
              disabled={isUploading}
            />
          </div>

          {/* File Upload - create only */}
          {mode === "create" && (
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
                  alt="Upload"
                  width={78}
                  height={96}
                  className="mx-auto mb-4"
                />
                <p className="text-sm text-muted-foreground mb-2">
                  Drop your files here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>PDF, Word, images</strong> • Max 5MB per file.
                  Document name = file name.
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
            <div className="space-y-3">
              <Label>Current File</Label>
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted">
                <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                <span className="text-sm font-medium">
                  {document.file_name}
                </span>
              </div>
              <div className="space-y-2">
                <Label>Replace with new file</Label>
                <p className="text-xs text-muted-foreground">
                  Optionally choose a new file to replace the current document.
                  Same types: PDF, Word, images. Max 5MB.
                </p>
                {replacementFile ? (
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-primary/5">
                    <FileText className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium flex-1 truncate">
                      {replacementFile.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearReplacementFile}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-4 text-center transition-colors border-primary/50 bg-muted/30 hover:bg-muted/50 cursor-pointer"
                    onClick={() => replaceFileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
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
            <div className="space-y-3">
              <Label>Files to Upload</Label>
              {uploadedFiles.length > 0 && selectedStates.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {uploadedFiles.length} file(s) × {selectedStates.length}{" "}
                  state(s) = {uploadedFiles.length * selectedStates.length} EOI
                  document(s) will be created.
                </p>
              )}
              <div className="space-y-2">
                {uploadedFiles.map((uf) => (
                  <div
                    key={uf.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                  >
                    {uf.file.name.toLowerCase().match(/\.(jpg|jpeg|png)$/) ? (
                      <File className="h-5 w-5 text-green-600 shrink-0" />
                    ) : uf.file.name.toLowerCase().match(/\.(doc|docx)$/) ? (
                      <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                    ) : (
                      <Image
                        src="/icons/pdf_small.svg"
                        alt="PDF"
                        width={20}
                        height={20}
                        className="shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {uf.file.name}
                      </p>
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

          {showProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Uploading EOI documents...
                </span>
                <span className="font-medium">
                  {currentUpload} of {totalUploads}
                </span>
              </div>
              <Progress
                value={totalUploads ? (currentUpload / totalUploads) * 100 : 0}
                className="h-2"
              />
            </div>
          )}
        </div>

        <DialogFooter>
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getStateDisplay(code: string): string {
  const state = AUSTRALIAN_STATES.find((s) => s.code === code);
  return state ? `${state.code} - ${state.name}` : code;
}
