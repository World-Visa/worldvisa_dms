export type DocumentCategory = 'submitted' | 'all' | 'identity' | 'education' | 'other' | string;

export interface DocumentCategoryInfo {
  id: DocumentCategory;
  label: string;
  count: number;
  fromDate?: string;
  toDate?: string;
}

export interface DocumentChecklistItem {
  category: string;
  documentType: string;
  isUploaded: boolean;
  uploadedDocument?: ApplicationDocument;
}

export interface Company {
  name: string;
  fromDate: string; // Format: "YYYY-MM-DD"
  toDate: string;   // Format: "YYYY-MM-DD"
  category: string; // Format: "WorldVisa Company Documents"
  description?: string; // Experience description with dates
}

export interface DocumentCategoryFilterProps {
  selectedCategory: DocumentCategory;
  onCategoryChange: (category: DocumentCategory) => void;
  categoryCounts?: Partial<Record<DocumentCategory, number>>;
}

import { Document as ApplicationDocument } from './applications';

export interface DocumentChecklistTableProps {
  documents: ApplicationDocument[] | undefined;
  isLoading: boolean;
  error: Error | null;
  applicationId: string;
  selectedCategory: DocumentCategory;
  companies: Company[];
  isClientView?: boolean;
  checklistData?: ChecklistResponse;
  onAddCompany?: () => void;
  onRemoveCompany?: (companyName: string) => void;
}

export interface ApiDocument {
  _id: string;
  record_id: string;
  file_name: string;
  document_name: string;
  document_type: string;
  document_category: string;
  description?: string;
  uploaded_by: string;
  status: string;
  uploaded_at: string;
  download_url: string;
  document_link: string;
}

export interface UploadDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  selectedDocumentType?: string;
  selectedDocumentCategory?: string;
  company?: Company;
  documents?: ApiDocument[];
  isClientView?: boolean;
  onSuccess?: () => void;
}

export interface UploadedFile {
  file: File;
  progress: number;
  id: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
}
