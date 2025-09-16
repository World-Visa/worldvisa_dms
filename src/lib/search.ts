import { fetcher } from './fetcher';
import { VisaApplication, SearchParams } from '@/types/applications';

export interface SearchResponse {
  success: boolean;
  data: VisaApplication[];
}

/**
 * Search visa applications using the regular applications endpoint with search parameter
 * @param searchParams - Search parameters (name, phone, email, word)
 * @returns Promise<SearchResponse>
 */
export async function searchApplications(searchParams: SearchParams): Promise<SearchResponse> {
  // Filter out empty values
  const filteredParams = Object.fromEntries(
    Object.entries(searchParams).filter(([, value]) => value && value.trim() !== '')
  );

  // Get the first non-empty search value
  const searchValue = Object.values(filteredParams)[0];
  
  if (!searchValue) {
    throw new Error('At least one search parameter is required');
  }

  // Use the regular applications endpoint with search parameter
  const url = `/api/zoho_dms/visa_applications?search=${encodeURIComponent(searchValue)}&page=1&limit=100`;
  
  return fetcher<SearchResponse>(url);
}

/**
 * Check if search parameters are valid (at least one non-empty parameter)
 * @param searchParams - Search parameters to validate
 * @returns boolean
 */
export function isValidSearchParams(searchParams: SearchParams): boolean {
  return Object.values(searchParams).some(value => value && value.trim() !== '');
}
