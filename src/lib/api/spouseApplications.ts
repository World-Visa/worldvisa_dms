import { fetcher } from "../fetcher";
import { ApplicationsResponse, ApplicationsFilters, ApplicationDetailsResponse } from "@/types/applications";
import { ZOHO_BASE_URL } from '@/lib/config/api';

/**
 * Fetches spouse skill assessment applications with pagination and filters
 */
export async function getSpouseApplications(
  filters: ApplicationsFilters
): Promise<ApplicationsResponse> {
  const searchParams = new URLSearchParams();
  
  // Add pagination parameters
  if (filters.page) searchParams.append('page', filters.page.toString());
  if (filters.limit) searchParams.append('limit', filters.limit.toString());

  // Add date range filters
  if (filters.startDate) searchParams.append('startDate', filters.startDate);
  if (filters.endDate) searchParams.append('endDate', filters.endDate);

  // Add recent activity filter
  if (filters.recentActivity) searchParams.append('recentActivity', 'true');

  // Add deadline category filter
  if (filters.deadlineCategory) searchParams.append('deadlineCategory', filters.deadlineCategory);

  const url = `${ZOHO_BASE_URL}/visa_applications/spouse/applications?${searchParams.toString()}`;
  
  return fetcher<ApplicationsResponse>(url);
}

/**
 * Searches spouse applications by name, phone, or email
 */
export async function searchSpouseApplications(
  searchParams: { name?: string; phone?: string; email?: string }
): Promise<ApplicationsResponse> {
  const urlParams = new URLSearchParams();
  
  if (searchParams.name) urlParams.append('name', searchParams.name);
  if (searchParams.phone) urlParams.append('phone', searchParams.phone);
  if (searchParams.email) urlParams.append('email', searchParams.email);
  
  const url = `${ZOHO_BASE_URL}/visa_applications/spouse/applications/search?${urlParams.toString()}`;
  
  return fetcher<ApplicationsResponse>(url);
}


export async function getSpouseApplicationById(id: string, queryId?: string): Promise<ApplicationDetailsResponse> {
  let url = `${ZOHO_BASE_URL}/visa_applications/spouse/applications/${id}`;
  
  if (queryId) {
    url += `?id=${queryId}`;
  }
  
  return fetcher<ApplicationDetailsResponse>(url);
}
