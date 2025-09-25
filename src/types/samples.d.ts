/**
 * Sample Document Types
 * 
 * This module defines types related to sample documents functionality
 * for the document checklist system.
 */

export interface SampleDocument {
  id: string;
  name: string;
  path: string;
  documentType: string;
  category: string;
  fileSize?: number;
  lastModified?: string;
  description?: string;
}

export interface DocumentTypeWithSample {
  category: string;
  documentType: string;
  sampleDocument?: string;
  companyName?: string;
}

export interface SampleDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: string;
  category: string;
  samplePath: string;
  companyName?: string;
}

export interface SampleDocumentService {
  getSampleDocument: (documentType: string, category: string) => SampleDocument | null;
  downloadSampleDocument: (samplePath: string, fileName: string) => Promise<void>;
  hasSampleDocument: (documentType: string, category: string) => boolean;
}
