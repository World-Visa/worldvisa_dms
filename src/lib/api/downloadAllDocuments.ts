import { getStoredToken } from "@/lib/auth";
import { ZOHO_BASE_URL } from "@/lib/config/api";

/** Result when blob download was triggered in the client */
export type DownloadAllDocumentsResult =
  | { ok: true; downloaded: true }
  | { ok: true; downloaded: false; downloadUrl: string; filename: string };

/** Response when backend returns a Zoho download URL instead of streaming the ZIP */
export interface DownloadAllUrlResponse {
  success: boolean;
  downloadUrl: string;
  accessToken?: string;
  filename: string;
  message?: string;
  expiresIn?: number;
}

export interface DownloadAllDocumentsResponse {
  status: string;
  data: {
    totalSize: number;
    download_link: string;
    wmsKey: string;
    totalFolders: number;
    direct_download: boolean;
    totalFiles: number;
    folderId: string;
  };
}

export interface DownloadAllDocumentsError {
  message: string;
  error?: string;
}

const FALLBACK_FILENAME_MAX_LENGTH = 200;
const SAFE_FILENAME_REGEX = /^[a-zA-Z0-9._-]+$/;

function sanitizeFilename(
  filename: string | null | undefined,
  leadId: string,
): string {
  if (!filename || typeof filename !== "string") {
    return `documents-${leadId}-${new Date().toISOString().split("T")[0]}.zip`;
  }
  const basename = filename.replace(/^.*[/\\]/, "").trim();
  if (!basename) {
    return `documents-${leadId}-${new Date().toISOString().split("T")[0]}.zip`;
  }
  const truncated =
    basename.length > FALLBACK_FILENAME_MAX_LENGTH
      ? basename.slice(0, FALLBACK_FILENAME_MAX_LENGTH)
      : basename;
  if (!SAFE_FILENAME_REGEX.test(truncated)) {
    return `documents-${leadId}-${new Date().toISOString().split("T")[0]}.zip`;
  }
  return truncated.endsWith(".zip") ? truncated : `${truncated}.zip`;
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(objectUrl);
}

const SUCCESS_MESSAGE_PREFIX = "Download link generated successfully";

function isSuccessMessage(msg: string): boolean {
  return msg
    .trim()
    .toLowerCase()
    .startsWith(SUCCESS_MESSAGE_PREFIX.toLowerCase());
}

export async function downloadAllDocuments(
  leadId: string,
): Promise<DownloadAllDocumentsResult> {
  const url = `${ZOHO_BASE_URL}/visa_applications/${leadId}/documents/download/all`;

  try {
    const token = getStoredToken();

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;

      if (typeof window !== "undefined") {
        const userData = localStorage.getItem("user_data");
        if (userData) {
          try {
            const user = JSON.parse(userData);
            if (user.role) {
              headers["X-User-Role"] = user.role;
            }
          } catch (error) {
            console.warn("Failed to parse user data from localStorage:", error);
          }
        }
      }
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      let userMessage = "Download failed. Please try again.";
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        try {
          const json = (await response.json()) as { message?: string };
          const msg =
            typeof json.message === "string" ? json.message.trim() : "";
          if (msg && !isSuccessMessage(msg)) {
            userMessage = msg;
          }
        } catch {
          /* use default userMessage */
        }
      }
      throw new Error(userMessage);
    }

    const contentType = response.headers.get("content-type") ?? "";
    const contentDisposition = response.headers.get("content-disposition");

    if (contentType.includes("application/json")) {
      const json = (await response.json()) as DownloadAllUrlResponse;
      if (!json.success || !json.downloadUrl) {
        const fallback =
          "Download link could not be generated. Please try again.";
        throw new Error(
          json.message && !isSuccessMessage(json.message)
            ? json.message
            : fallback,
        );
      }
      const filename = sanitizeFilename(json.filename, leadId);

      if (!json.accessToken) {
        return {
          ok: true,
          downloaded: false,
          downloadUrl: json.downloadUrl,
          filename,
        };
      }

      try {
        const zohoResponse = await fetch(json.downloadUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${json.accessToken}`,
          },
        });
        if (!zohoResponse.ok) {
          return {
            ok: true,
            downloaded: false,
            downloadUrl: json.downloadUrl,
            filename,
          };
        }
        const blob = await zohoResponse.blob();
        triggerBlobDownload(blob, filename);
        return { ok: true, downloaded: true };
      } catch {
        return {
          ok: true,
          downloaded: false,
          downloadUrl: json.downloadUrl,
          filename,
        };
      }
    }

    if (
      contentType.includes("application/zip") ||
      contentDisposition?.includes('filename="documents.zip"')
    ) {
      const blob = await response.blob();
      const fallbackFilename = `documents-${leadId}-${new Date().toISOString().split("T")[0]}.zip`;
      triggerBlobDownload(blob, fallbackFilename);
      return { ok: true, downloaded: true };
    }

    const text = await response.text();
    if (text.trim()) {
      try {
        const jsonResponse = JSON.parse(text) as { message?: string };
        const msg =
          typeof jsonResponse.message === "string" ? jsonResponse.message : "";
        if (msg && !isSuccessMessage(msg)) {
          throw new Error(msg);
        }
      } catch (err) {
        if (
          err instanceof Error &&
          err.message !== "Unexpected response format from download API"
        ) {
          throw err;
        }
      }
    }
    throw new Error("Unexpected response format from download API");
  } catch (error) {
    console.error("Download all documents failed:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("An unexpected error occurred while downloading documents");
  }
}
