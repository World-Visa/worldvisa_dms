import { fetcher } from "../fetcher";
import { ApplicationsResponse, ApplicationsFilters } from "@/types/applications";

const ZOHO_BASE_URL = "https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms";

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

/**
 * Fetches a specific spouse application by ID with additional query parameter
 */
export async function getSpouseApplicationById(id: string, queryId?: string): Promise<ApplicationsResponse> {
  let url = `${ZOHO_BASE_URL}/visa_applications/spouse/applications/${id}`;
  
  if (queryId) {
    url += `?id=${queryId}`;
  }
  
  return fetcher<ApplicationsResponse>(url);
}
