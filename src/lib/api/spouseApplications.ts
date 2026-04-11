import { fetcher } from "../fetcher";
import {
  ApplicationsResponse,
  ApplicationsFilters,
  ApplicationDetailsResponse,
  SearchParams,
} from "@/types/applications";
import { ZOHO_BASE_URL } from "@/lib/config/api";

export async function getSpouseApplications(
  filters: ApplicationsFilters,
): Promise<ApplicationsResponse> {
  const searchParams = new URLSearchParams();

  if (filters.page) searchParams.append("page", filters.page.toString());
  if (filters.limit) searchParams.append("limit", filters.limit.toString());


  if (filters.handledBy && filters.handledBy.length > 0) {
    for (const admin of filters.handledBy) {
      searchParams.append("handledBy", admin);
    }
  }

  if (filters.applicationStage && filters.applicationStage.length > 0) {
    for (const stage of filters.applicationStage) {
      searchParams.append("applicationStage", stage);
    }
  }

  if (filters.applicationState) {
    searchParams.append("applicationState", filters.applicationState);
  }

  if (filters.deadlineCategory)
    searchParams.append("deadlineCategory", filters.deadlineCategory);

  if (filters.country) searchParams.append("country", filters.country);

  const url = `${ZOHO_BASE_URL}/visa_applications/spouse/applications?${searchParams.toString()}`;

  return fetcher<ApplicationsResponse>(url);
}

export async function searchSpouseApplications(
  params: SearchParams,
): Promise<ApplicationsResponse> {
  const term = params.search?.trim();
  if (!term) {
    throw new Error("A search term is required");
  }

  const urlParams = new URLSearchParams();
  urlParams.set("search", term);
  if (params.country) urlParams.set("country", params.country);
  if (params.page != null) urlParams.set("page", String(params.page));
  if (params.limit != null) urlParams.set("limit", String(params.limit));

  const url = `${ZOHO_BASE_URL}/visa_applications/spouse/applications?${urlParams.toString()}`;

  return fetcher<ApplicationsResponse>(url);
}

export async function getSpouseApplicationById(
  id: string,
  queryId?: string,
): Promise<ApplicationDetailsResponse> {
  let url = `${ZOHO_BASE_URL}/visa_applications/spouse/applications/${id}`;

  if (queryId) {
    url += `?id=${queryId}`;
  }

  return fetcher<ApplicationDetailsResponse>(url);
}
