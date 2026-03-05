"use client";

import { Button } from "@/components/ui/button";
import type { ApplicationNote } from "@/lib/api/applicationNotes";
import { Pencil, StickyNote, Trash2 } from "lucide-react";

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



  return (
    <div className="w-full mt-4">
      {safeNotes.map((note) => (
        <div
          key={note._id}
          className="flex items-start gap-3 px-4 py-4 bg-red-500/5 rounded-lg"
        >
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2">
              <p className="flex-1 text-sm text-foreground leading-relaxed">
                <span onClick={() => onEdit(note)}>
                  <span className="text-red-500">Note:</span> <span className="text-foreground capitalize">{note.note}</span>
                </span>
              </p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  onClick={() => onEdit(note)}
                  title="Edit note"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(note._id)}
                  title="Delete note"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
