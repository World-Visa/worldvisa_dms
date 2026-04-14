import { fetcher } from "./fetcher";
import { ApplicationsResponse, SearchParams } from "@/types/applications";
import { ZOHO_BASE_URL } from "@/lib/config/api";

/**
 * Search visa applications via the same list endpoint as browsing.
 */
export async function searchApplications(
  searchParams: SearchParams,
): Promise<ApplicationsResponse> {
  const term = searchParams.search?.trim();
  if (!term) {
    throw new Error("A search term is required");
  }

  const queryParams = new URLSearchParams();
  queryParams.set("search", term);
  if (searchParams.country) queryParams.set("country", searchParams.country);
  if (searchParams.page != null)
    queryParams.set("page", String(searchParams.page));
  if (searchParams.limit != null)
    queryParams.set("limit", String(searchParams.limit));

  const url = `${ZOHO_BASE_URL}/visa_applications?${queryParams.toString()}`;

  return fetcher<ApplicationsResponse>(url);
}

export function isValidSearchParams(searchParams: SearchParams): boolean {
  return Boolean(searchParams.search?.trim());
}
