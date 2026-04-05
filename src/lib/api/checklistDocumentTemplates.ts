import { fetcher } from '@/lib/fetcher';
import { API_CONFIG, buildQueryString } from '@/lib/config/api';
import type {
  BulkCreateBody,
  BulkOperationResult,
  BulkUpdateBody,
  CategoriesResponse,
  GroupedResponse,
  SingleDocumentResponse,
  SummaryResponse,
  VisaServiceTypesResponse,
} from '@/types/checklistDocumentTemplates';

const EP = API_CONFIG.ENDPOINTS.CHECKLIST_DOCUMENT_TEMPLATES;

export function getVisaServiceTypes(): Promise<VisaServiceTypesResponse> {
  return fetcher(EP.VISA_TYPES);
}

export function getChecklistSummary(): Promise<SummaryResponse> {
  return fetcher(EP.SUMMARY);
}

export function getGroupedDocuments(
  visaType: string,
  state?: 'active' | 'inactive',
): Promise<GroupedResponse> {
  const qs = buildQueryString({
    visaServiceType: visaType,
    ...(state ? { state } : {}),
  });
  return fetcher(`${EP.GROUPED}?${qs}`);
}

export function getCategories(visaType: string): Promise<CategoriesResponse> {
  const qs = buildQueryString({ visaServiceType: visaType });
  return fetcher(`${EP.CATEGORIES}?${qs}`);
}

export function createDocument(
  formData: FormData,
): Promise<SingleDocumentResponse> {
  return fetcher(EP.BASE, {
    method: 'POST',
    body: formData,
  });
}

export function updateDocument(
  id: string,
  formData: FormData,
): Promise<SingleDocumentResponse> {
  return fetcher(EP.BY_ID(id), {
    method: 'PATCH',
    body: formData,
  });
}

export function updateDocumentState(
  id: string,
  state: 'active' | 'inactive',
): Promise<SingleDocumentResponse> {
  return fetcher(EP.STATE(id), {
    method: 'PATCH',
    body: JSON.stringify({ state }),
  });
}

export function deleteDocument(id: string): Promise<{ status: string; message: string }> {
  return fetcher(EP.BY_ID(id), { method: 'DELETE' });
}

export function bulkCreateDocuments(
  body: BulkCreateBody,
): Promise<BulkOperationResult> {
  return fetcher(EP.BULK, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function bulkUpdateDocuments(
  body: BulkUpdateBody,
): Promise<BulkOperationResult> {
  return fetcher(EP.BULK, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
