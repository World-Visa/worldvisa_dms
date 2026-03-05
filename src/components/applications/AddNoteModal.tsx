"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAddNote, useUpdateNote } from "@/hooks/useApplicationNotes";
import type { ApplicationNote } from "@/lib/api/applicationNotes";
import { StickyNote } from "lucide-react";
import { useEffect, useState } from "react";

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  isSpouseApplication: boolean;
  editNote?: ApplicationNote | null;
}

export function AddNoteModal({
  isOpen,
  onClose,
  applicationId,
  isSpouseApplication,
  editNote,
}: AddNoteModalProps) {
  const [noteText, setNoteText] = useState("");

  const addNote = useAddNote(applicationId, isSpouseApplication);
  const updateNote = useUpdateNote(applicationId, isSpouseApplication);

  const isEditMode = Boolean(editNote);
  const isPending = addNote.isPending || updateNote.isPending;

  useEffect(() => {
    if (isOpen) {
      setNoteText(editNote?.note ?? "");
    }
  }, [isOpen, editNote]);

  function handleClose() {
    if (!isPending) {
      setNoteText("");
      onClose();
    }
  }

  async function handleSubmit() {
    const trimmed = noteText.trim();
    if (trimmed.length < 1) return;

    if (isEditMode && editNote) {
      await updateNote.mutateAsync({ noteId: editNote._id, note: trimmed });
    } else {
      await addNote.mutateAsync(trimmed);
    }
    handleClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-primary" />
            {isEditMode ? "Edit Note" : "Add Note"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <textarea
            className="w-full min-h-[120px] resize-y rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50"
            placeholder="Enter your note here..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            disabled={isPending}
            autoFocus
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {noteText.trim().length} characters
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || noteText.trim().length === 0}
          >
            {isPending
              ? isEditMode
                ? "Saving..."
                : "Adding..."
              : isEditMode
                ? "Save Changes"
                : "Add Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
