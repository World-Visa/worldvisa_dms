'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Company } from '@/types/documents';
import type { ChecklistState } from '@/types/checklist';

interface AddCompanyButtonProps {
  checklistState: ChecklistState;
  isClientView: boolean;
  hasCompanyDocuments: boolean;
  companies: Company[];
  maxCompanies: number;
  onAddCompany?: () => void;
}

export const AddCompanyButton = memo(function AddCompanyButton({
  checklistState,
  isClientView,
  hasCompanyDocuments,
  companies,
  maxCompanies,
  onAddCompany
}: AddCompanyButtonProps) {
  const shouldShow = (checklistState === 'saved' || isClientView) && hasCompanyDocuments && companies.length < maxCompanies;

  if (!shouldShow) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onAddCompany}
      className={cn(
        'cursor-pointer inline-flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 ease-in-out',
        'border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50',
        'focus:outline-none focus:ring-0',
        'w-full md:w-auto'
      )}
    >
      <Plus className="h-4 w-4" />
      <span>Add Company</span>
    </Button>
  );
});
