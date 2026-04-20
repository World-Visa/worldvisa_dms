import { getDocumentFilesPreviewBaseUrl } from "@/lib/config/documentFilesPreview";

export type DocUrlFields = {
  storage_type?: "workdrive" | "r2";
  r2_key?: string;
  download_url?: string;
  document_link?: string;
};

export function getDocumentUrl(doc: DocUrlFields): string {
  if (doc.storage_type === "r2" && doc.r2_key) {
    const base = (
      process.env.NEXT_PUBLIC_R2_WORKER_URL ?? getDocumentFilesPreviewBaseUrl()
    ).replace(/\/$/, "");
    return `${base}/${doc.r2_key}`;
  }
  return doc.document_link || doc.download_url || "";
}
