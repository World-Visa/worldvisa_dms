"use client";

import { Button } from "@/components/ui/button";
import { useChecklistRequest } from "@/hooks/useChecklistRequest";

interface RequestChecklistCardProps {
  leadId: string;
  onRequestSuccess?: () => void;
}

export function RequestChecklistCard({ 
  leadId,
  onRequestSuccess
}: RequestChecklistCardProps) {
  const { 
    requestChecklist, 
    isLoading, 
    isError 
  } = useChecklistRequest({
    onSuccess: () => {
      if (onRequestSuccess) {
        onRequestSuccess();
      }
    },
    leadId
  });

  const handleRequestChecklist = async () => {
    try {
      await requestChecklist(leadId);
    } catch (err) {
      // Error handling is done in the hook
      console.error('Failed to request checklist:', err);
    }
  };

  return (
    <div className="text-center py-16">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-10 max-w-lg mx-auto shadow-sm">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg 
            className="w-8 h-8 text-blue-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          Ready to Get Started
        </h3>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          Your document checklist will be generated shortly. This personalized checklist 
          will help you track all required documents for your visa application process.
        </p>
        
        <Button 
          onClick={handleRequestChecklist}
          disabled={isLoading || isError}
          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg 
                className="w-5 h-5 mr-2 animate-spin" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Requesting...
            </>
          ) : (
            <>
              <svg 
                className="w-5 h-5 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                />
              </svg>
              Request Checklist
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
