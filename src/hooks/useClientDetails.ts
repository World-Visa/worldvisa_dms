import { useQuery } from "@tanstack/react-query";
import { ZOHO_BASE_URL } from "@/lib/config/api";
import { fetcher } from "@/lib/fetcher";
import type { ClientRecord } from "./useClients";

export interface ClientDocument {
  _id: string;
  workdrive_file_id: string;
  file_name: string;
  document_name: string;
  document_category: string;
  uploaded_by: string;
  status: "pending" | "reviewed" | "rejected";
  uploaded_at: string;
}

export interface ClientDetailsResponse {
  status: string;
  data: {
    client: ClientRecord;
    documents: {
      data: ClientDocument[];
      totalRecords: number;
      totalPages: number;
      currentPage: number;
      limit: number;
      documents_by_status: Record<string, number>;
    };
  };
}

const fetchClientDetails = async (id: string): Promise<ClientDetailsResponse> => {
  return fetcher<ClientDetailsResponse>(`${ZOHO_BASE_URL}/clients/${id}`);
};

export function useClientDetails(id: string) {
  return useQuery({
    queryKey: ["client-details", id],
    queryFn: () => fetchClientDetails(id),
    enabled: Boolean(id),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
