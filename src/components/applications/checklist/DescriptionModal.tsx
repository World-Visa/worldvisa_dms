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
import * as React from "react";

interface DescriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (description: string) => void;
  existingDescription: string;
  mode?: "view" | "edit";
}

export function DescriptionModal({
  open,
  onOpenChange,
  onSave,
  existingDescription,
  mode = "edit",
}: DescriptionModalProps) {
  const [description, setDescription] = React.useState(
    existingDescription || ""
  );

  const handleSave = () => {
    if (description.trim().length === 0) return;
    onSave(description);
    setDescription("");
    onOpenChange(false);
  };

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
          <div className="py-2">
            <Textarea
              placeholder="Type your description here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        ) : (
          <div className="py-2 min-h-[200px] max-h-[500px] overflow-y-auto">
            <p>{description || "No description available."}</p>
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">
              {mode === "edit" ? "Cancel" : "Close"}
            </Button>
          </DialogClose>
          {mode === "edit" && <Button onClick={handleSave}>Save</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
