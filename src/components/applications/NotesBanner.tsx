"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InlineToast } from "@/components/ui/primitives/inline-toast";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import type { ApplicationNote } from "@/lib/api/applicationNotes";
import { Pencil, Trash2 } from "lucide-react";

interface NotesBannerProps {
  notes: ApplicationNote[];
  onEdit: (note: ApplicationNote) => void;
  onDelete: (noteId: string) => void;
  isAdmin: boolean;
}

export function NotesBanner({
  notes,
  onEdit,
  onDelete,
  isAdmin,
}: NotesBannerProps) {
  const safeNotes = Array.isArray(notes) ? notes : [];
  if (safeNotes.length === 0 || !isAdmin) return null;

  const [deleteTarget, setDeleteTarget] = useState<ApplicationNote | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTarget._id);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="mt-4 w-full space-y-2">
        {safeNotes.map((note) => (
          <div key={note._id} className="group relative">
            <InlineToast
              title="Note"
              description={<span className="text-foreground-700 text-sm">{note.note}</span>}
              variant="success"
              className="border-neutral-100 bg-neutral-50 pr-16"
            />

            <div className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="pointer-events-auto h-6 w-6 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                onClick={() => onEdit(note)}
                title="Edit note"
                disabled={isDeleting}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="pointer-events-auto h-6 w-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteTarget(note)}
                title="Delete note"
                disabled={isDeleting}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmationModal
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        variant="destructive"
        title="Delete this note?"
        description="This will permanently delete the note from this application."
        confirmText="Delete note"
        isLoading={isDeleting}
        disabled={!deleteTarget}
      />
    </>
  );
}
