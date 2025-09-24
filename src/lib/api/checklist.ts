/**
 * Checklist API Integration
 *
 * This module handles all API interactions for the dynamic checklist system.
 * Provides clean, type-safe methods for CRUD operations on checklist items.
 */

import { fetcher } from "@/lib/fetcher";
import type {
  ChecklistApiResponse,
  ChecklistCreateRequest,
  ChecklistDeleteRequest,
  ChecklistItem,
  ChecklistResponse,
  ChecklistUpdateRequest,
} from "@/types/checklist";
import {
  AddDescriptionRequest,
  AddDescriptionResponse,
} from "@/types/description";

const API_BASE_URL = "https://worldvisagroup-19a980221060.herokuapp.com";

/**
 * Get all checklist items for an application
 */
export async function getChecklist(
  applicationId: string
): Promise<ChecklistResponse> {
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
        description?: string;
      }>;
    };
  }>(`${url}?${params.toString()}`);

  // Transform the nested response to match our expected structure
  const transformedData = (response.data?.checklist || []).map((item) => ({
    checklist_id: item._id,
    document_type: item.document_type,
    document_category: item.document_category,
    required: item.required,
    description: item.description,
  }));
  
  return {
    success: response.status === "success",
    data: transformedData,
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
    ...item,
  };

  return fetcher<ChecklistApiResponse<ChecklistItem>>(
    `${url}?${params.toString()}`,
    {
      method: "POST",
      body: JSON.stringify(requestItem),
    }
  );
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
    ...item,
  };

  return fetcher<ChecklistApiResponse<ChecklistItem>>(
    `${url}?${params.toString()}`,
    {
      method: "PUT",
      body: JSON.stringify(requestItem),
    }
  );
}

export async function updateDescription(
  applicationId: string,
  item: AddDescriptionRequest
): Promise<AddDescriptionResponse> {
  // Validate input parameters
  if (!applicationId || !item.checklist_id) {
    throw new Error('Application ID and Checklist ID are required');
  }

  if (!item.description || item.description.trim().length === 0) {
    throw new Error('Description cannot be empty');
  }

  if (item.description.length > 1000) {
    throw new Error('Description cannot exceed 1000 characters');
  }

  const url = `${API_BASE_URL}/api/zoho_dms/visa_applications/checklist/${applicationId}`;
  const params = new URLSearchParams({ record_id: applicationId });

  try {
    const response = await fetcher<AddDescriptionResponse>(`${url}?${params.toString()}`, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: item.description.trim(),
        checklist_id: item.checklist_id,
      }),
    });

    // Validate response
    if (!response || response.status !== 'success') {
      throw new Error(response?.message || 'Failed to update description');
    }

    return response;
  } catch (error) {
    // Enhanced error handling
    if (error instanceof Error) {
      throw new Error(`Failed to update description: ${error.message}`);
    }
    throw new Error('An unexpected error occurred while updating description');
  }
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
    method: "DELETE",
    body: JSON.stringify(request),
  });
}

/**
 * Batch save multiple checklist items with enhanced error handling and partial success support
 * This is more efficient than individual API calls and provides better user experience
 */
