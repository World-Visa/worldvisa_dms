import { fetcher } from '../fetcher';
import { DocumentsResponse } from '@/types/applications';

const ZOHO_BASE_URL = 'https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms';

/**
 * Get application documents
 * Note: This function is used in client components via React Query
 * Client-side caching is handled by React Query
 * Server-side cache revalidation is handled via revalidateTag in server actions
 */
export async function getApplicationDocuments(
  id: string
): Promise<DocumentsResponse> {
  return fetcher<DocumentsResponse>(
    `${ZOHO_BASE_URL}/visa_applications/${id}/documents`
  );
}

/**
 * Get all application documents
 * Note: This function is used in client components via React Query
 * Client-side caching is handled by React Query
 * Server-side cache revalidation is handled via revalidateTag in server actions
 */
export async function getAllApplicationDocuments(
  id: string
): Promise<DocumentsResponse> {
  return fetcher<DocumentsResponse>(
    `${ZOHO_BASE_URL}/visa_applications/${id}/documents?limit=1000`
  );
}