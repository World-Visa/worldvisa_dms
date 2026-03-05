import { fetcher } from "@/lib/fetcher";
import { ZOHO_BASE_URL } from "@/lib/config/api";

export type ApplicationNote = {
  _id: string;
  note: string;
  created_by?: string;
  created_at?: string;
};

function notesUrl(applicationId: string, isSpouse: boolean, noteId?: string): string {
  const base = isSpouse
    ? `${ZOHO_BASE_URL}/visa_applications/spouse/applications/${applicationId}/notes`
    : `${ZOHO_BASE_URL}/visa_applications/${applicationId}/notes`;
  return noteId ? `${base}/${noteId}` : base;
}

export async function getNotes(
  applicationId: string,
  isSpouse: boolean,
): Promise<{ data: ApplicationNote[] }> {
  return fetcher<{ data: ApplicationNote[] }>(notesUrl(applicationId, isSpouse));
}

export async function addNote(
  applicationId: string,
  note: string,
  isSpouse: boolean,
): Promise<{ data: ApplicationNote }> {
  return fetcher<{ data: ApplicationNote }>(notesUrl(applicationId, isSpouse), {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export async function updateNote(
  applicationId: string,
  noteId: string,
  note: string,
  isSpouse: boolean,
): Promise<{ data: ApplicationNote }> {
  return fetcher<{ data: ApplicationNote }>(notesUrl(applicationId, isSpouse, noteId), {
    method: "PATCH",
    body: JSON.stringify({ note }),
  });
}

export async function deleteNote(
  applicationId: string,
  noteId: string,
  isSpouse: boolean,
): Promise<void> {
  return fetcher<void>(notesUrl(applicationId, isSpouse, noteId), {
    method: "DELETE",
  });
}
