/** Public worker URL pattern: `{base}/{leadId}/{fileName}` for extension-based embeds. */
const DEFAULT_DOCUMENT_FILES_PREVIEW_BASE =
  "https://worldvisadms-files.worldvisadms.workers.dev";

export function getDocumentFilesPreviewBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_DOCUMENT_FILES_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return DEFAULT_DOCUMENT_FILES_PREVIEW_BASE;
}
