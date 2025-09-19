// Client API Response Types

import { Comment } from "./comments";

export interface ClientApplicationResponse {
  data: {
    Email: string;
    Phone: string;
    Created_Time: string;
    Application_Handled_By: string;
    id: string;
    Name: string;
    AttachmentCount: number;
    DMS_Application_Status?: string;
    leadId?: string;
    Checklist_Requested?: boolean;
    Checklist_Requested_At?: string;
  };
}

export interface ClientDocument {
  _id: string;
  record_id: string;
  workdrive_file_id: string;
  workdrive_parent_id: string;
  file_name: string;
  document_name: string;
  document_category: string;
  description?: string;
  uploaded_by: string;
  status: "pending" | "approved" | "rejected";
  history: Array<{
    status: string;
    changed_by: string;
    _id: string;
    changed_at: string;
  }>;
  download_url: string;
  document_link: string;
  uploaded_at: string;
  comments: Comment[];
  __v: number;
  requested_reviews: unknown[];
}

export interface ClientDocumentsResponse {
  status: "success" | "error";
  data: {
    documents: ClientDocument[];
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    limit: number;
  };
}

export interface ClientDocumentUploadRequest {
  file: File;
  document_name: string;
  document_category: string;
  company_name?: string;
}

export interface ClientDocumentUploadResponse {
  status: "success" | "error";
  message?: string;
  data?: {
    document: ClientDocument;
  };
}
