'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Building2, Calendar } from 'lucide-react';
import { Company } from '@/types/documents';
import { RemoveCompanyDialog } from './RemoveCompanyDialog';
import { calculateDuration, formatDateForDisplay, generateCompanyDescription } from '@/utils/dateCalculations';

interface CompanyHeaderProps {
  company: Company;
  onRemove: () => void;
}

export function CompanyHeader({ company, onRemove }: CompanyHeaderProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const handleRemoveClick = () => {
    setShowRemoveDialog(true);
  };

  const handleConfirmRemove = () => {
    setShowRemoveDialog(false);
    onRemove();
  };

  return (
    <Card className="mb-4 border border-gray-200 bg-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Building2 className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">
                {company.name}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDateForDisplay(company.fromDate)} - {formatDateForDisplay(company?.toDate || '')}</span>
                </div>
                <div className="text-gray-400">•</div>
                <span className="font-medium text-blue-600">
                  {calculateDuration(company.fromDate, company?.toDate || '')}
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {generateCompanyDescription(company.fromDate, company?.toDate || '')}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveClick}
            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>

      {/* Remove Company Confirmation Dialog */}
      <RemoveCompanyDialog
        isOpen={showRemoveDialog}
        onClose={() => setShowRemoveDialog(false)}
        onConfirm={handleConfirmRemove}
        company={company}
      />
    </Card>
  );
}
