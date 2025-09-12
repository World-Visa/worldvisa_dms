'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, Eye, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UploadDocumentsModal } from './UploadDocumentsModal';
import { TablePagination } from '@/components/common/TablePagination';
import { CompanyHeader } from './CompanyHeader';
import { 
  IDENTITY_DOCUMENTS, 
  EDUCATION_DOCUMENTS, 
  OTHER_DOCUMENTS, 
  COMPANY_DOCUMENTS 
} from '@/lib/documents/checklist';
import { 
  Company,
  DocumentChecklistTableProps
} from '@/types/documents';
import { Document } from '@/types/applications';
import { DocumentListModal } from './DocumentListModal';
import { useQueryClient } from '@tanstack/react-query';
import { SearchBox } from '@/components/ui/SearchBox';
import { HighlightText } from '@/components/ui/HighlightText';
import { useSearchMemo } from '@/lib/utils/search';

interface ExtendedDocumentChecklistTableProps extends DocumentChecklistTableProps {
  onRemoveCompany?: (companyName: string) => void;
}

export function DocumentChecklistTable({ 
  documents, 
  isLoading, 
  error, 
  applicationId, 
  selectedCategory, 
  companies, 
  onRemoveCompany 
}: ExtendedDocumentChecklistTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [selectedDocumentCategory, setSelectedDocumentCategory] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDocumentListModalOpen, setIsDocumentListModalOpen] = useState(false);
  const [selectedDocumentsForView, setSelectedDocumentsForView] = useState<Document[]>([]);
  const [selectedDocumentTypeForView, setSelectedDocumentTypeForView] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const itemsPerPage = 10;
  const queryClient = useQueryClient();

  // Combine all document types from checklist
  const allDocumentTypes = useMemo(() => {
    const baseDocuments = [
      ...IDENTITY_DOCUMENTS,
      ...EDUCATION_DOCUMENTS,
      ...OTHER_DOCUMENTS,
    ];

    // Add company documents for each company
    const companyDocuments = companies.flatMap(company => 
      COMPANY_DOCUMENTS.map(doc => ({
        ...doc,
        category: company.category,
        companyName: company.name
      }))
    );

    return [...baseDocuments, ...companyDocuments];
  }, [companies]);

  const checklistItems = useMemo(() => {
    const validDocuments = documents?.filter(doc => 
      doc && typeof doc === 'object' && doc.file_name
    ) || [];
    
    return allDocumentTypes.map(docType => {
      const expectedDocType = docType.documentType.toLowerCase().replace(/\s+/g, '_');
      
      const uploadedDoc = validDocuments.find(doc => {
        if (!doc || !doc.file_name) {
          return false;
        }
        
        // First, check if the document has a document_type field
        const docTypeFromField = doc.document_type;
        
        if (docTypeFromField && docTypeFromField === expectedDocType) {
          if (docType.category.includes('Documents') && 
              !['Identity Documents', 'Education Documents', 'Other Documents'].includes(docType.category)) {
            if (doc.document_category === docType.category) {
              return true;
            } else {
              return false;
            }
          } else {
            // For non-company documents, just check document type
            return true;
          }
        }
        
        // Fallback to old matching logic for documents without document_type field
        const fileName = doc.file_name.toLowerCase();
        const docTypeName = docType.documentType.toLowerCase();
        
        if (fileName.includes(docTypeName)) {
          return true;
        }
        
        return false;
      });
      
      return {
        category: docType.category,
        documentType: docType.documentType,
        isUploaded: !!uploadedDoc,
        uploadedDocument: uploadedDoc,
      };
    });
  }, [allDocumentTypes, documents]);

  // Filter items based on selected category
  const categoryFilteredItems = useMemo(() => {
    if (selectedCategory.includes('Company Documents')) {
      return checklistItems.filter(item => item.category === selectedCategory);
    }
    
    switch (selectedCategory) {
      case 'identity':
        return checklistItems.filter(item => item.category === 'Identity Documents');
      case 'education':
        return checklistItems.filter(item => item.category === 'Education Documents');
      case 'other':
        return checklistItems.filter(item => item.category === 'Other Documents');
      case 'all':
      default:
        return checklistItems;
    }
  }, [checklistItems, selectedCategory]);

  // Apply search filtering with highlighting
  const filteredItems = useSearchMemo(
    categoryFilteredItems,
    searchQuery,
    (item) => item.documentType,
    { keys: ['documentType'], threshold: 0.3 }
  );

  // Get current company if a company category is selected
  const currentCompany = useMemo(() => {
    if (selectedCategory.includes('Company Documents')) {
      return companies.find(company => company.category === selectedCategory);
    }
    return null;
  }, [selectedCategory, companies]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const handleUploadClick = (documentType: string, category: string) => {
    setSelectedDocumentType(documentType);
    setSelectedDocumentCategory(category);
    
    // Find the company if this is a company document
    if (category.includes('Documents') && 
        !['Identity Documents', 'Education Documents', 'Other Documents'].includes(category)) {
      const company = companies.find(c => c.category === category);
      setSelectedCompany(company);
    } else {
      setSelectedCompany(undefined);
    }
    
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDocumentType('');
    setSelectedDocumentCategory('');
    setSelectedCompany(undefined);
  };

  const filterDocumentsByType = useCallback((documents: Document[], documentType: string): Document[] => {
    const expectedDocType = documentType.toLowerCase().replace(/\s+/g, '_');
    
    return documents.filter(doc => {
      // First try to match by document_type field (preferred method)
      if (doc.document_type && doc.document_type === expectedDocType) {
        return true;
      }
      
      // Fallback to filename matching for documents without document_type
      const fileName = doc.file_name.toLowerCase();
      const docTypeName = documentType.toLowerCase();
      return fileName.includes(docTypeName);
    });
  }, []);

  const getLatestDocuments = useCallback((fallbackDocuments: Document[]): Document[] => {
    const latestDocumentsData = queryClient.getQueryData<{ 
      success: boolean; 
      data: Document[] 
    }>(['application-documents', applicationId]);
    return latestDocumentsData?.data || fallbackDocuments || [];
  }, [queryClient, applicationId]);

  const handleViewDocuments = (documentType: string) => {
    const latestDocuments = getLatestDocuments(documents || []);
    const matchingDocuments = filterDocumentsByType(latestDocuments, documentType);
    
    setSelectedDocumentsForView(matchingDocuments);
    setSelectedDocumentTypeForView(documentType);
    setIsDocumentListModalOpen(true);
  };

  // Reset to first page when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  // Update modal documents when the main documents data changes
  useEffect(() => {
    if (isDocumentListModalOpen && selectedDocumentTypeForView) {
      const latestDocuments = getLatestDocuments(documents || []);
      const matchingDocuments = filterDocumentsByType(latestDocuments, selectedDocumentTypeForView);
      setSelectedDocumentsForView(matchingDocuments);
    }
  }, [
    documents, 
    isDocumentListModalOpen, 
    selectedDocumentTypeForView, 
    applicationId, 
    queryClient, 
    getLatestDocuments, 
    filterDocumentsByType
  ]);

  // Helper function to get category badge styling
  const getCategoryBadgeStyle = (category: string) => {
    if (category.endsWith(' Documents') && 
        !['Identity Documents', 'Education Documents', 'Other Documents'].includes(category)) {
      return 'bg-orange-500 hover:bg-orange-600'; // Company documents
    }
    
    switch (category) {
      case 'Identity Documents':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'Education Documents':
        return 'bg-green-500 hover:bg-green-600';
      case 'Other Documents':
        return 'bg-purple-500 hover:bg-purple-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive">Failed to load document checklist</p>
            <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Company Header */}
      {currentCompany && (
        <CompanyHeader
          company={currentCompany}
          onRemove={() => onRemoveCompany?.(currentCompany.name)}
        />
      )}

      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <CardTitle className="text-lg sm:text-xl">Document Checklist</CardTitle>
            <div className="w-full">
              <SearchBox
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search documents..."
                aria-label="Search document checklist"
                className="w-full lg:w-[40%]"
              />
            </div>
          </div>
        </CardHeader>
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
                    <TableHead className="text-right w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
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
                      <TableRow key={`${item.category}-${item.documentType}`}>
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
                            <div className="md:hidden">
                              {item.isUploaded ? (
                                <Badge 
                                  variant="default" 
                                  className="bg-green-100 text-green-800 hover:bg-green-200 text-xs"
                                >
                                  Uploaded
                                </Badge>
                              ) : (
                                <Badge 
                                  variant="outline" 
                                  className="text-muted-foreground text-xs"
                                >
                                  Not Uploaded
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {item.isUploaded ? (
                            <Badge 
                              variant="default" 
                              className="bg-green-100 text-green-800 hover:bg-green-200"
                            >
                              Uploaded
                            </Badge>
                          ) : (
                            <Badge 
                              variant="outline" 
                              className="text-muted-foreground"
                            >
                              Not Uploaded
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right w-24">
                          <div className="flex items-center justify-end gap-1">
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
                          </div>
                        </TableCell>
                      </TableRow>
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
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>

        <UploadDocumentsModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          applicationId={applicationId}
          selectedDocumentType={selectedDocumentType}
          selectedDocumentCategory={selectedDocumentCategory}
          company={selectedCompany}
        />
      </Card>

      {/* Document List Modal */}
      <DocumentListModal
        isOpen={isDocumentListModalOpen}
        onClose={() => setIsDocumentListModalOpen(false)}
        documentType={selectedDocumentTypeForView}
        documents={selectedDocumentsForView}
        applicationId={applicationId}
        onDocumentDeleted={() => {
          queryClient.refetchQueries({ 
            queryKey: ['application-documents', applicationId] 
          }).then(() => {
            const latestDocuments = getLatestDocuments(documents || []);
            const matchingDocuments = filterDocumentsByType(latestDocuments, selectedDocumentTypeForView);
            setSelectedDocumentsForView(matchingDocuments);
          });
        }}
      />
    </div>
  );
}