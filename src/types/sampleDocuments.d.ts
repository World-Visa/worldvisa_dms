export interface SampleDocument {
  _id: string;
  document_name: string;
  type: string;
  lead_id: string;
  createdAt: string;
  updatedAt: string;
  zoho_workdrive_id?: string;
  zoho_parent_id?: string;
  download_url?: string;
  document_link?: string;
  __v?: number;
}

export interface SampleDocumentsResponse {
  success: boolean;
  data: SampleDocument[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    limit: number;
  };
  message?: string;
}

export interface UploadSampleDocumentRequest {
  applicationId: string;
  document_name: string;
  files: File[];
  type?: string;
}

export interface UploadSampleDocumentResponse {
  success: boolean;
  data: SampleDocument;
  message?: string;
}

export interface UpdateSampleDocumentRequest {
  applicationId: string;
  documentId: string;
  data: {
    document_name?: string;
    type?: string;
  };
}

export interface DeleteSampleDocumentResponse {
  success: boolean;
  message: string;
}
