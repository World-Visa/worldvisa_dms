import { ZOHO_BASE_URL } from "@/lib/config/api";
import { getStoredToken } from "@/lib/auth";
import { fetcher } from "@/lib/fetcher";

/** Response from POST create job (202) */
export interface CreateZipExportJobResponse {
  success: boolean;
  job_id: string;
  status: string;
  message?: string;
  status_url?: string;
}

/** Response from GET status (200) – pending/processing/completed/failed */
export interface ZipExportStatusResponse {
  success: boolean;
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: { current: number; total: number };
  download_url?: string;
  expires_at?: string;
  completed_at?: string;
  created_at?: string;
  error_message?: string;
}

/** Error response body (404, 410, 500) */
interface ErrorResponse {
  success?: boolean;
  message?: string;
  status?: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    if (typeof window !== "undefined") {
      try {
        const userData = localStorage.getItem("user_data");
        if (userData) {
          const user = JSON.parse(userData) as { role?: string };
          if (user.role) headers["X-User-Role"] = user.role;
        }
      } catch {
        // ignore
      }
    }
  }
  return headers;
}

/**
 * Create a ZIP export job. Returns job_id and status.
 * Throws with API message on 404 (e.g. no approved documents) or 500.
 */
export async function createZipExportJob(
  recordId: string,
): Promise<{ job_id: string; status: string }> {
  const url = `${ZOHO_BASE_URL}/visa_applications/${recordId}/documents/download/all`;
  const res = await fetcher<CreateZipExportJobResponse>(url, {
    method: "POST",
  });
  if (!res.success || !res.job_id) {
    throw new Error(res.message ?? "Failed to create ZIP export job.");
  }
  return { job_id: res.job_id, status: res.status ?? "pending" };
}

/**
 * Get job status. On 410 (expired) throws Error with message 'expired' so UI can show expired state.
 * On other errors throws with API message or generic.
 */
export async function getZipExportJobStatus(
  recordId: string,
  jobId: string,
): Promise<ZipExportStatusResponse> {
  const url = `${ZOHO_BASE_URL}/visa_applications/${recordId}/documents/download/all/status/${jobId}`;
  const headers = getAuthHeaders();
  const response = await fetch(url, { method: "GET", headers });

  if (response.status === 410) {
    throw new Error("expired");
  }

  if (!response.ok) {
    let message = "Failed to fetch job status.";
    try {
      const text = await response.text();
      if (text.trim()) {
        const data = JSON.parse(text) as ErrorResponse;
        if (typeof data.message === "string" && data.message)
          message = data.message;
      }
    } catch {
      // use default message
    }
    throw new Error(message);
  }

  const data = (await response.json()) as ZipExportStatusResponse;
  return data;
}

/**
 * Cancel an active ZIP export job.
 * Throws with API message on 400, 404, or 500.
 */
export async function cancelZipExportJob(
  recordId: string,
  jobId: string,
): Promise<void> {
  const url = `${ZOHO_BASE_URL}/visa_applications/${recordId}/documents/download/all/${jobId}`;
  await fetcher<{ success: boolean; message?: string }>(url, {
    method: "DELETE",
  });
}
