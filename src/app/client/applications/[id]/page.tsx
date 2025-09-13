'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ClientApplicationDetails } from '@/components/applications/ClientApplicationDetails';
import { DocumentsTable } from '@/components/applications/DocumentsTable';
import { DocumentChecklistTable } from '@/components/applications/DocumentChecklistTable';
import { DocumentCategoryFilter } from '@/components/applications/DocumentCategoryFilter';
import { DocumentCategory, Company } from '@/types/documents';
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

  const handleDocumentsPageChange = (page: number) => {
    setDocumentsPage(page);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setDocumentsPage(1);
  };

  const handleUploadSuccess = () => {
    window.location.reload();
  };

  // Company management functions
  const handleAddCompany = (company: Company) => {
    setCompanies(prev => [...prev, company]);
    setIsAddCompanyDialogOpen(false);
  };

  const handleRemoveCompany = (companyName: string) => {
    setCompanies(prev => prev.filter(company => company.name !== companyName));
  };

  // Check if checklist has company documents
  const hasCompanyDocuments = checklistData?.data?.some(item => item.document_category === 'Company') || false;

  // Debug: Log checklist data
  console.log('Checklist data:', checklistData);
  console.log('Checklist categories being passed:', Array.isArray(checklistData?.data) ? checklistData.data.map(item => ({
    id: item.document_category.toLowerCase().replace(/\s+/g, '_'),
    label: item.document_category === 'Identity' ? 'Identity Documents' : item.document_category,
    count: 0,
    type: 'base',
    company_name: item.company_name,
    is_selected: true
  })) : []);
  

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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/client/applications" className='items-center flex'>
            <Button variant="outline" className='rounded-full w-8 h-8 cursor-pointer ' size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
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
              companies={companies}
              onAddCompany={() => setIsAddCompanyDialogOpen(true)}
              maxCompanies={3}
              isClientView={true}
              submittedDocumentsCount={documentsData?.data?.documents?.length || 0}
              checklistCategories={Array.isArray(checklistData?.data) ? checklistData.data.map(item => {
                let categoryLabel = item.document_category;
                if (item.document_category === 'identity') {
                  categoryLabel = 'Identity Documents';
                } else if (item.document_category === 'Education') {
                  categoryLabel = 'Education Documents';
                } else if (item.document_category === 'Other') {
                  categoryLabel = 'Other Documents';
                } else if (item.document_category === 'Company') {
                  categoryLabel = 'Company Documents';
                }
                
                return {
                  id: categoryLabel.toLowerCase().replace(/\s+/g, '_'),
                  label: categoryLabel,
                  count: 0,
                  type: 'base',
                  company_name: item.company_name,
                  is_selected: true
                };
              }) : []}
              hasCompanyDocuments={hasCompanyDocuments}
            />

            {/* Conditional Rendering */}
            {selectedCategory === 'submitted' ? (
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
            ) : (
              <DocumentChecklistTable
                documents={documentsData?.data?.documents}
                isLoading={isChecklistLoading}
                error={checklistError}
                applicationId={applicationId}
                selectedCategory={selectedCategory as DocumentCategory}
                companies={companies}
                isClientView={true}
                checklistData={checklistData}
                onAddCompany={() => setIsAddCompanyDialogOpen(true)}
                onRemoveCompany={handleRemoveCompany}
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
        onClose={() => setIsAddCompanyDialogOpen(false)}
        onAddCompany={handleAddCompany}
        existingCompanies={companies}
        maxCompanies={3}
      />
    </div>
  );
}
