"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAddNote, useUpdateNote } from "@/hooks/useApplicationNotes";
import type { ApplicationNote } from "@/lib/api/applicationNotes";
import { StickyNote, X } from "lucide-react";
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
      <DialogContent showCloseButton={false} className="sm:max-w-[520px] gap-4 overflow-hidden p-5">
        {/* Header row: icon + title + close */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
              <StickyNote className="size-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold leading-snug">
                {isEditMode ? "Edit Note" : "Add Note"}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                {isEditMode
                  ? "Update the note for this application."
                  : "Add a note for this application. Notes are visible to admins."}
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            aria-label="Close"
            disabled={isPending}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
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

        {/* Footer: fixed-looking footer bar */}
        <div className="-mx-5 -mb-5 flex flex-row items-center justify-end gap-2 border-t bg-muted/50 px-5 py-4">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || noteText.trim().length === 0} premium3D>
            {isPending ? (isEditMode ? "Saving..." : "Adding...") : isEditMode ? "Save Changes" : "Add Note"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
