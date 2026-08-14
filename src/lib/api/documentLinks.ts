import { fetcher } from "@/lib/fetcher";
import { API_ENDPOINTS } from "@/lib/config/api";
import type { DocumentLink, GetDocumentLinkResponse } from "@/types/documents";

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getLinkAttributes(
  response: GetDocumentLinkResponse,
): Partial<DocumentLink> | undefined {
  return response.data?.data?.attributes ?? response.data?.attributes;
}

export async function fetchDocumentLink(fileId: string): Promise<DocumentLink> {
  if (!fileId) {
    throw new Error("fileId is required");
  }

  const response = await fetcher<GetDocumentLinkResponse>(
    API_ENDPOINTS.VISA_APPLICATIONS.DOCUMENTS.LINKS(fileId),
    { method: "POST" },
  );

  if (response.status === "error") {
    throw new Error("Failed to fetch document link");
  }

  const attributes = getLinkAttributes(response);
  const link = attributes?.link?.trim() ?? "";

  if (!link || !isHttpUrl(link)) {
    throw new Error("Document link is unavailable");
  }

  return {
    link,
    download_url: attributes?.download_url ?? "",
    resource_id: attributes?.resource_id ?? fileId,
  };
}
