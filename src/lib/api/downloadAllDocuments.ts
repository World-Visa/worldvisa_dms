import { tokenStorage } from '@/lib/auth';
import { ZOHO_BASE_URL } from '@/lib/config/api';

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

    // Check if the response is a ZIP file (which is what we expect)
    const contentType = response.headers.get('content-type');
    const contentDisposition = response.headers.get('content-disposition');
    
    if (contentType === 'application/zip' || contentDisposition?.includes('filename="documents.zip"')) {
      // This is a direct ZIP download - handle it
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `documents-${leadId}-${new Date().toISOString().split('T')[0]}.zip`;
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      window.URL.revokeObjectURL(downloadUrl);
      
      return;
    } else {
      // If it's not a ZIP file, try to parse as JSON (fallback for different API responses)
      const text = await response.text();
      if (text.trim()) {
        try {
          const jsonResponse = JSON.parse(text);
          if (jsonResponse.status && jsonResponse.status !== 'success') {
            throw new Error('Failed to prepare documents for download');
          }
          // If it's a JSON response with download info, we'll handle it differently
          throw new Error('API returned JSON instead of ZIP file - this endpoint may have changed');
        } catch {
          throw new Error('Unexpected response format from download API');
        }
      } else {
        throw new Error('Empty response from download API');
      }
    }
  } catch (error) {
    console.error('Download all documents failed:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('An unexpected error occurred while downloading documents');
  }
}
