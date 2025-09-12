'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
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

export default function ApplicationDetailsPage() {
  const params = useParams();
  const applicationId = params.id as string;
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>(() => {
    const savedCategory = localStorageUtils.loadCategory(applicationId, 'submitted') as DocumentCategory;
    // Category restored from localStorage
    return savedCategory;
  });
  
  // Initialize companies from localStorage or empty array
  const [companies, setCompanies] = useState<Company[]>(() => {
    const savedCompanies = localStorageUtils.loadCompanies(applicationId, []);
    return savedCompanies;
  });
  
  const [isAddCompanyDialogOpen, setIsAddCompanyDialogOpen] = useState(false);
  const [documentsPage, setDocumentsPage] = useState(1);
  const maxCompanies = 5;

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

  const handleCategoryChange = (category: DocumentCategory) => {
    setSelectedCategory(category);    
    localStorageUtils.saveCategory(applicationId, category);
    // Category saved to localStorage
  };

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/applications" className='items-center flex'>
            <Button variant="outline" className='rounded-full w-8 h-8 cursor-pointer ' size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-lexend font-bold">Application Details</h1>
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
      {isApplicationLoading && isDocumentsLoading ? (
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
      ) : (
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
              onCategoryChange={handleCategoryChange}
              companies={companies}
              onAddCompany={handleOpenAddCompanyDialog}
              maxCompanies={maxCompanies}
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
              />
            )}
          </div>
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