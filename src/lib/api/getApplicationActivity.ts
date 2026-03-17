import { ZOHO_BASE_URL } from "@/lib/config/api";
import { fetcher } from "../fetcher";

export type ActivityType =
  | "application_created"
  | "document_uploaded"
  | "document_reuploaded"
  | "document_status_changed"
  | "comment_added"
  | "comment_edited"
  | "comment_deleted"
  | "review_requested"
  | "review_status_updated"
  | "review_cancelled"
  | "review_message_added"
  | "quality_check_requested"
  | "quality_check_removed"
  | "checklist_created"
  | "checklist_updated"
  | "checklist_deleted"
  | "note_added"
  | "note_updated"
  | "note_deleted"
  | "email_sent"
  | "email_received";

export type ActivityFilterGroup =
  | "all"
  | "documents"
  | "emails"
  | "quality_check"
  | "notes"
  | "comments"
  | "reviews"
  | "checklists";

export interface ActivityLog {
  _id: string;
  lead_id: string;
  activity_type: ActivityType;
  summary: string;
  actor_type: "staff" | "client";
  actor_name: string;
  actor_role: string | null;
  document_id?: string | null;
  document_name?: string | null;
  document_category?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityPagination {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
}

export interface ActivityResponse {
  status: "success" | "error";
  data: {
    logs: ActivityLog[];
    pagination: ActivityPagination;
  };
}

export interface GetActivityRequest {
  applicationId: string;
  page?: number;
  limit?: number;
  type?: ActivityType;
  token?: string;
}

export async function getApplicationActivity(
  data: GetActivityRequest,
): Promise<ActivityResponse> {
  const { applicationId, page = 1, limit = 20, type, token } = data;

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (type) {
    params.set("type", type);
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetcher<ActivityResponse>(
    `${ZOHO_BASE_URL}/visa_applications/${applicationId}/activity?${params}`,
    {
      method: "GET",
      headers,
    },
  );
}
