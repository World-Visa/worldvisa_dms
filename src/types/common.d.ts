export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export type UserRole = 'admin' | 'client' | 'master-admin' | 'team-leader' | 'supervisor';

export type RequestedDocumentType = 'requested-to-me' | 'my-requests' | 'all-requests';

export interface FilterParams {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: unknown;
}

// Quality Check Types
export interface QualityCheckRequest {
  reqUserName: string;
  leadId: string;
  recordType: string;
}

export interface QualityCheckResponse {
  success: boolean;
  message?: string;
  data?: {
    _id: string;
    leadId: string;
    reqUserName: string;
    createdAt: string;
    status: string;
  };
}
