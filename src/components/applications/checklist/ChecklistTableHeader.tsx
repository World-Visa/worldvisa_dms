'use client';

import React, { memo } from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { SearchBox } from '@/components/ui/SearchBox';
import { ChecklistTabs } from './ChecklistTabs';
import { PendingChangesBanner } from './PendingChangesBanner';
import { CompanyInfoDisplay } from './CompanyInfoDisplay';
import { ChecklistState } from '@/types/checklist';
import { Company } from '@/types/documents';
import { generateCompanyDescription } from '@/utils/dateCalculations';

interface ChecklistTableHeaderProps {
  title: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  checklistState: ChecklistState;
  selectedCategory: string;
  activeTab: 'current' | 'available';
  onTabChange: (tab: 'current' | 'available') => void;
  currentCount: number;
  availableCount: number;
  pendingAdditions: any[];
  pendingDeletions: string[];
  pendingUpdates: any[];
  onClearPendingChanges?: () => void;
  onSavePendingChanges?: () => Promise<void>;
  extractedCompanies: Company[];
}

export const ChecklistTableHeader = memo(function ChecklistTableHeader({
  title,
  searchQuery,
  onSearchChange,
  checklistState,
  selectedCategory,
  activeTab,
  onTabChange,
  currentCount,
  availableCount,
  pendingAdditions,
  pendingDeletions,
  pendingUpdates,
  onClearPendingChanges,
  onSavePendingChanges,
  extractedCompanies
}: ChecklistTableHeaderProps) {
  return (
    <CardHeader className="pb-4">
      <div className="flex flex-col gap-4">
        <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
        
        {/* Show tabs for editing mode when not on "All" category */}
        {checklistState === 'editing' && selectedCategory !== 'all' && (
          <ChecklistTabs
            activeTab={activeTab}
            onTabChange={onTabChange}
            currentCount={currentCount}
            availableCount={availableCount}
          />
        )}

        {/* Show pending changes for editing mode */}
        {checklistState === 'editing' && (pendingAdditions.length > 0 || pendingDeletions.length > 0 || pendingUpdates.length > 0) && (
          <PendingChangesBanner
            pendingAdditions={pendingAdditions}
            pendingDeletions={pendingDeletions}
            pendingUpdates={pendingUpdates}
            onClearPendingChanges={onClearPendingChanges}
            onSavePendingChanges={onSavePendingChanges}
          />
        )}
        
        <div className="w-full flex items-center justify-between gap-4">
          <SearchBox
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search documents..."
            aria-label="Search document checklist"
            className="w-full lg:w-[40%]"
          />
          
          <CompanyInfoDisplay
            selectedCategory={selectedCategory}
            extractedCompanies={extractedCompanies}
          />
        </div>
      </div>
    </CardHeader>
  );
});
