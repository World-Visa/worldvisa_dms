import { getDocumentFilesPreviewBaseUrl } from "@/lib/config/documentFilesPreview";
import type { MovedDocument } from "@/types/documents";

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

const WORKDRIVE_RESOURCE_ID_RE = /^[a-zA-Z0-9]{20,64}$/;

function isR2MovedFileId(fileId: string | undefined): boolean {
  return Boolean(fileId?.includes("/"));
}

export function isWorkDriveResourceId(fileId: string | undefined): boolean {
  return Boolean(fileId && WORKDRIVE_RESOURCE_ID_RE.test(fileId));
}

export function getMovedDocumentUrl(file: MovedDocument): string {
  const r2Key =
    file.r2_key ||
    (file.storage_type === "r2" || isR2MovedFileId(file.file_id)
      ? file.file_id
      : undefined);

  if (r2Key) {
    return getDocumentUrl({ storage_type: "r2", r2_key: r2Key });
  }

  return getDocumentUrl({
    document_link: file.document_link,
    download_url: file.download_url,
  });
}
