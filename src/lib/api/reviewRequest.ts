import { fetcher } from '@/lib/fetcher';

export interface ReviewRequestData {
  requested_by: string;
  requested_to: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
}

export interface ReviewRequestResponse {
  success: boolean;
  message: string;
  data?: {
    _id: string;
    document_id: string;
    requested_by: string;
    requested_to: string;
    status: string;
    message: string;
    created_at: string;
    updated_at: string;
  };
}

export interface ReviewRequestError {
  success: false;
  message: string;
  error?: string;
}

/**
 * Creates a review request for a document
 * @param documentId - The ID of the document to request review for
 * @param data - Review request data
 * @returns Promise<ReviewRequestResponse>
 */
export async function createReviewRequest(
  documentId: string,
  data: ReviewRequestData
): Promise<ReviewRequestResponse> {
  const startTime = Date.now();
  
  try {
    
    const response = await fetcher(`https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms/visa_applications/documents/${documentId}/requested_reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }) as ReviewRequestResponse;

    const responseTime = Date.now() - startTime;

    // Log performance metrics
    if (responseTime > 3000) {
      console.warn(`Slow review request response: ${responseTime}ms`);
    }

    // Check if response exists and has success field
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response format from server');
    }

    // Handle empty response object (common when server returns 200 with no body)
    if (Object.keys(response).length === 0) {
      // Return a success response structure
      return {
        success: true,
        message: 'Review request created successfully',
        data: {
          _id: 'temp-id',
          document_id: documentId,
          requested_by: data.requested_by,
          requested_to: data.requested_to,
          status: data.status,
          message: data.message,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    }

    if (response.success === false) {
      throw new Error(response.message || 'Failed to create review request');
    }

    // If success field is missing, assume it's successful for 200 status
    if (response.success === undefined) {
      console.warn('Response missing success field, assuming success for 200 status');
      return {
        ...response,
        success: true,
        message: response.message || 'Review request created successfully'
      };
    }

    return response;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Enhanced error logging
    console.error('Review request failed:', {
      documentId,
      data,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      responseTime,
      url: `https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms/visa_applications/documents/${documentId}/requested_reviews`
    });

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
      } else if (error.message.includes('401')) {
        throw new Error('Authentication failed: Please log in again.');
      } else if (error.message.includes('403')) {
        throw new Error('Access denied: You do not have permission to perform this action.');
      } else if (error.message.includes('404')) {
        throw new Error('Document not found: The document may have been deleted.');
      } else if (error.message.includes('500')) {
        throw new Error('Server error: Please try again later.');
      }
    }

    throw error;
  }
}

/**
 * Creates multiple review requests for multiple documents
 * @param requests - Array of document IDs and their respective review request data
 * @returns Promise<ReviewRequestResponse[]>
 */
export async function createMultipleReviewRequests(
  requests: Array<{ documentId: string; data: ReviewRequestData }>
): Promise<ReviewRequestResponse[]> {
  const startTime = Date.now();
  
  try {
    // Process requests in parallel for better performance
    const promises = requests.map(({ documentId, data }) =>
      createReviewRequest(documentId, data)
    );

    const results = await Promise.allSettled(promises);
    const responseTime = Date.now() - startTime;

    // Log performance metrics
    if (responseTime > 5000) {
      console.warn(`Slow multiple review requests response: ${responseTime}ms`);
    }

    // Process results and handle partial failures
    const successful: ReviewRequestResponse[] = [];
    const failed: Array<{ documentId: string; error: Error }> = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({
          documentId: requests[index].documentId,
          error: result.reason
        });
      }
    });

    // If all requests failed, throw an error
    if (failed.length === requests.length) {
      throw new Error('All review requests failed');
    }

    // If some requests failed, log warnings but return successful ones
    if (failed.length > 0) {
      console.warn(`${failed.length} out of ${requests.length} review requests failed:`, failed);
    }

    return successful;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('Multiple review requests failed:', {
      requestCount: requests.length,
      error,
      responseTime
    });

    throw error;
  }
}
