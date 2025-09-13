/**
 * Checklist API Integration
 * 
 * This module handles all API interactions for the dynamic checklist system.
 * Provides clean, type-safe methods for CRUD operations on checklist items.
 */

import { fetcher } from '@/lib/fetcher';
import type {
  ChecklistItem,
  ChecklistResponse,
  ChecklistCreateRequest,
  ChecklistUpdateRequest,
  ChecklistDeleteRequest,
  ChecklistApiResponse
} from '@/types/checklist';

const API_BASE_URL = 'https://worldvisagroup-19a980221060.herokuapp.com';

/**
 * Get all checklist items for an application
 */
export async function getChecklist(applicationId: string): Promise<ChecklistResponse> {
  const url = `${API_BASE_URL}/api/zoho_dms/visa_applications/checklist/${applicationId}`;
  const params = new URLSearchParams({ record_id: applicationId });
  
  const response = await fetcher<{
    status: string;
    data: {
      checklist: Array<{
        _id: string;
        document_type: string;
        document_category: string;
        required: boolean;
      }>;
    };
  }>(`${url}?${params.toString()}`);
  
  // Transform the nested response to match our expected structure
  const transformedData = (response.data?.checklist || []).map(item => ({
    checklist_id: item._id,
    document_type: item.document_type,
    document_category: item.document_category,
    required: item.required,
  }));
  
  return {
    success: response.status === 'success',
    data: transformedData
  };
}

/**
 * Create a new checklist item
 */
export async function createChecklistItem(
  applicationId: string,
  item: ChecklistCreateRequest
): Promise<ChecklistApiResponse<ChecklistItem>> {
  const url = `${API_BASE_URL}/api/zoho_dms/visa_applications/checklist/${applicationId}`;
  const params = new URLSearchParams({ record_id: applicationId });
   
  const requestItem = {
    ...item
  };
  
  
  return fetcher<ChecklistApiResponse<ChecklistItem>>(`${url}?${params.toString()}`, {
    method: 'POST',
    body: JSON.stringify(requestItem)
  });
}

/**
 * Update an existing checklist item
 */
export async function updateChecklistItem(
  applicationId: string,
  item: ChecklistUpdateRequest
): Promise<ChecklistApiResponse<ChecklistItem>> {
  const url = `${API_BASE_URL}/api/zoho_dms/visa_applications/checklist/${applicationId}`;
  const params = new URLSearchParams({ record_id: applicationId });
  
  const requestItem = {
    ...item
  };
  
  return fetcher<ChecklistApiResponse<ChecklistItem>>(`${url}?${params.toString()}`, {
    method: 'PUT',
    body: JSON.stringify(requestItem)
  });
}

/**
 * Delete a checklist item
 */
export async function deleteChecklistItem(
  applicationId: string,
  request: ChecklistDeleteRequest
): Promise<ChecklistApiResponse<void>> {
  const url = `${API_BASE_URL}/api/zoho_dms/visa_applications/checklist/${applicationId}`;
  const params = new URLSearchParams({ record_id: applicationId });
  
  return fetcher<ChecklistApiResponse<void>>(`${url}?${params.toString()}`, {
    method: 'DELETE',
    body: JSON.stringify(request)
  });
}

/**
 * Batch save multiple checklist items
 * This is more efficient than individual API calls
 */
export async function saveChecklist(
  applicationId: string,
  items: ChecklistCreateRequest[]
): Promise<ChecklistApiResponse<ChecklistItem[]>> {
  const promises = items.map(item => createChecklistItem(applicationId, item));
  const results = await Promise.allSettled(promises);
  
  const successful: ChecklistItem[] = [];
  const errors: Error[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push(result.value.data);
    } else {
      errors.push(new Error(`Failed to save item ${index + 1}: ${result.reason.message}`));
    }
  });
  
  if (errors.length > 0) {
    throw new Error(`Failed to save ${errors.length} items: ${errors.map(e => e.message).join(', ')}`);
  }
  
  return {
    success: true,
    data: successful
  };
}

/**
 * Batch update multiple checklist items
 */
export async function updateChecklist(
  applicationId: string,
  items: ChecklistUpdateRequest[]
): Promise<ChecklistApiResponse<ChecklistItem[]>> {
  const promises = items.map(item => updateChecklistItem(applicationId, item));
  const results = await Promise.allSettled(promises);
  
  const successful: ChecklistItem[] = [];
  const errors: Error[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push(result.value.data);
    } else {
      errors.push(new Error(`Failed to update item ${index + 1}: ${result.reason.message}`));
    }
  });
  
  if (errors.length > 0) {
    throw new Error(`Failed to update ${errors.length} items: ${errors.map(e => e.message).join(', ')}`);
  }
  
  return {
    success: true,
    data: successful
  };
}

/**
 * Batch delete multiple checklist items
 */
export async function deleteChecklist(
  applicationId: string,
  checklistIds: string[]
): Promise<ChecklistApiResponse<void>> {
  const promises = checklistIds.map(id => 
    deleteChecklistItem(applicationId, { checklist_id: id })
  );
  const results = await Promise.allSettled(promises);
  
  const errors: Error[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      errors.push(new Error(`Failed to delete item ${index + 1}: ${result.reason.message}`));
    }
  });
  
  if (errors.length > 0) {
    throw new Error(`Failed to delete ${errors.length} items: ${errors.map(e => e.message).join(', ')}`);
  }
  
  return {
    success: true,
    data: undefined
  };
}
