import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ApplicationNote } from "@/lib/api/applicationNotes";
import {
  addNote,
  deleteNote,
  getNotes,
  updateNote,
} from "@/lib/api/applicationNotes";

function notesQueryKey(applicationId: string, isSpouse: boolean) {
  return ["application-notes", applicationId, isSpouse] as const;
}

export function useApplicationNotes(applicationId: string, isSpouse: boolean) {
  return useQuery({
    queryKey: notesQueryKey(applicationId, isSpouse),
    queryFn: () => getNotes(applicationId, isSpouse),
    enabled: Boolean(applicationId),
    select: (data) => {
      if (!data || typeof data !== "object") return [];
      const d = data as { data?: { notes?: unknown[] } | unknown[]; notes?: unknown[] };
      const inner = d.data;
      if (Array.isArray(inner)) return inner;
      if (inner && typeof inner === "object" && Array.isArray((inner as { notes?: unknown[] }).notes))
        return (inner as { notes: unknown[] }).notes;
      if (Array.isArray(d.notes)) return d.notes;
      return [];
    },
  });
}

export function useAddNote(applicationId: string, isSpouse: boolean) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (note: string) => addNote(applicationId, note, isSpouse),
    onSuccess: (result) => {
      const newNote = result?.data;
      if (newNote && typeof newNote === "object" && "_id" in newNote) {
        queryClient.setQueryData<ApplicationNote[]>(
          notesQueryKey(applicationId, isSpouse),
          (prev) => {
            const list = Array.isArray(prev) ? prev : [];
            return [...list, newNote as ApplicationNote];
          },
        );
      }
      queryClient.invalidateQueries({
        queryKey: notesQueryKey(applicationId, isSpouse),
      });
      toast.success("Note added successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add note: ${error.message}`);
    },
  });
}

export function useUpdateNote(applicationId: string, isSpouse: boolean) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, note }: { noteId: string; note: string }) =>
      updateNote(applicationId, noteId, note, isSpouse),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notesQueryKey(applicationId, isSpouse),
      });
      toast.success("Note updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update note: ${error.message}`);
    },
  });
}

export function useDeleteNote(applicationId: string, isSpouse: boolean) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => deleteNote(applicationId, noteId, isSpouse),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notesQueryKey(applicationId, isSpouse),
      });
      toast.success("Note deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete note: ${error.message}`);
    },
  });
}
