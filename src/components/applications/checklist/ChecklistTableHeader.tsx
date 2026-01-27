'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SearchBox } from '@/components/ui/SearchBox';
import { ChecklistDocument, ChecklistState } from '@/types/checklist';
import { Company } from '@/types/documents';
import { Table } from '@tanstack/react-table';
import { ChevronDown } from 'lucide-react';
import { memo } from 'react';
import { ChecklistTabs } from './ChecklistTabs';
import { CompanyInfoDisplay } from './CompanyInfoDisplay';
import { PendingChangesBanner } from './PendingChangesBanner';

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
  pendingAdditions: ChecklistDocument[];
  pendingDeletions: string[];
  pendingUpdates: ChecklistDocument[];
  onClearPendingChanges?: () => void;
  onSavePendingChanges?: () => Promise<void>;
  extractedCompanies: Company[];
  isClientView?: boolean;
  table: Table<any>;
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
  extractedCompanies,
  table
}: ChecklistTableHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* <h2 className="text-base font-semibold">{title}</h2> */}

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

        <div className="flex items-center gap-2">
          <CompanyInfoDisplay
            selectedCategory={selectedCategory}
            extractedCompanies={extractedCompanies}
          />
          
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    const canHide = column.getCanHide();
                    const isVisible = column.getIsVisible();
                    
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={isVisible}
                        disabled={!canHide}
                        onCheckedChange={(value) => {
                          // Safety check: only allow toggling if column can be hidden
                          if (canHide) {
                            column.toggleVisibility(!!value);
                          }
                        }}
                      >
                        {column.id === 'sno' ? 'S.No' :
                         column.id === 'category' ? 'Category' :
                         column.id === 'documentName' ? 'Document Name' :
                         column.id === 'status' ? 'Status' :
                         column.id === 'comments' ? 'Comments' :
                         column.id === 'sample' ? 'Sample' :
                         column.id === 'action' ? 'Action' :
                         column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu> */}
        </div>
      </div>
    </div>
  );
});