export async function saveChecklist(
  applicationId: string,
  items: ChecklistCreateRequest[]
): Promise<ChecklistApiResponse<ChecklistItem[]>> {
  // Input validation
  if (!applicationId || typeof applicationId !== 'string') {
    throw new Error('Valid application ID is required');
  }
  
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('At least one checklist item is required');
  }

  // Validate each item before processing
  const validationErrors: string[] = [];
  items.forEach((item, index) => {
    if (!item.document_type || typeof item.document_type !== 'string') {
      validationErrors.push(`Item ${index + 1}: document_type is required`);
    }
    if (!item.document_category || typeof item.document_category !== 'string') {
      validationErrors.push(`Item ${index + 1}: document_category is required`);
    }
    if (typeof item.required !== 'boolean') {
      validationErrors.push(`Item ${index + 1}: required must be a boolean`);
    }
  });

  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
  }

  // Process items in batches to avoid overwhelming the server
  const BATCH_SIZE = 5;
  const batches: ChecklistCreateRequest[][] = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    batches.push(items.slice(i, i + BATCH_SIZE));
  }

  const successful: ChecklistItem[] = [];
  const errors: Array<{ index: number; item: ChecklistCreateRequest; error: string }> = [];

  // Process each batch sequentially to avoid rate limiting
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchPromises = batch.map((item, itemIndex) => {
      const globalIndex = batchIndex * BATCH_SIZE + itemIndex;
      return createChecklistItem(applicationId, item)
        .then(result => ({ success: true, data: result.data, index: globalIndex, item }))
        .catch(error => ({ 
          success: false, 
          error: error.message || 'Unknown error', 
          index: globalIndex, 
          item 
        }));
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        if (result.value.success && 'data' in result.value) {
          successful.push(result.value.data);
        } else if (!result.value.success && 'error' in result.value) {
          errors.push({
            index: result.value.index,
            item: result.value.item,
            error: result.value.error
          });
        }
      } else {
        // This shouldn't happen since we're catching errors in the promise
        errors.push({
          index: -1,
          item: {} as ChecklistCreateRequest,
          error: result.reason?.message || 'Unknown error'
        });
      }
    });

    // Add a small delay between batches to be respectful to the server
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Enhanced error reporting with specific details
  if (errors.length > 0) {
    const errorDetails = errors.map(({ index, item, error }) => 
      `Item ${index + 1} (${item.document_type}): ${error}`
    ).join('; ');
    
    // If we have some successful saves, provide partial success information
    if (successful.length > 0) {
      console.warn(`Partial success: ${successful.length} items saved, ${errors.length} failed`);
      // For now, we'll still throw an error, but you could modify this to return partial success
      throw new Error(
        `Failed to save ${errors.length} out of ${items.length} items. ` +
        `Successfully saved: ${successful.length} items. ` +
        `Errors: ${errorDetails}`
      );
    } else {
      throw new Error(
        `Failed to save all ${items.length} items. ` +
        `Errors: ${errorDetails}`
      );
    }
  }

  return {
    success: true,
    data: successful,
  };
}

/**
 * Batch update multiple checklist items
 */
export async function updateChecklist(
  applicationId: string,
  items: ChecklistUpdateRequest[]
): Promise<ChecklistApiResponse<ChecklistItem[]>> {
  const promises = items.map((item) =>
    updateChecklistItem(applicationId, item)
  );
  const results = await Promise.allSettled(promises);

  const successful: ChecklistItem[] = [];
  const errors: Error[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      successful.push(result.value.data);
    } else {
      errors.push(
        new Error(
          `Failed to update item ${index + 1}: ${result.reason.message}`
        )
      );
    }
  });

  if (errors.length > 0) {
    throw new Error(
      `Failed to update ${errors.length} items: ${errors
        .map((e) => e.message)
        .join(", ")}`
    );
  }

  return {
    success: true,
    data: successful,
  };
}

/**
 * Batch delete multiple checklist items
 */
export async function deleteChecklist(
  applicationId: string,
  checklistIds: string[]
): Promise<ChecklistApiResponse<void>> {
  const promises = checklistIds.map((id) =>
    deleteChecklistItem(applicationId, { checklist_id: id })
  );
  const results = await Promise.allSettled(promises);

  const errors: Error[] = [];
  const successfulDeletions: number[] = [];

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      const errorMessage = result.reason.message || "Unknown error";

      // Consider "not found" errors as successful deletions since the end result is the same
      if (
        errorMessage.includes("not found") ||
        errorMessage.includes("Checklist item not found")
      ) {
        successfulDeletions.push(index + 1);
      } else {
        errors.push(
          new Error(`Failed to delete item ${index + 1}: ${errorMessage}`)
        );
      }
    } else {
      successfulDeletions.push(index + 1);
    }
  });

  // Only throw an error if there are actual failures (not just "not found" errors)
  if (errors.length > 0) {
    throw new Error(
      `Failed to delete ${errors.length} items: ${errors
        .map((e) => e.message)
        .join(", ")}`
    );
  }

  return {
    success: true,
    data: undefined,
  };
}
