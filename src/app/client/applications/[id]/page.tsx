'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ClientApplicationDetails } from '@/components/applications/ClientApplicationDetails';
import { DocumentsTable } from '@/components/applications/DocumentsTable';
import { DocumentChecklistTable } from '@/components/applications/DocumentChecklistTable';
import { DocumentCategoryFilter } from '@/components/applications/DocumentCategoryFilter';
import { DocumentCategory, Company } from '@/types/documents';
import { Document } from '@/types/applications';
import { useClientApplication } from '@/hooks/useClientApplication';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import { useClientChecklist } from '@/hooks/useClientChecklist';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AddCompanyDialog } from '@/components/applications/AddCompanyDialog';

export default function ClientApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('submitted');
  const [documentsPage, setDocumentsPage] = useState(1);
  const documentsLimit = 10;
  const [isCategoryChanging, setIsCategoryChanging] = useState(false);
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isAddCompanyDialogOpen, setIsAddCompanyDialogOpen] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || user?.role !== 'client')) {
      router.push('/client-login');
    }
  }, [isAuthenticated, isAuthLoading, user?.role, router]);

  const {
    data: applicationData,
    isLoading: isApplicationLoading,
    error: applicationError,
  } = useClientApplication();

  const {
    data: documentsData,
    isLoading: isDocumentsLoading,
    error: documentsError,
  } = useClientDocuments(documentsPage, documentsLimit);

  const {
    data: checklistData,
    isLoading: isChecklistLoading,
    error: checklistError,
  } = useClientChecklist(applicationId);

  // Extract companies from documents API response, but prioritize actual company data
  const extractedCompanies = useMemo(() => {
    // Get company categories from documents (if any exist)
    const companyCategories = new Set<string>();
    if (documentsData?.data?.documents && documentsData.data.documents.length > 0) {
      documentsData.data.documents.forEach((doc: { document_category?: string }) => {
        if (doc.document_category && doc.document_category.includes('Company Documents')) {
          companyCategories.add(doc.document_category);
        }
      });
    }
    
    // Always include companies from the companies state (which have correct dates and descriptions)
    const existingCompanies = companies || [];
    
    // If we have documents, filter companies to only include those with documents
    if (companyCategories.size > 0) {
      const companiesFromState = existingCompanies.filter(company => 
        companyCategories.has(company.category)
      );
      
      // If we have companies from state that match document categories, use them
      if (companiesFromState.length > 0) {
        return companiesFromState;
      }
      
      // Fallback: generate companies from document categories (for backward compatibility)
      return Array.from(companyCategories).map(category => {
        // Extract company name from category (e.g., "worldvisa Company Documents" -> "worldvisa")
        const companyName = category.split(' ')[0].toLowerCase();
        return {
          name: companyName,
          category: category,
          fromDate: "2024-01", // Default values since we don't have this info from documents
          toDate: "2025-12"
        };
      });
    }
    
    // If no documents exist yet, return all companies from state
    return existingCompanies;
  }, [documentsData?.data?.documents, companies]);
  
  // Use extracted companies (which now prioritizes actual company data)
  const finalCompanies = extractedCompanies;

  const handleDocumentsPageChange = (page: number) => {
    setDocumentsPage(page);
  };

  const handleCategoryChange = async (category: string) => {
    setIsCategoryChanging(true);
    try {
      setSelectedCategory(category);
      setDocumentsPage(1);
      
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setIsCategoryChanging(false);
    }
  };

  const handleUploadSuccess = () => {
    window.location.reload();
  };

  // Company management functions
  const handleAddCompany = (company: Company) => {
    const companyWithCategory = {
      ...company,
      category: `${company.name} Company Documents`
    };
    setCompanies(prev => [...prev, companyWithCategory]);
    setIsAddCompanyDialogOpen(false);
  };

  const handleRemoveCompany = (companyName: string) => {
    setCompanies(prev => prev.filter(company => company.name !== companyName));
  };

  // Check if checklist has company documents
  const hasCompanyDocuments = checklistData?.data?.some(item => item.document_category === 'Company') || false;


  if (applicationError && !applicationData) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/client/applications">
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
      <div className="flex items-center justify-start">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-lexend font-bold">My Application</h1>
            <div className="text-muted-foreground ">
              {isApplicationLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                applicationData?.data ? `Application ID: ${applicationData.data.id}` : 'Loading...'
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Loading State */}
      {(isAuthLoading || isApplicationLoading || isDocumentsLoading || isChecklistLoading) ? (
        <div className="space-y-6">
          <div className="flex justify-between w-full gap-8 items-end">
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-start">
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
      ) : !isAuthLoading && isAuthenticated && user?.role === 'client' ? (
        <div className="space-y-6">
          {/* Application Details */}
            <ClientApplicationDetails
              data={applicationData}
              documents={documentsData?.data?.documents}
              isDocumentsLoading={isDocumentsLoading}
              documentsError={documentsError}
              isLoading={isApplicationLoading}
              error={applicationError}
            />

          {/* Documents Section */}
          <div className="space-y-6">
            {/* Category Filter */}
            <DocumentCategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              companies={finalCompanies}
              onAddCompany={() => setIsAddCompanyDialogOpen(true)}
              onRemoveCompany={handleRemoveCompany}
              maxCompanies={5}
              isClientView={true}
              submittedDocumentsCount={documentsData?.data?.documents?.length || 0}
              checklistCategories={Array.isArray(checklistData?.data) ? (() => {
                const categoryMap = new Map();
                
                checklistData.data.forEach(item => {
                  const categoryKey = item.document_category;
                  
                  // Skip company documents - they will be handled separately
                  if (categoryKey === 'Company' || categoryKey === 'Company Documents') {
                    return;
                  }
                  
                  if (!categoryMap.has(categoryKey)) {
                    let displayLabel = categoryKey;
                    if (categoryKey === 'Identity') {
                      displayLabel = 'Identity Documents';
                    } else if (categoryKey === 'Education') {
                      displayLabel = 'Education Documents';
                    } else if (categoryKey === 'Other') {
                      displayLabel = 'Other Documents';
                    }
                    
                    categoryMap.set(categoryKey, {
                      id: categoryKey.toLowerCase().replace(/\s+/g, '_'),
                      label: displayLabel,
                      count: 0,
                      type: 'base',
                      is_selected: true
                    });
                  }
                  
                  const category = categoryMap.get(categoryKey);
                  category.count++;
                });
                
                // Extract company categories from uploaded documents
                // This ensures company chips persist across logout/login
                const companyCategories = new Set<string>();
                
                // Get company categories from uploaded documents
                if (documentsData?.data?.documents) {
                  documentsData.data.documents.forEach((doc: { document_category?: string }) => {
                    if (doc.document_category && doc.document_category.includes('Company Documents')) {
                      companyCategories.add(doc.document_category);
                    }
                  });
                }
                
                // Add company-specific categories from uploaded documents
                companyCategories.forEach(companyCategory => {
                  const companyName = companyCategory.replace(' Company Documents', '');
                  
                  // Count items for this specific company
                  // First try to match by company_name if it exists
                  let companyItems = checklistData.data.filter(item => 
                    item.document_category === 'Company' && 
                    item.company_name === companyName
                  );
                  
                  // If no items found by company_name, fall back to counting all company items
                  if (companyItems.length === 0) {
                    companyItems = checklistData.data.filter(item => item.document_category === 'Company');
                  }
                  
                  if (companyItems.length > 0) {
                    categoryMap.set(companyCategory, {
                      id: companyCategory.toLowerCase().replace(/\s+/g, '_'),
                      label: companyCategory,
                      count: companyItems.length,
                      type: 'company',
                      company_name: companyName,
                      is_selected: true
                    });
                  }
                });
                
                finalCompanies.forEach(company => {
                  const companyCategoryKey = company.category; // e.g., "WorldVisa Company Documents"
                  
                  // Count items for this specific company
                  // First try to match by company_name if it exists
                  let companyItems = checklistData.data.filter(item => 
                    item.document_category === 'Company' && 
                    item.company_name === company.name
                  );
                  
                  // If no items found by company_name, fall back to counting all company items
                  if (companyItems.length === 0) {
                    companyItems = checklistData.data.filter(item => item.document_category === 'Company');
                  }
                  
                  if (companyItems.length > 0 && !categoryMap.has(companyCategoryKey)) {
                    categoryMap.set(companyCategoryKey, {
                      id: companyCategoryKey.toLowerCase().replace(/\s+/g, '_'),
                      label: companyCategoryKey,
                      count: companyItems.length,
                      type: 'company',
                      company_name: company.name,
                      is_selected: true
                    });
                  }
                });
                
                return Array.from(categoryMap.values());
              })() : []}
              hasCompanyDocuments={hasCompanyDocuments}
              // Loading state
              isCategoryChanging={isCategoryChanging}
            />

            {/* Conditional Rendering */}
            {(() => {
              const hasChecklist = checklistData?.data && Array.isArray(checklistData.data) && checklistData.data.length > 0;
              const hasSubmittedDocuments = (documentsData?.data?.documents?.length || 0) > 0;
              
              // If no checklist and no submitted documents, show the no checklist message
              if (!hasChecklist && !hasSubmittedDocuments) {
                return (
                  <div className="text-center py-12">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md mx-auto">
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Checklist Generated</h3>
                      <p className="text-yellow-700">
                        No checklist has been generated. Contact your application handling processing executive.
                      </p>
                    </div>
                  </div>
                );
              }
              
              // If no checklist but has submitted documents, show submitted documents
              if (!hasChecklist && hasSubmittedDocuments) {
                return (
                  <DocumentsTable
                    applicationId={applicationId}
                    currentPage={documentsPage}
                    limit={documentsLimit}
                    onPageChange={handleDocumentsPageChange}
                    isClientView={true}
                    clientDocumentsData={documentsData}
                    clientIsLoading={isDocumentsLoading}
                    clientError={documentsError}
                    onClientDeleteSuccess={handleUploadSuccess}
                  />
                );
              }
              
              // Normal rendering based on selected category
              if (selectedCategory === 'submitted') {
                return (
                  <DocumentsTable
                    applicationId={applicationId}
                    currentPage={documentsPage}
                    limit={documentsLimit}
                    onPageChange={handleDocumentsPageChange}
                    isClientView={true}
                    clientDocumentsData={documentsData}
                    clientIsLoading={isDocumentsLoading}
                    clientError={documentsError}
                    onClientDeleteSuccess={handleUploadSuccess}
                  />
                );
              } else {
                return (
                  <DocumentChecklistTable
                    documents={documentsData?.data?.documents as unknown as Document[]}
                    isLoading={isChecklistLoading}
                    error={checklistError}
                    applicationId={applicationId}
                    selectedCategory={selectedCategory as DocumentCategory}
                    companies={finalCompanies}
                    isClientView={true}
                    checklistData={checklistData}
                    checklistState={checklistData?.data && checklistData.data.length > 0 ? 'saved' : 'none'}
                    onAddCompany={() => setIsAddCompanyDialogOpen(true)}
                    onRemoveCompany={handleRemoveCompany}
                  />
                );
              }
            })()}
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
        onClose={() => setIsAddCompanyDialogOpen(false)}
        onAddCompany={handleAddCompany}
        existingCompanies={finalCompanies}
        maxCompanies={5}
      />
    </div>
  );
}
