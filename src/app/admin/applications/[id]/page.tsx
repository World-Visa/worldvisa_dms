'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ApplicantDetails } from '@/components/applications/ApplicantDetails';
import { DocumentsTable } from '@/components/applications/DocumentsTable';
import { DocumentChecklistTable } from '@/components/applications/DocumentChecklistTable';
import { DocumentCategoryFilter } from '@/components/applications/DocumentCategoryFilter';
import { AddCompanyDialog } from '@/components/applications/AddCompanyDialog';
import { useApplicationDetails } from '@/hooks/useApplicationDetails';
import { useApplicationDocuments } from '@/hooks/useApplicationDocuments';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import { DocumentCategory, Company } from '@/types/documents';
import { localStorageUtils } from '@/lib/localStorage';
import { useChecklistState } from '@/hooks/useChecklistState';
import { useChecklistURLState } from '@/lib/urlState';

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
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
  const [documentsPage, setDocumentsPage] = useState(1);
  const maxCompanies = 5;

  // Check authentication
  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'master_admin'))) {
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

  const application = applicationData?.data;
  const documents = documentsData?.data;

   const checklistState = useChecklistState({
    applicationId,
    documents,
    companies
  });


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
      </div>

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
      ) : !isAuthLoading && isAuthenticated && (user?.role === 'admin' || user?.role === 'master_admin') ? (
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
              checklistCategories={checklistState.checklistCategories}
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
              />
            ) : (
              <DocumentChecklistTable
                documents={documents}
                isLoading={isDocumentsLoading}
                error={documentsError}
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
    </div>
  );
}