import { fetcher } from './fetcher';
import { VisaApplication, SearchParams } from '@/types/applications';
import qs from 'query-string';

export interface SearchResponse {
  success: boolean;
  data: VisaApplication[];
}

const ZOHO_BASE_URL = 'https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms';

/**
 * Search visa applications using the Zoho API
 * @param searchParams - Search parameters (name, phone, email, word)
 * @returns Promise<SearchResponse>
 */
export async function searchApplications(searchParams: SearchParams): Promise<SearchResponse> {
  // Filter out empty values
  const filteredParams = Object.fromEntries(
    Object.entries(searchParams).filter(([_, value]) => value && value.trim() !== '')
  );

  // Build query string
  const query = qs.stringify(filteredParams, { skipNull: true, skipEmptyString: true });
  
  if (!query) {
    throw new Error('At least one search parameter is required');
  }

  const url = `${ZOHO_BASE_URL}/visa_applications/search?${query}`;
  
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
