const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "heic",
  "bmp",
]);

export function getFileIcon(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "/icons/document-tree/pdf-icon.png";
  if (IMAGE_EXTENSIONS.has(ext)) return "/icons/document-tree/image-icon.png";
  return "/icons/document-tree/docs-icon.png";
}
