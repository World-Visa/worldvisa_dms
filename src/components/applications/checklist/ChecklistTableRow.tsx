'use client';

import React, { memo } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Upload, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HighlightText } from '@/components/ui/HighlightText';
import { RequirementSelector } from './RequirementSelector';
import { RejectionMessageDisplay } from '../RejectionMessageDisplay';
import type { ChecklistState, ChecklistDocument, DocumentRequirement } from '@/types/checklist';
import { Document } from '@/types/applications';

interface ChecklistTableItem {
  category: string;
  documentType: string;
  isUploaded: boolean;
  uploadedDocument?: unknown;
  
  requirement?: DocumentRequirement;
  isSelected?: boolean;
  company_name?: string;
  company?: {
    name: string;
    fromDate: string;
    toDate: string;
    category: string;
  };
  checklist_id?: string;
  rejectedRemark?: string;
  documentStatus?: string;
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
  handleViewDocuments: (documentType: string, companyCategory?: string) => void;
  handleUploadClick: (documentType: string, category: string) => void;
  handleReuploadClick: (documentId: string, documentType: string, category: string) => void;
  handleViewRejectionDetails: (document: Document, documentType: string, category: string) => void;
  getCategoryBadgeStyle: (category: string) => string;
  // Loading states
  isAddingDocument?: boolean;
  addingDocumentId?: string;
  // Success states
  isDocumentAdded?: boolean;
  addedDocumentId?: string;
}

export const ChecklistTableRow = memo(function ChecklistTableRow({
  item,
  index,
  startIndex,
  searchQuery,
  checklistState,
  activeTab,
  onUpdateDocumentRequirement,
  onAddToPendingChanges,
  onAddToPendingDeletions,
  handleViewDocuments,
  handleUploadClick,
  handleReuploadClick,
  handleViewRejectionDetails,
  getCategoryBadgeStyle,
  // Loading states
  isAddingDocument = false,
  addingDocumentId,
  // Success states
  isDocumentAdded = false,
  addedDocumentId
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
                className={cn(
                  "text-xs px-1.5 py-0.5 w-fit",
                  item.documentStatus === 'rejected' 
                    ? "bg-red-100 text-red-800 hover:bg-red-200"
                    : "bg-green-100 text-green-800 hover:bg-green-200"
                )}
              >
                {item.documentStatus === 'rejected' ? 'Rejected' : 'Uploaded'}
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
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1">
            {item.isUploaded ? (
              <Badge 
                variant="default" 
                className={cn(
                  "text-xs px-1.5 py-0.5 w-fit",
                  item.documentStatus === 'rejected' 
                    ? "bg-red-100 text-red-800 hover:bg-red-200"
                    : "bg-green-100 text-green-800 hover:bg-green-200"
                )}
              >
                {item.documentStatus === 'rejected' ? 'Rejected' : 'Uploaded'}
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
          {/* Show rejected remark on desktop */}
          {item.documentStatus === 'rejected' && item.rejectedRemark && (
            <div className="max-w-xs">
              <RejectionMessageDisplay
                message={item.rejectedRemark}
                maxLength={80}
                onReadMore={() => {
                  const uploadedDoc = item.uploadedDocument as Document;
                  if (uploadedDoc) {
                    handleViewRejectionDetails(uploadedDoc, item.documentType, item.category);
                  }
                }}
                showReadMoreButton={item.rejectedRemark.length > 80}
              />
            </div>
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
                className={cn(
                  "flex items-center gap-1 px-2 py-1 h-7 text-xs",
                  isDocumentAdded && addedDocumentId === `${item.category}-${item.documentType}` && "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                )}
                disabled={item.requirement === 'not_required' || isAddingDocument || (isDocumentAdded && addedDocumentId === `${item.category}-${item.documentType}`)}
              >
                {isAddingDocument && addingDocumentId === `${item.category}-${item.documentType}` ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                    <span className="hidden sm:inline">Adding...</span>
                  </>
                ) : isDocumentAdded && addedDocumentId === `${item.category}-${item.documentType}` ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span className="hidden sm:inline">Added</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3" />
                    <span className="hidden sm:inline">Add</span>
                  </>
                )}
              </Button>
              </div>
            )
          ) : (
            // Default mode: Show upload/view/reupload buttons
            <>
              {item.isUploaded && item.documentStatus !== 'rejected' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDocuments(item.documentType, item.category)}
                  className="flex items-center gap-1 px-2 py-1 h-7 text-xs"
                >
                  <Eye className="h-3 w-3" />
                  <span className="hidden sm:inline">View</span>
                </Button>
              )}
              {item.isUploaded && item.documentStatus === 'rejected' && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDocuments(item.documentType, item.category)}
                    className="flex items-center gap-1 px-2 py-1 h-7 text-xs"
                  >
                    <Eye className="h-3 w-3" />
                    <span className="hidden sm:inline">View</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const uploadedDoc = item.uploadedDocument as Document;
                      if (uploadedDoc?._id) {
                        handleReuploadClick(uploadedDoc._id, item.documentType, item.category);
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-1 h-7 text-xs text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
                  >
                    <Upload className="h-3 w-3" />
                    <span className="hidden sm:inline">Reupload</span>
                  </Button>
                </div>
              )}
              {!item.isUploaded && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUploadClick(item.documentType, item.category)}
                  className="flex items-center gap-1 px-2 py-1 h-7 text-xs"
                >
                  <Upload className="h-3 w-3" />
                  <span className="hidden sm:inline">Upload</span>
                </Button>
              )}
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});
