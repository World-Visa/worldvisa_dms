/**
 * Dynamic Checklist System Types
 *
 * This module defines all types related to the dynamic checklist functionality
 * for managing document requirements per application.
 */

export interface ChecklistItem {
  checklist_id?: string;
  document_type: string;
  document_category: string;
  required: boolean;
  company_name?: string;
  created_at?: string;
  updated_at?: string;
  fromDate?: string;
  toDate?: string;
  description?: string;
}

export interface ChecklistResponse {
  success: boolean;
  data: ChecklistItem[];
  message?: string;
}

export interface ChecklistCreateRequest {
  document_type: string;
  document_category: string;
  required: boolean;
  company_name?: string;
}

export interface ChecklistUpdateRequest {
  checklist_id: string;
  document_type: string;
  document_category: string;
  required: boolean;
}

export interface ChecklistDeleteRequest {
  checklist_id: string;
}

export type ChecklistState = "none" | "creating" | "editing" | "saved";

export type DocumentRequirement = "mandatory" | "optional" | "not_required";

export interface ChecklistCategory {
  id: string;
  label: string;
  count: number;
  type: "base" | "company" | "checklist";
  company_name?: string;
  is_selected?: boolean;
  fromDate?: string;
  toDate?: string;
  isCurrentEmployment?: boolean;
}

export interface ChecklistDocument {
  category: string;
  documentType: string;
  isUploaded: boolean;
  uploadedDocument?: unknown;
  requirement?: DocumentRequirement;
  checklist_id?: string;
  company_name?: string;
  description?: string;
}

export interface ChecklistStateData {
  state: ChecklistState;
  selectedCategories: string[];
  selectedDocuments: ChecklistDocument[];
  companyDocumentsSelected: boolean;
  requirementMap?: Record<string, DocumentRequirement>;
  lastSavedAt?: string;
}

export interface ChecklistFilterOptions {
  showSubmitted: boolean;
  showAll: boolean;
  showIdentity: boolean;
  showEducation: boolean;
  showOther: boolean;
  showCompany: boolean;
  showChecklist: boolean;
}

// Utility type for requirement mapping
export type RequirementMap = Record<string, DocumentRequirement>;

// API response types
export interface ChecklistApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
