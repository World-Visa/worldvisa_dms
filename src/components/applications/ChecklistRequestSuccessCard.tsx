"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, FileText } from "lucide-react";

interface ChecklistRequestSuccessCardProps {
  onRefresh?: () => void;
  requestedAt?: string;
}

export function ChecklistRequestSuccessCard({ 
  onRefresh,
  requestedAt 
}: ChecklistRequestSuccessCardProps) {
  const formatRequestedAt = (dateString?: string) => {
    if (!dateString) return 'recently';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'just now';
      if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } catch {
      return 'recently';
    }
  };

  return (
    <div className="text-center py-16">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-10 max-w-lg mx-auto shadow-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          Checklist Request Submitted
        </h3>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          Your document checklist request has been successfully submitted. Our team will generate 
          a personalized checklist for your visa application within the next 24 hours.
        </p>

        <div className="bg-white rounded-lg p-4 mb-6 border border-green-100">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Requested {formatRequestedAt(requestedAt)}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start space-x-3 text-left">
            <FileText className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">What happens next?</p>
              <p className="text-sm text-gray-600">
                Our processing team will review your application and create a customized checklist.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 text-left">
            <Clock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Timeline</p>
              <p className="text-sm text-gray-600">
                You&apos;ll receive your checklist within 24 hours of submission.
              </p>
            </div>
          </div>
        </div>

        {onRefresh && (
          <div className="mt-6 pt-6 border-t border-green-100">
            <Button 
              onClick={onRefresh}
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
            >
              <FileText className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
