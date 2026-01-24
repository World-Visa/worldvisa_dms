import { ApplicationsResponse, ApplicationsFilters, SearchParams } from '@/types/applications';
import { ZOHO_BASE_URL } from '@/lib/config/api';

export async function getApplications(
  filters: ApplicationsFilters,
  authToken?: string
): Promise<ApplicationsResponse> {
  const searchParams = new URLSearchParams();
  
  if (filters.page) searchParams.append('page', filters.page.toString());
  if (filters.limit) searchParams.append('limit', filters.limit.toString());
  
  if (filters.startDate) searchParams.append('startDate', filters.startDate);
  if (filters.endDate) searchParams.append('endDate', filters.endDate);
  
  if (filters.recentActivity) searchParams.append('recentActivity', 'true');
  
  if (filters.handledBy && filters.handledBy.length > 0) {
    filters.handledBy.forEach(admin => {
      searchParams.append('handledBy', admin);
    });
  }

  const url = `${ZOHO_BASE_URL}/visa_applications?${searchParams.toString()}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    headers,
  }); 

  if (!response.ok) {
    throw new Error(`Failed to fetch applications: ${response.statusText}`);
  }

  return response.json();
}


export async function searchApplications(
  searchParams: SearchParams,
  authToken?: string
): Promise<ApplicationsResponse> {
  const urlParams = new URLSearchParams();
  
  if (searchParams.name) urlParams.append('name', searchParams.name);
  if (searchParams.phone) urlParams.append('phone', searchParams.phone);
  if (searchParams.email) urlParams.append('email', searchParams.email);

  const url = `${ZOHO_BASE_URL}/visa_applications/search?${urlParams.toString()}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to search applications: ${response.statusText}`);
  }

  return response.json();
}

