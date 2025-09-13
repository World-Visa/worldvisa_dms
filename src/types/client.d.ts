// Client API Response Types

export interface ClientApplicationResponse {
  data: {
    Email: string;
    Phone: string;
    Created_Time: string;
    Application_Handled_By: string;
    id: string;
    Name: string;
    AttachmentCount: number;
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
  uploaded_by: string;
  status: 'pending' | 'approved' | 'rejected';
  history: Array<{
    status: string;
    changed_by: string;
    _id: string;
    changed_at: string;
  }>;
  download_url: string;
  document_link: string;
  uploaded_at: string;
  comments: any[];
  __v: number;
  requested_reviews: any[];
}

export interface ClientDocumentsResponse {
  status: 'success' | 'error';
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
  status: 'success' | 'error';
  message?: string;
  data?: {
    document: ClientDocument;
  };
}
