export type DocumentCategory = 'submitted' | 'all' | 'identity' | 'education' | 'other' | string;

export interface DocumentCategoryInfo {
  id: DocumentCategory;
  label: string;
  count: number;
}

export interface DocumentChecklistItem {
  category: string;
  documentType: string;
  isUploaded: boolean;
  uploadedDocument?: ApplicationDocument;
}

export interface Company {
  name: string;
  fromDate: string; // Format: "YYYY-MM"
  toDate: string;   // Format: "YYYY-MM"
  category: string; // Format: "WorldVisa Company Documents"
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
}

export interface UploadDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  selectedDocumentType?: string;
  selectedDocumentCategory?: string;
  company?: Company;
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
