"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  validateDescription,
  sanitizeDescription,
  DESCRIPTION_CONSTRAINTS,
} from "@/lib/validation/descriptionValidation";
import { AlertCircle, Loader2 } from "lucide-react";
import * as React from "react";

interface DescriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (description: string) => Promise<void> | void;
  existingDescription: string;
  mode?: "view" | "edit";
  isLoading?: boolean;
}

export function DescriptionModal({
  open,
  onOpenChange,
  onSave,
  existingDescription,
  mode = "edit",
  isLoading = false,
}: DescriptionModalProps) {
  const [description, setDescription] = React.useState(
    existingDescription || "",
  );
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setDescription(existingDescription || "");
      setValidationErrors([]);
      setIsSaving(false);
    }
  }, [open, existingDescription]);

  const handleDescriptionChange = (value: string) => {
    setDescription(value);

    // Real-time validation
    if (mode === "edit") {
      const validation = validateDescription(value);
      setValidationErrors(validation.errors);
    }
  };

  const handleSave = async () => {
    if (mode !== "edit") return;

    const sanitizedDescription = sanitizeDescription(description);
    const validation = validateDescription(sanitizedDescription);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsSaving(true);
    setValidationErrors([]);

    try {
      await onSave(sanitizedDescription);
      setDescription("");
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the parent component
      console.error("Error saving description:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const isSaveDisabled =
    mode !== "edit" ||
    isLoading ||
    isSaving ||
    !description.trim() ||
    validationErrors.length > 0;

  // dynamic text based on mode and whether description exists
  const title =
    mode === "edit"
      ? existingDescription
        ? "Edit Description"
        : "Add Description"
      : "View Description";

  const helperText =
    mode === "edit"
      ? "Provide a description or notes for this document."
      : "Here’s the saved description for this document.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{helperText}</DialogDescription>
        </DialogHeader>

        {mode === "edit" ? (
          <div className="py-2 space-y-2">
            <Textarea
              placeholder="Type your description here..."
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              className="min-h-[100px]"
              disabled={isSaving || isLoading}
            />

            {/* Character count */}
            <div className="text-xs text-muted-foreground text-right">
              {description.length}/{DESCRIPTION_CONSTRAINTS.MAX_LENGTH}{" "}
              characters
            </div>

            {/* Validation errors */}
            {validationErrors.length > 0 && (
              <div className="space-y-1">
                {validationErrors.map((error, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-red-600"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="py-2 min-h-[200px] max-h-[500px] overflow-y-auto">
            <p className="whitespace-pre-wrap">
              {description || "No description available."}
            </p>
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSaving || isLoading}>
              {mode === "edit" ? "Cancel" : "Close"}
            </Button>
          </DialogClose>
          {mode === "edit" && (
            <Button
              onClick={handleSave}
              disabled={isSaveDisabled}
              className="min-w-[80px]"
            >
              {isSaving || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
