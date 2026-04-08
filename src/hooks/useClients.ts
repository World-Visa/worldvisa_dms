import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS, ZOHO_BASE_URL, buildQueryString } from "@/lib/config/api";
import { fetcher } from "@/lib/fetcher";

export interface ClientApplicationData {
  id: string;
  Name: string;
  Application_Stage: string | null;
  Deadline_For_Lodgment: string | null;
  Package_Finalize?: string;
  Qualified_Country?: string;
  Assessing_Authority?: string;
  Record_Type?: string;
  DMS_Application_Status: string | null;
  Email?: string;
  Recent_Activity?: string | null;
}

export interface ClientRecord {
  _id: string;
  name: string;
  email: string;
  phone: string;
  password_value: string;
  lead_id: string;
  lead_owner: string;
  record_type: "visa_application" | "spouse_skill_assessment";
  created_at: string;
  __v: number;
  total_documents: number;
  documents_by_status: Record<string, number>;
  application_data: ClientApplicationData | null;
  clerk_id?: string;
  clerk_invitation_id?: string;
  profile_image_url?: string;
}

interface ClientsPaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
}

export interface ClientsResponse {
  status: string;
  results: number;
  pagination: ClientsPaginationInfo;
  data: {
    clients: ClientRecord[];
  };
}

interface UseClientsParams {
  page: number;
  limit: number;
  search?: string;
  lead_owner?: string;
  invited?: boolean;
}

function normalizeSearchValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? "";
  if (trimmed.length < 2) return undefined;
  return trimmed;
}

/** Normalizes `/clients/all` JSON whether the list is under `data.clients`, `data` as array, or top-level `clients`. */
function normalizeClientsResponse(raw: unknown, fallbackLimit: number): ClientsResponse {
  if (!raw || typeof raw !== "object") {
    return {
      status: "",
      results: 0,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        limit: fallbackLimit,
      },
      data: { clients: [] },
    };
  }

  const r = raw as Record<string, unknown>;

  let clients: ClientRecord[] = [];
  const dataBlock = r.data;
  if (Array.isArray(dataBlock)) {
    clients = dataBlock as ClientRecord[];
  } else if (dataBlock && typeof dataBlock === "object") {
    const d = dataBlock as Record<string, unknown>;
    if (Array.isArray(d.clients)) {
      clients = d.clients as ClientRecord[];
    }
  }
  if (clients.length === 0 && Array.isArray(r.clients)) {
    clients = r.clients as ClientRecord[];
  }

  const pag = r.pagination;
  let resolvedLimit = fallbackLimit;
  let currentPage = 1;
  let totalRecords = clients.length;
  let totalPages = 1;

  if (pag && typeof pag === "object") {
    const p = pag as Record<string, unknown>;
    currentPage = Math.max(1, Number(p.currentPage ?? p.current_page ?? 1) || 1);
    totalRecords = Math.max(0, Number(p.totalRecords ?? p.total_records ?? 0) || 0);
    resolvedLimit = Number(p.limit ?? fallbackLimit) || fallbackLimit;
    totalPages = Math.max(0, Number(p.totalPages ?? p.total_pages ?? 0) || 0);
    if (totalPages < 1 && totalRecords > 0 && resolvedLimit > 0) {
      totalPages = Math.ceil(totalRecords / resolvedLimit);
    }
    if (clients.length > 0 && totalPages < 1) {
      totalPages = 1;
    }
    if (totalPages < 1) {
      totalPages = 1;
    }
    if (totalRecords < clients.length) {
      totalRecords = clients.length;
    }
  } else if (clients.length > 0) {
    totalRecords = clients.length;
    totalPages = 1;
  }

  return {
    status: String(r.status ?? ""),
    results: Number(r.results ?? clients.length) || clients.length,
    pagination: {
      currentPage,
      totalPages,
      totalRecords,
      limit: resolvedLimit,
    },
    data: { clients },
  };
}

const fetchClients = async (params: UseClientsParams): Promise<ClientsResponse> => {
  const search = normalizeSearchValue(params.search);
  const queryString = buildQueryString({
    page: params.page,
    limit: params.limit,
    search,
    lead_owner: params.lead_owner || undefined,
    invited: params.invited || undefined,
  });

  const url = queryString ? API_ENDPOINTS.CLIENTS.LIST(queryString) : `${ZOHO_BASE_URL}/clients/all`;

  const raw = await fetcher<unknown>(url);
  return normalizeClientsResponse(raw, params.limit);
};

export function useClients(params: UseClientsParams) {
  const normalizedSearch = normalizeSearchValue(params.search) ?? "";
  const normalizedLeadOwner = params.lead_owner ?? "";
  const invitedFlag = params.invited ? "true" : "false";

  return useQuery({
    queryKey: [
      "clients-v2",
      params.page,
      params.limit,
      invitedFlag,
      normalizedLeadOwner,
      normalizedSearch,
    ],
    queryFn: () => fetchClients(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}
