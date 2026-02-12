export interface VisaApplication {
  id: string;
  Name: string;
  Email: string;
  Phone?: string;
  Application_Handled_By: string;
  AttachmentCount: number;
  Created_Time?: string;
  Record_Type?: string;
}

export interface Application {
  id: string;
  Name: string;
  Email: string;
  Phone: string;
  Created_Time: string;
  Application_Handled_By: string;
  AttachmentCount: number;
  // Optional visa-related properties
  Qualified_Country?: string;
  Service_Finalized?: string;
  Suggested_Anzsco?: string;
  Send_Check_List?: string;
  Assessing_Authority?: string;
  DMS_Application_Status?: string;
  Application_Stage?: string;
  Package_Finalize?: string;
  Deadline_For_Lodgment?: string;
  Record_Type?: string;
  Main_Applicant?: string;
  Spouse_Skill_Assessment?: string | null;
  Spouse_Name?: string | null;
}

export interface Document {
  _id: string;
  record_id: string;
  workdrive_file_id: string;
  workdrive_parent_id: string;
  file_name: string;
  uploaded_by: string;
  status: "pending" | "approved" | "reviewed" | "request_review" | "rejected";
  reject_message?: string;
  history: Array<{
    status: string;
    changed_by: string;
    _id: string;
    changed_at: string;
  }>;
  uploaded_at: string;
  document_link?: string;
  download_url?: string;
  comments: Array<{
    _id: string;
    comment: string;
    added_by: string;
    added_at: string;
  }>;
  document_name?: string;
  document_category?: string;
  document_type?: string;
  company_name?: string;
  description?: string;
  __v: number;
}

export type DocumentStatus = Document["status"];

export interface DocumentStatusUpdate {
  documentId: string;
  status: DocumentStatus;
  changedBy: string;
  changedAt: string;
}

export interface DocumentsResponse {
  success: boolean;
  data: Document[];
}

export interface ApplicationDetailsResponse {
  data: Application;
}

export interface ApplicationsResponse {
  data: VisaApplication[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    limit: number;
  };
}

export interface ApplicationsFilters {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  recentActivity?: boolean;
  handledBy?: string[];
  applicationStage?: string[];
  applicationState?: "Active" | "In-Active";
}

export interface SearchParams {
  name?: string;
  phone?: string;
  email?: string;
  word?: string;
}
