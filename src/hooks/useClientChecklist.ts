import { useQuery } from '@tanstack/react-query';
import { fetcher } from '@/lib/fetcher';
import { ChecklistResponse } from '@/types/checklist';

interface ChecklistItem {
  document_category: string;
  document_type: string;
  required: boolean;
  _id: string;
  company_name?: string;
}

interface ChecklistApiResponse {
  status: string;
  data: {
    checklist: ChecklistItem[];
  };
}

const API_BASE_URL = 'https://worldvisagroup-19a980221060.herokuapp.com';

export function useClientChecklist(applicationId: string) {
  return useQuery({
    queryKey: ['client-checklist', applicationId],
    queryFn: async (): Promise<ChecklistResponse> => {
      try {
        // Use the main checklist endpoint (same as admin)
        const url = `${API_BASE_URL}/api/zoho_dms/visa_applications/checklist/${applicationId}`;
        const params = new URLSearchParams({ record_id: applicationId });
        
        const response = await fetcher<ChecklistApiResponse>(`${url}?${params.toString()}`);
        
        // Handle the actual API response structure
        if (response.status === 'success' && response.data && response.data.checklist) {
          return {
            success: true,
            data: response.data.checklist.map((item) => ({
              document_category: item.document_category,
              document_type: item.document_type,
              required: item.required,
              _id: item._id,
              company_name: item.company_name
            }))
            
          };
        }
        
        // Fallback to original response format
        return {
          success: true,
          data: []
        };
      } catch (error) {
        if (error instanceof Error && (
          error.message.includes('User not found') || 
          error.message.includes('404') ||
          error.message.includes('Not found')
        )) {
          console.log('Client checklist not found yet, returning empty checklist');
          return { success: true, data: [] };
        }
        throw error;
      }
    },
    enabled: !!applicationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Reduce retries since we handle the error gracefully
    retryOnMount: false,
    refetchOnWindowFocus: false,
  });
}
