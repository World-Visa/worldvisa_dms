'use client';

import React, { memo } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Upload, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HighlightText } from '@/components/ui/HighlightText';
import { RequirementSelector } from './RequirementSelector';
import type { ChecklistState, ChecklistDocument, DocumentRequirement } from '@/types/checklist';

interface ChecklistTableItem {
  category: string;
  documentType: string;
  isUploaded: boolean;
  uploadedDocument?: unknown;
  
  requirement?: DocumentRequirement;
  isSelected?: boolean;
  company_name?: string;
  checklist_id?: string;
}

interface ChecklistTableRowProps {
  item: ChecklistTableItem;
  index: number;
  startIndex: number;
  searchQuery: string;
  checklistState: ChecklistState;
  activeTab: 'current' | 'available';
  selectedCategory: string;
  onUpdateDocumentRequirement?: (category: string, documentType: string, requirement: DocumentRequirement) => void;
  onAddToPendingChanges?: (document: ChecklistDocument) => void;
  onAddToPendingDeletions?: (checklistId: string) => void;
  onRemoveFromPendingChanges?: (document: ChecklistDocument) => void;
  onRemoveFromPendingDeletions?: (checklistId: string) => void;
  onSavePendingChanges?: () => Promise<void>;
  onClearPendingChanges?: () => void;
  pendingAdditions: ChecklistDocument[];
  pendingDeletions: string[];
  handleViewDocuments: (documentType: string) => void;
  handleUploadClick: (documentType: string, category: string) => void;
  getCategoryBadgeStyle: (category: string) => string;
}

export const ChecklistTableRow = memo(function ChecklistTableRow({
  item,
  index,
  startIndex,
  searchQuery,
  checklistState,
  activeTab,
  selectedCategory,
  onUpdateDocumentRequirement,
  onAddToPendingChanges,
  onAddToPendingDeletions,
  onRemoveFromPendingChanges,
  onRemoveFromPendingDeletions,
  onSavePendingChanges,
  onClearPendingChanges,
  pendingAdditions,
  pendingDeletions,
  handleViewDocuments,
  handleUploadClick,
  getCategoryBadgeStyle
}: ChecklistTableRowProps) {
  return (
    <TableRow key={`${item.category}-${item.documentType}-${item.checklist_id || 'new'}-${index}`}>
      <TableCell className="font-medium w-16">
        {startIndex + index + 1}
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Badge 
          variant="default" 
          className={cn(
            "text-xs py-1 text-white",
            getCategoryBadgeStyle(item.category)
          )}
        >
          {item.category}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="truncate" title={item.documentType}>
              <HighlightText
                text={item.documentType}
                query={searchQuery}
                className="text-sm"
              />
            </div>
          </div>
          {/* Show category on mobile */}
          <div className="sm:hidden">
            <Badge 
              variant="default" 
              className={cn(
                "text-xs py-0.5 text-white",
                getCategoryBadgeStyle(item.category)
              )}
            >
              {item.category}
            </Badge>
          </div>
          {/* Show status on mobile */}
          <div className="md:hidden flex flex-wrap gap-1">
            {item.isUploaded ? (
              <Badge 
                variant="default" 
                className="bg-green-100 text-green-800 hover:bg-green-200 text-xs px-1.5 py-0.5 w-fit"
              >
                Uploaded
              </Badge>
            ) : (
              <Badge 
                variant="outline" 
                className="text-muted-foreground text-xs px-1.5 py-0.5 w-fit"
              >
                Not Uploaded
              </Badge>
            )}
            {/* Show requirement status */}
            {item.requirement && item.requirement !== 'not_required' && (
              <Badge 
                variant="default" 
                className={cn(
                  "text-xs px-1.5 py-0.5 w-fit",
                  item.requirement === 'mandatory' 
                    ? "bg-red-100 text-red-800 hover:bg-red-200" 
                    : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                )}
              >
                {item.requirement === 'mandatory' ? 'Mandatory' : 'Optional'}
              </Badge>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
        {item.isUploaded ? (
          <Badge 
            variant="default" 
              className="bg-green-100 text-green-800 hover:bg-green-200 text-xs px-1.5 py-0.5 w-fit"
          >
            Uploaded
          </Badge>
        ) : (
          <Badge 
            variant="outline" 
              className="text-muted-foreground text-xs px-1.5 py-0.5 w-fit"
          >
            Not Uploaded
          </Badge>
        )}
          {/* Show requirement status */}
          {item.requirement && item.requirement !== 'not_required' && (
            <Badge 
              variant="default" 
              className={cn(
                "text-xs px-1.5 py-0.5 w-fit",
                item.requirement === 'mandatory' 
                  ? "bg-red-100 text-red-800 hover:bg-red-200" 
                  : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
              )}
            >
              {item.requirement === 'mandatory' ? 'Mandatory' : 'Optional'}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right w-24">
        <div className="flex items-center justify-end gap-1">
          {/* Show different actions based on checklist state */}
          {checklistState === 'creating' ? (
            // Creating mode: Show requirement selector
            <div className="w-32">
              <RequirementSelector
                value={item.requirement || 'not_required'}
                onChange={(requirement) => 
                  onUpdateDocumentRequirement?.(item.category, item.documentType, requirement)
                }
              />
            </div>
          ) : checklistState === 'editing' ? (
            // Editing mode: Show different actions based on tab
            activeTab === 'current' ? (
              // Current checklist tab: Show delete button
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Add to pending deletions
                  if (item.checklist_id && onAddToPendingDeletions) {
                    onAddToPendingDeletions(item.checklist_id);
                  }
                }}
                className="flex items-center gap-1 px-2 py-1 h-7 text-xs text-red-600 hover:text-red-700"
              >
                <span>Delete</span>
              </Button>
            ) : (
              // Available documents tab: Show requirement selector and add button
              <div className="flex items-center gap-2">
                <div className="w-24">
                  <RequirementSelector
                    value={item.requirement || 'not_required'}
                    onChange={(requirement) => 
                      onUpdateDocumentRequirement?.(item.category, item.documentType, requirement)
                    }
                  />
                </div>
              <Button
                variant="outline"
                size="sm"
                  onClick={() => onAddToPendingChanges?.(item)}
                className="flex items-center gap-1 px-2 py-1 h-7 text-xs"
                  disabled={item.requirement === 'not_required'}
              >
                <Plus className="h-3 w-3" />
                <span className="hidden sm:inline">Add</span>
              </Button>
              </div>
            )
          ) : (
            // Default mode: Show upload/view buttons
            <>
              {item.isUploaded && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDocuments(item.documentType)}
                  className="flex items-center gap-1 px-2 py-1 h-7 text-xs"
                >
                  <Eye className="h-3 w-3" />
                  <span className="hidden sm:inline">View</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUploadClick(item.documentType, item.category)}
                className="flex items-center gap-1 px-2 py-1 h-7 text-xs"
              >
                <Upload className="h-3 w-3" />
                <span className="hidden sm:inline">Upload</span>
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});
