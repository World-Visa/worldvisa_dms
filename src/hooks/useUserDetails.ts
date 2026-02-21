import { useQuery } from "@tanstack/react-query";
import { ZOHO_BASE_URL } from "@/lib/config/api";
import { fetcher } from "@/lib/fetcher";

export interface UserDetailInfo {
  _id: string;
  username: string;
  role: "master_admin" | "admin" | "team_leader" | "supervisor";
  last_login: string | null;
}

export interface ReviewDocument {
  _id: string;
  record_id: string;
  document_name: string;
  document_category: string;
  client_name: string;
  review: {
    _id: string;
    requested_to: string;
    status: "pending" | "reviewed";
    requested_at: string;
  };
}

export interface Application {
  id: string;
  Name: string;
  Application_Stage: string | null;
  Deadline_For_Lodgment: string | null;
  Recent_Activity: string | null;
  Record_Type: "visa_application" | "spouse_skill_assessment";
  Package_Finalize?: string;
  Qualified_Country?: string;
  Assessing_Authority?: string;
  DMS_Application_Status: string | null;
}

export interface UserNotification {
  _id: string;
  title?: string;
  message: string;
  category: string;
  type: string;
  isRead: boolean;
  leadId: string;
  documentName?: string;
  applicationType?: string;
  createdAt: string;
}

interface PaginatedResult<T> {
  data: T[];
  totalRecords: number;
  currentPage: number;
  limit: number;
}

export interface UserDetailsResponse {
  status: string;
  data: {
    user: UserDetailInfo;
    reviews_sent: PaginatedResult<ReviewDocument>;
    reviews_received: PaginatedResult<ReviewDocument>;
    applications: Omit<PaginatedResult<Application>, "data"> & { data: Application[] };
    notifications: PaginatedResult<UserNotification>;
  };
}

const fetchUserDetails = async (id: string): Promise<UserDetailsResponse> => {
  return fetcher<UserDetailsResponse>(`${ZOHO_BASE_URL}/users/${id}`);
};

export function useUserDetails(id: string) {
  return useQuery({
    queryKey: ["user-details", id],
    queryFn: () => fetchUserDetails(id),
    enabled: Boolean(id),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
