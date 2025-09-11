'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Building2, Calendar } from 'lucide-react';
import { Company } from '@/types/documents';

interface CompanyHeaderProps {
  company: Company;
  onRemove: () => void;
}

export function CompanyHeader({ company, onRemove }: CompanyHeaderProps) {
  const formatDate = (dateString: string) => {
    const [year, month] = dateString.split('-');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const calculateDuration = (fromDate: string, toDate: string) => {
    const from = new Date(fromDate + '-01');
    const to = new Date(toDate + '-01');
    
    let years = to.getFullYear() - from.getFullYear();
    let months = to.getMonth() - from.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (years === 0) {
      return months === 1 ? '1 month' : `${months} months`;
    } else if (months === 0) {
      return years === 1 ? '1 year' : `${years} years`;
    } else {
      const yearText = years === 1 ? '1 year' : `${years} years`;
      const monthText = months === 1 ? '1 month' : `${months} months`;
      return `${yearText} ${monthText}`;
    }
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
                  <span>{formatDate(company.fromDate)} - {formatDate(company.toDate)}</span>
                </div>
                <div className="text-gray-400">•</div>
                <span className="font-medium text-blue-600">
                  {calculateDuration(company.fromDate, company.toDate)}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
