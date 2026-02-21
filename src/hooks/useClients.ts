import { useQuery } from "@tanstack/react-query";
import { ZOHO_BASE_URL, buildQueryString } from "@/lib/config/api";
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
}

interface ClientsPaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
}

interface ClientsResponse {
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
}

const fetchClients = async (params: UseClientsParams): Promise<ClientsResponse> => {
  const queryString = buildQueryString({
    page: params.page,
    limit: params.limit,
    search: params.search || undefined,
    lead_owner: params.lead_owner || undefined,
  });

  const url = queryString
    ? `${ZOHO_BASE_URL}/clients/all?${queryString}`
    : `${ZOHO_BASE_URL}/clients/all`;

  return fetcher<ClientsResponse>(url);
};

export function useClients(params: UseClientsParams) {
  return useQuery({
    queryKey: ["clients-v2", params],
    queryFn: () => fetchClients(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}
