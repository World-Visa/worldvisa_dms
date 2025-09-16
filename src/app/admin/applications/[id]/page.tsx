'use client';

import React, { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ApplicantDetails } from '@/components/applications/ApplicantDetails';
import { DocumentsTable } from '@/components/applications/DocumentsTable';
import { DocumentChecklistTable } from '@/components/applications/DocumentChecklistTable';
import { DocumentCategoryFilter } from '@/components/applications/DocumentCategoryFilter';
import { AddCompanyDialog } from '@/components/applications/AddCompanyDialog';
import { useApplicationDetails } from '@/hooks/useApplicationDetails';
import { useApplicationDocuments, useAllApplicationDocuments } from '@/hooks/useApplicationDocuments';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { useState } from 'react';
import { DocumentCategory, Company } from '@/types/documents';
import { Document } from '@/types/applications';
import { localStorageUtils } from '@/lib/localStorage';
import { useChecklistState } from '@/hooks/useChecklistState';
import { useChecklistURLState } from '@/lib/urlState';
import { ReuploadDocumentModal } from '@/components/applications/ReuploadDocumentModal';
import { generateChecklistCategories } from '@/lib/checklist/categoryUtils';
import { useQueryClient } from '@tanstack/react-query';

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  
  // URL state management
  const { category: urlCategory, setCategory: setURLCategory } = useChecklistURLState(applicationId);
  
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>(() => {
    // Use URL state first, then fallback to localStorage
    const savedCategory = localStorageUtils.loadCategory(applicationId, urlCategory) as DocumentCategory;
    return savedCategory;
  });
  
  const [isCategoryChanging, setIsCategoryChanging] = useState(false);
  
  // Initialize companies from localStorage or empty array
  const [companies, setCompanies] = useState<Company[]>(() => {
    const savedCompanies = localStorageUtils.loadCompanies(applicationId, []);
    return savedCompanies;
  });
  
  const [isAddCompanyDialogOpen, setIsAddCompanyDialogOpen] = useState(false);
  const [isReuploadModalOpen, setIsReuploadModalOpen] = useState(false);
  const [selectedReuploadDocument, setSelectedReuploadDocument] = useState<Document | null>(null);
  const [selectedReuploadDocumentType, setSelectedReuploadDocumentType] = useState<string>('');
  const [selectedReuploadDocumentCategory, setSelectedReuploadDocumentCategory] = useState<string>('');
  const [documentsPage, setDocumentsPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const maxCompanies = 5;

  // Check authentication
  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'team_leader' && user?.role !== 'master_admin'))) {
      router.push('/admin-login');
    }
  }, [isAuthenticated, isAuthLoading, user?.role, router]);


  const {
    data: applicationData,
    isLoading: isApplicationLoading,
    error: applicationError,
  } = useApplicationDetails(applicationId);

  const {
    data: documentsData,
    isLoading: isDocumentsLoading,
    error: documentsError,
  } = useApplicationDocuments(applicationId);

  // Fetch all documents for checklist matching (not paginated)
  const {
    data: allDocumentsData,
    isLoading: isAllDocumentsLoading,
    error: allDocumentsError,
  } = useAllApplicationDocuments(applicationId);

  const application = applicationData?.data;
  const documents = documentsData?.data;
  const allDocuments = allDocumentsData?.data; // All documents for checklist matching

   const checklistState = useChecklistState({
    applicationId,
    documents: allDocuments, // Use all documents for checklist matching
    companies
  });

  // Refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidate all relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['application-details', applicationId] }),
        queryClient.invalidateQueries({ queryKey: ['application-documents', applicationId] }),
        queryClient.invalidateQueries({ queryKey: ['application-documents-all', applicationId] }),
        queryClient.invalidateQueries({ queryKey: ['application-documents-paginated', applicationId] }),
        queryClient.invalidateQueries({ queryKey: ['checklist', applicationId] }),
        queryClient.invalidateQueries({ queryKey: ['document-comment-counts'] }),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check if all submitted documents are approved
  const areAllDocumentsApproved = useMemo(() => {
    if (!documents || documents.length === 0) {
      return false;
    }
    
    // Check if all documents have approved status
    return documents.every((doc: Document) => doc.status === 'approved');
  }, [documents]);

  // Handle push for quality check
  const handlePushForQualityCheck = () => {
    console.log('Pushing application for quality check:', applicationId);
  };


    // Populate companies state from existing documents with company information
  useEffect(() => {
    if (documents && documents.length > 0) {
      const companyMap = new Map<string, Company>();
      
      documents.forEach((doc: Document) => {
        if (doc.document_category && doc.document_category.includes('Company Documents')) {
          // Extract company name from category (e.g., "Google Company Documents" -> "Google")
          const companyName = doc.document_category.replace(' Company Documents', '').toLowerCase();
          
          // Always prioritize API data if description is available
          if (doc.description) {
            // Try to extract dates from description (e.g., "Worked at google from Jul 04, 2023 to Aug 26, 2025 (2 years 1 month)")
            const dateMatch = doc.description.match(/from\s+(\w+\s+\d{2},\s+\d{4})\s+to\s+(\w+\s+\d{2},\s+\d{4})/i);
            if (dateMatch) {
              const fromDateStr = dateMatch[1]; // "Jul 04, 2023"
              const toDateStr = dateMatch[2];   // "Aug 26, 2025"
              
              try {
                // Convert to YYYY-MM-DD format without timezone issues
                const fromDateObj = new Date(fromDateStr);
                const toDateObj = new Date(toDateStr);
                
                // Format as YYYY-MM-DD without timezone conversion
                const fromDate = `${fromDateObj.getFullYear()}-${String(fromDateObj.getMonth() + 1).padStart(2, '0')}-${String(fromDateObj.getDate()).padStart(2, '0')}`;
                const toDate = `${toDateObj.getFullYear()}-${String(toDateObj.getMonth() + 1).padStart(2, '0')}-${String(toDateObj.getDate()).padStart(2, '0')}`;
                
                companyMap.set(companyName, {
                  name: companyName,
                  category: doc.document_category,
                  fromDate: fromDate,
                  toDate: toDate,
                  description: doc.description
                });
              } catch (error) {
                console.error('Error parsing dates from API description:', error);
              }
            }
          }
        }
      });
      
      // Update companies state with API data if available
      if (companyMap.size > 0) {
        setCompanies(Array.from(companyMap.values()));
      }
    }
  }, [documents]);

 

  const handleAddCompany = (company: Company) => {
    const companyWithCategory = {
      ...company,
      category: `${company.name} Company Documents`
    };
    const newCompanies = [...companies, companyWithCategory];
    setCompanies(newCompanies);    
    localStorageUtils.saveCompanies(applicationId, newCompanies);
  };

  const handleRemoveCompany = (companyName: string) => {
    const newCompanies = companies.filter(company => company.name !== companyName);
    setCompanies(newCompanies);    
    localStorageUtils.saveCompanies(applicationId, newCompanies);
    if (selectedCategory === `company-${companyName}`) {
      setSelectedCategory('all');
    }
  };

  const handleOpenAddCompanyDialog = () => {
    setIsAddCompanyDialogOpen(true);
  };

  const handleCloseAddCompanyDialog = () => {
    setIsAddCompanyDialogOpen(false);
  };

  const handleDocumentsPageChange = (page: number) => {
    setDocumentsPage(page);
  };

  const handleReuploadDocument = (documentId: string, documentType: string, category: string) => {
    // Find the document to reupload
    const documentToReupload = documents?.find(doc => doc._id === documentId);
    if (!documentToReupload) {
      console.error('Document not found for reupload:', documentId);
      return;
    }

    setSelectedReuploadDocument(documentToReupload);
    setSelectedReuploadDocumentType(documentType);
    setSelectedReuploadDocumentCategory(category);
    setIsReuploadModalOpen(true);
  };

  const handleReuploadModalClose = () => {
    setIsReuploadModalOpen(false);
    setSelectedReuploadDocument(null);
    setSelectedReuploadDocumentType('');
    setSelectedReuploadDocumentCategory('');
  };


  // Enhanced cancel function that also resets category
  const handleCancelChecklist = async () => {
    setIsCategoryChanging(true);
    try {
      checklistState.cancelChecklistOperation();
      // Reset to submitted documents when canceling
      setSelectedCategory('submitted');
      setURLCategory('submitted');
      localStorageUtils.saveCategory(applicationId, 'submitted');
      
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setIsCategoryChanging(false);
    }
  };

  // Enhanced category change handler that also updates checklist state
  const handleCategoryChangeWithChecklist = async (category: DocumentCategory) => {
    setIsCategoryChanging(true);
    try {
      setSelectedCategory(category);
      setURLCategory(category);
      localStorageUtils.saveCategory(applicationId, category);
      
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setIsCategoryChanging(false);
    }
  };

  // Enhanced start creating checklist function
  const handleStartCreatingChecklist = async () => {
    setIsCategoryChanging(true);
    try {
      checklistState.startCreatingChecklist();
      // Set the category to 'all' to show all documents
      setSelectedCategory('all');
      setURLCategory('all');
      localStorageUtils.saveCategory(applicationId, 'all');
      
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setIsCategoryChanging(false);
    }
  };

  // Enhanced start editing checklist function
  const handleStartEditingChecklist = async () => {
    setIsCategoryChanging(true);
    try {
      checklistState.startEditingChecklist();
      
      // Determine the correct category to switch to based on current selection
      let targetCategory: DocumentCategory = 'checklist';
      
      // If we're on a company-specific category, maintain it
      if (selectedCategory.includes('_company_documents')) {
        targetCategory = selectedCategory as DocumentCategory;
      } else if (selectedCategory === 'submitted') {
        // If on submitted, switch to the first available checklist category
        const firstCategory = checklistState.checklistCategories[0];
        if (firstCategory) {
          targetCategory = firstCategory.id as DocumentCategory;
        }
      }
      
      setSelectedCategory(targetCategory);
      setURLCategory(targetCategory);
      localStorageUtils.saveCategory(applicationId, targetCategory);
      
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setIsCategoryChanging(false);
    }
  };

  // Sync URL state with local state on mount
  useEffect(() => {
    if (urlCategory && urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory as DocumentCategory);
      localStorageUtils.saveCategory(applicationId, urlCategory);
    }
  }, [urlCategory, selectedCategory, applicationId]);

  // Reset documents page when category changes
  useEffect(() => {
    setDocumentsPage(1);
  }, [selectedCategory]);


  if (applicationError || documentsError) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/admin/applications">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
            </Button>
          </Link>
        </div>
        
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load application details. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <TooltipProvider>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin/applications" className='items-center flex'>
              <Button variant="outline" className='rounded-full w-8 h-8 cursor-pointer ' size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-lexend font-bold">Application Details</h1>
              <div className="text-muted-foreground ">
                {isApplicationLoading ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  application ? `Application ID: ${application.id}` : 'Loading...'
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    variant={areAllDocumentsApproved ? "default" : "outline"}
                    size="sm"
                    onClick={handlePushForQualityCheck}
                    disabled={!areAllDocumentsApproved}
                    className={`flex items-center gap-2 cursor-pointer ${
                      areAllDocumentsApproved 
                        ? "bg-green-600 hover:bg-green-700 text-white" 
                        : "opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Push for Quality Check</span>
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {areAllDocumentsApproved 
                  ? "All documents are approved. Ready for quality check."
                  : "All submitted documents must be reviewed before pushing for quality check."
                }
              </TooltipContent>
            </Tooltip>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </TooltipProvider>

      {/* Loading State */}
      {(isAuthLoading || isApplicationLoading || isDocumentsLoading) ? (
        <div className="space-y-6">
          <div className="flex justify-between w-full gap-8 items-end">
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="max-w-xs w-full">
                    <Skeleton className="h-24 w-full rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
            <div className="max-w-xs w-full">
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      ) : !isAuthLoading && isAuthenticated && (user?.role === 'admin' || user?.role === 'team_leader' || user?.role === 'master_admin') ? (
        <div className="space-y-6">
          {/* Applicant Details */}
          <ApplicantDetails
            application={application}
            isLoading={isApplicationLoading}
            error={applicationError}
            documents={documents}
            isDocumentsLoading={isDocumentsLoading}
            documentsError={documentsError}
          />

          {/* Documents Section */}
          <div className="space-y-6">
            {/* Category Filter */}
            <DocumentCategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChangeWithChecklist}
              companies={companies}
              onAddCompany={handleOpenAddCompanyDialog}
              onRemoveCompany={handleRemoveCompany}
              maxCompanies={maxCompanies}
              // Checklist props
              checklistState={checklistState.state}
              checklistCategories={generateChecklistCategories(checklistState.checklistData, undefined, companies)}
              hasCompanyDocuments={checklistState.hasCompanyDocuments}
              onStartCreatingChecklist={handleStartCreatingChecklist}
              onStartEditingChecklist={handleStartEditingChecklist}
              onSaveChecklist={checklistState.state === 'editing' ? checklistState.savePendingChanges : checklistState.saveChecklist}
              onCancelChecklist={handleCancelChecklist}
              isSavingChecklist={checklistState.isBatchSaving}
              // Loading state
              isCategoryChanging={isCategoryChanging}
            />

            {/* Conditional Rendering */}
            {selectedCategory === 'submitted' ? (
              <DocumentsTable
                applicationId={applicationId}
                currentPage={documentsPage}
                limit={10}
                onPageChange={handleDocumentsPageChange}
                onReuploadDocument={handleReuploadDocument}
              />
            ) : (
              <DocumentChecklistTable
                documents={allDocuments}
                isLoading={isAllDocumentsLoading}
                error={allDocumentsError}
                applicationId={applicationId}
                selectedCategory={selectedCategory}
                companies={companies}
                onRemoveCompany={handleRemoveCompany}
                // Checklist props
                checklistState={checklistState.state}
                filteredDocuments={checklistState.filteredDocuments}
                currentChecklistDocuments={checklistState.currentChecklistDocuments}
                availableDocumentsForEditing={checklistState.availableDocumentsForEditing}
                selectedDocuments={checklistState.selectedDocuments}
                requirementMap={checklistState.requirementMap}
                onSelectDocument={checklistState.selectDocument}
                onUpdateDocumentRequirement={checklistState.updateDocumentRequirement}
                onUpdateChecklist={checklistState.updateChecklist}
                checklistData={checklistState.checklistData}
                // Pending changes props
                pendingAdditions={checklistState.pendingAdditions}
                pendingDeletions={checklistState.pendingDeletions}
                pendingUpdates={checklistState.pendingUpdates}
                onAddToPendingChanges={checklistState.addToPendingChanges}
                onRemoveFromPendingChanges={checklistState.removeFromPendingChanges}
                onAddToPendingDeletions={checklistState.addToPendingDeletions}
                onRemoveFromPendingDeletions={checklistState.removeFromPendingDeletions}
                onSavePendingChanges={checklistState.savePendingChanges}
                onClearPendingChanges={checklistState.clearPendingChanges}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      )}

      {/* Add Company Dialog */}
      <AddCompanyDialog
        isOpen={isAddCompanyDialogOpen}
        onClose={handleCloseAddCompanyDialog}
        onAddCompany={handleAddCompany}
        existingCompanies={companies}
        maxCompanies={maxCompanies}
      />

      {/* Reupload Document Modal */}
      <ReuploadDocumentModal
        isOpen={isReuploadModalOpen}
        onClose={handleReuploadModalClose}
        applicationId={applicationId}
        document={selectedReuploadDocument }
        documentType={selectedReuploadDocumentType}
        category={selectedReuploadDocumentCategory}
      />
    </div>
  );
}