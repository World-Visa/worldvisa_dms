// Type definitions for Stage 2 Documents (Outcome, EOI, Invitation)

export type Stage2DocumentType = "outcome" | "eoi" | "invitation";

export interface Stage2Document {
  _id: string;
  record_id: string;
  workdrive_file_id: string;
  workdrive_parent_id: string;
  file_name: string;
  document_name: string;
  document_type: string;
  uploaded_by: string;
  download_url: string;
  document_link: string;
  type: Stage2DocumentType;
  uploaded_at: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  // Optional fields for EOI and Invitation
  subclass?: string;
  state?: string;
  point?: number;
  date?: string;
  deadline?: string;
  // Optional field for Outcome
  outcome_date?: string;
  outcome?: string;
  skill_assessing_body?: string;
}

export interface CreateStage2DocumentRequest {
  applicationId: string;
  files: File[];
  file_name: string;
  document_name: string;
  document_type: string;
  uploaded_by: string;
  type: Stage2DocumentType;
  // Optional fields based on document type
  subclass?: string;
  state?: string;
  point?: number;
  date?: string;
  deadline?: string;
  outcome_date?: string;
  outcome?: string;
  skill_assessing_body?: string;
}

export interface UpdateStage2DocumentRequest {
  applicationId: string;
  documentId: string;
  metadata: {
    document_name?: string;
    subclass?: string;
    state?: string;
    point?: number;
    date?: string;
    deadline?: string;
    outcome_date?: string;
    outcome?: string;
    skill_assessing_body?: string;
  };
}

export interface Stage2DocumentsResponse {
  status: "success" | "error";
  data: Stage2Document[];
  message?: string;
}

export interface UploadStage2DocumentResponse {
  success: boolean;
  data: Stage2Document;
  message?: string;
}

export interface DeleteStage2DocumentResponse {
  success: boolean;
  message: string;
}

// Modal Props Interfaces

export interface OutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  document?: Stage2Document;
  mode?: "create" | "edit";
}

export interface EOIModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  document?: Stage2Document;
  mode?: "create" | "edit";
}

export interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  document?: Stage2Document;
  mode?: "create" | "edit";
}

// Layout Props Interfaces

export interface OutcomeLayoutProps {
  applicationId: string;
}

export interface EOILayoutProps {
  applicationId: string;
}

export interface InvitationLayoutProps {
  applicationId: string;
}
