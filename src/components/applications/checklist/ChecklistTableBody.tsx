'use client';

import React, { memo } from 'react';
import { CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TablePagination } from '@/components/common/TablePagination';
import { ChecklistTableRow } from './ChecklistTableRow';
import { FileText } from 'lucide-react';
import { ChecklistDocument, ChecklistState, DocumentRequirement } from '@/types/checklist';
import { Document } from '@/types/applications';
import { useDocumentCommentCounts } from '@/hooks/useDocumentCommentCounts';

interface ChecklistTableItem {
  category: string;
  documentType: string;
  isUploaded: boolean;
  uploadedDocument?: Document | unknown;
  requirement?: DocumentRequirement;
  isSelected?: boolean;
  company_name?: string;
  checklist_id?: string;
}

interface ChecklistTableBodyProps {
  filteredItems: ChecklistTableItem[];
  categoryFilteredItems: ChecklistTableItem[];
  searchQuery: string;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  checklistState: ChecklistState;
  activeTab: 'current' | 'available';
  selectedCategory: string;
  onUpdateDocumentRequirement?: (category: string, documentType: string, requirement: DocumentRequirement) => void;
  onAddToPendingChanges: (document: ChecklistDocument) => Promise<void>;
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
  isAddingDocument: boolean;
  addingDocumentId?: string;
  isDocumentAdded: boolean;
  addedDocumentId?: string;
}

export const ChecklistTableBody = memo(function ChecklistTableBody({
  filteredItems,
  categoryFilteredItems,
  searchQuery,
  currentPage,
  totalPages,
  itemsPerPage,
  startIndex,
  endIndex,
  onPageChange,
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
  handleReuploadClick,
  handleViewRejectionDetails,
  getCategoryBadgeStyle,
  isAddingDocument,
  addingDocumentId,
  isDocumentAdded,
  addedDocumentId
}: ChecklistTableBodyProps) {
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Get document IDs for comment counts from uploaded documents
  const documentIds = paginatedItems
    .filter(item => item.isUploaded && item.uploadedDocument)
    .map(item => (item.uploadedDocument as Document)?._id)
    .filter(Boolean) as string[];
  
  const { data: commentCounts = {} } = useDocumentCommentCounts(documentIds);

  return (
    <CardContent>
      <div className="space-y-4">
        {/* Search Results Indicator */}
        {searchQuery && (
          <div 
            id="search-results"
            className="text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {filteredItems.length === categoryFilteredItems.length ? (
              <span>Showing all {filteredItems.length} documents</span>
            ) : (
              <span>
                Showing {filteredItems.length} of {categoryFilteredItems.length} documents
                {filteredItems.length === 0 && ' - no matches found'}
              </span>
            )}
          </div>
        )}
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">S.No</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead>Document Name</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="w-20">Comments</TableHead>
                <TableHead className="text-right w-24">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {selectedCategory === 'submitted' 
                        ? 'No documents uploaded yet' 
                        : 'No documents in this category'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item, index) => (
                  <ChecklistTableRow
                    key={`${item.category}-${item.documentType}-${item.checklist_id || 'new'}-${index}`}
                    item={item}
                    index={index}
                    startIndex={startIndex}
                    searchQuery={searchQuery}
                    checklistState={checklistState}
                    activeTab={activeTab}
                    selectedCategory={selectedCategory}
                    onUpdateDocumentRequirement={onUpdateDocumentRequirement}
                    onAddToPendingChanges={onAddToPendingChanges}
                    onAddToPendingDeletions={onAddToPendingDeletions}
                    onRemoveFromPendingChanges={onRemoveFromPendingChanges}
                    onRemoveFromPendingDeletions={onRemoveFromPendingDeletions}
                    onSavePendingChanges={onSavePendingChanges}
                    onClearPendingChanges={onClearPendingChanges}
                    pendingAdditions={pendingAdditions}
                    pendingDeletions={pendingDeletions}
                    handleViewDocuments={handleViewDocuments}
                    handleUploadClick={handleUploadClick}
                    handleReuploadClick={handleReuploadClick}
                    handleViewRejectionDetails={handleViewRejectionDetails}
                    getCategoryBadgeStyle={getCategoryBadgeStyle}
                    isAddingDocument={isAddingDocument}
                    addingDocumentId={addingDocumentId}
                    isDocumentAdded={isDocumentAdded}
                    addedDocumentId={addedDocumentId}
                    commentCounts={commentCounts}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredItems.length}
          itemsPerPage={itemsPerPage}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={onPageChange}
        />
      </div>
    </CardContent>
  );
});
