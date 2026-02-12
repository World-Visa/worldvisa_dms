import { tokenStorage } from '@/lib/auth';
import { ZOHO_BASE_URL } from '@/lib/config/api';

/** Response when backend returns a Zoho download URL instead of streaming the ZIP */
export interface DownloadAllUrlResponse {
  success: boolean;
  downloadUrl: string;
  accessToken: string;
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

function sanitizeFilename(filename: string | null | undefined, leadId: string): string {
  if (!filename || typeof filename !== 'string') {
    return `documents-${leadId}-${new Date().toISOString().split('T')[0]}.zip`;
  }
  const basename = filename.replace(/^.*[/\\]/, '').trim();
  if (!basename) {
    return `documents-${leadId}-${new Date().toISOString().split('T')[0]}.zip`;
  }
  const truncated = basename.length > FALLBACK_FILENAME_MAX_LENGTH
    ? basename.slice(0, FALLBACK_FILENAME_MAX_LENGTH)
    : basename;
  if (!SAFE_FILENAME_REGEX.test(truncated)) {
    return `documents-${leadId}-${new Date().toISOString().split('T')[0]}.zip`;
  }
  return truncated.endsWith('.zip') ? truncated : `${truncated}.zip`;
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(objectUrl);
}

export async function downloadAllDocuments(leadId: string): Promise<void> {
  const url = `${ZOHO_BASE_URL}/visa_applications/${leadId}/documents/download/all`;

  try {
    const token = tokenStorage.get();

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;

      if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            if (user.role) {
              headers['X-User-Role'] = user.role;
            }
          } catch (error) {
            console.warn('Failed to parse user data from localStorage:', error);
          }
        }
      }
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    const contentDisposition = response.headers.get('content-disposition');

    if (contentType.includes('application/json')) {
      const json = (await response.json()) as DownloadAllUrlResponse;
      if (!json.success || !json.downloadUrl || !json.accessToken) {
        throw new Error(
          json.message ?? 'Download link could not be generated. Please try again.'
        );
      }
      const filename = sanitizeFilename(json.filename, leadId);
      const zohoResponse = await fetch(json.downloadUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${json.accessToken}`,
        },
      });
      if (!zohoResponse.ok) {
        throw new Error('Download link could not be used. Please try again.');
      }
      const blob = await zohoResponse.blob();
      triggerBlobDownload(blob, filename);
      return;
    }

    if (contentType.includes('application/zip') || contentDisposition?.includes('filename="documents.zip"')) {
      const blob = await response.blob();
      const fallbackFilename = `documents-${leadId}-${new Date().toISOString().split('T')[0]}.zip`;
      triggerBlobDownload(blob, fallbackFilename);
      return;
    }

    const text = await response.text();
    if (text.trim()) {
      try {
        const jsonResponse = JSON.parse(text) as { message?: string };
        if (typeof jsonResponse.message === 'string' && jsonResponse.message) {
          throw new Error(jsonResponse.message);
        }
      } catch (err) {
        if (err instanceof Error && err.message !== 'Unexpected response format from download API') {
          throw err;
        }
      }
    }
    throw new Error('Unexpected response format from download API');
  } catch (error) {
    console.error('Download all documents failed:', error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('An unexpected error occurred while downloading documents');
  }
}
