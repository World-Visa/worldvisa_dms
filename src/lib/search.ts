import { fetcher } from './fetcher';
import { VisaApplication, SearchParams } from '@/types/applications';

export interface SearchResponse {
  success: boolean;
  data: VisaApplication[];
}

/**
 * Search visa applications using the dedicated search endpoint
 * @param searchParams - Search parameters (name, phone, email)
 * @returns Promise<SearchResponse>
 */
export async function searchApplications(searchParams: SearchParams): Promise<SearchResponse> {
  // Filter out empty values
  const filteredParams = Object.fromEntries(
    Object.entries(searchParams).filter(([, value]) => value && value.trim() !== '')
  );

  // Validate that at least one search parameter is provided
  if (Object.keys(filteredParams).length === 0) {
    throw new Error('At least one search parameter is required');
  }

  // Build query string for search endpoint
  const queryParams = new URLSearchParams();
  
  // Add each non-empty search parameter
  Object.entries(filteredParams).forEach(([key, value]) => {
    if (value && value.trim() !== '') {
      queryParams.append(key, value.trim());
    }
  });

  // Use the dedicated search endpoint
  const url = `/api/zoho_dms/visa_applications/search?${queryParams.toString()}`;
  
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

