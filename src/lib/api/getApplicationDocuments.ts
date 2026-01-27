import { fetcher } from '../fetcher';
import { DocumentsResponse } from '@/types/applications';
import { ZOHO_BASE_URL } from '@/lib/config/api';


export async function getApplicationDocuments(
  id: string
): Promise<DocumentsResponse> {
  return fetcher<DocumentsResponse>(
    `${ZOHO_BASE_URL}/visa_applications/${id}/documents`
  );
}

export async function getAllApplicationDocuments(
  id: string
): Promise<DocumentsResponse> {
  return fetcher<DocumentsResponse>(
    `${ZOHO_BASE_URL}/visa_applications/${id}/documents?limit=1000`
  );
}