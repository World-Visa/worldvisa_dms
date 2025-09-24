"use client";

import { AddCompanyDialog } from '@/components/applications/AddCompanyDialog';
import { ApplicantDetails } from '@/components/applications/ApplicantDetails';
import { DocumentCategoryFilter } from '@/components/applications/DocumentCategoryFilter';
import { DocumentChecklistTable } from '@/components/applications/DocumentChecklistTable';
import { DocumentsTable } from '@/components/applications/DocumentsTable';
import { QualityCheckModal } from '@/components/applications/QualityCheckModal';
import { ReuploadDocumentModal } from '@/components/applications/ReuploadDocumentModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useApplicationDetails } from '@/hooks/useApplicationDetails';
import { useSpouseApplicationDetails } from '@/hooks/useSpouseApplicationDetails';
import { useAllApplicationDocuments, useApplicationDocuments } from '@/hooks/useApplicationDocuments';
import { useAuth } from '@/hooks/useAuth';
import { useChecklistState } from '@/hooks/useChecklistState';
import { localStorageUtils } from '@/lib/localStorage';
import { parseCompaniesFromDocuments } from '@/utils/companyParsing';
import { useChecklistURLState } from '@/lib/urlState';
import { ApplicationDetailsResponse, Document } from '@/types/applications';
import { Company, DocumentCategory } from '@/types/documents';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BadgeCheck, CheckCircle, RefreshCw } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface UnifiedApplicationDetailsPageProps {
  isSpouseApplication?: boolean;
}

export default function UnifiedApplicationDetailsPage({
  isSpouseApplication = false
}: UnifiedApplicationDetailsPageProps) {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  // URL state management
  const { category: urlCategory, setCategory: setURLCategory } =
    useChecklistURLState(applicationId);

  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>(
    () => {
      // Use URL state first, then fallback to localStorage
      const savedCategory = localStorageUtils.loadCategory(
        applicationId,
        urlCategory
      ) as DocumentCategory;
      return savedCategory;
    }
  );

  const [isCategoryChanging, setIsCategoryChanging] = useState(false);

  // Initialize companies from localStorage or empty array
  const [companies, setCompanies] = useState<Company[]>(() => {
    const savedCompanies = localStorageUtils.loadCompanies(applicationId, []);
    return savedCompanies;
  });

  const [isAddCompanyDialogOpen, setIsAddCompanyDialogOpen] = useState(false);
  const [isReuploadModalOpen, setIsReuploadModalOpen] = useState(false);
  const [selectedReuploadDocument, setSelectedReuploadDocument] =
    useState<Document | null>(null);
  const [selectedReuploadDocumentType, setSelectedReuploadDocumentType] =
    useState<string>("");
  const [
    selectedReuploadDocumentCategory,
    setSelectedReuploadDocumentCategory,
  ] = useState<string>("");
  const [documentsPage, setDocumentsPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isQualityCheckModalOpen, setIsQualityCheckModalOpen] = useState(false);
  const maxCompanies = 5;

  // Check authentication
  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'team_leader' && user?.role !== 'master_admin' && user?.role !== 'supervisor'))) {
      router.push('/admin-login');
    }
  }, [isAuthenticated, isAuthLoading, user?.role, router]);

  // Use both hooks but only use the appropriate one based on application type
  const spouseApplicationQuery = useSpouseApplicationDetails(applicationId);
  const regularApplicationQuery = useApplicationDetails(applicationId);

  const applicationData = isSpouseApplication ? spouseApplicationQuery.data : regularApplicationQuery.data;
  const isApplicationLoading = isSpouseApplication ? spouseApplicationQuery.isLoading : regularApplicationQuery.isLoading;
  const applicationError = isSpouseApplication ? spouseApplicationQuery.error : regularApplicationQuery.error;

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

  const application = (applicationData as ApplicationDetailsResponse)?.data || applicationData;
  const documents = documentsData?.data;
  const allDocuments = allDocumentsData?.data;

  const checklistState = useChecklistState({
    applicationId,
    documents: allDocuments,
    companies,
    recordType: application?.Record_Type,
  });

  // Refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidate all relevant queries based on application type
      const queries = [
        queryClient.invalidateQueries({
          queryKey: ["application-documents", applicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["application-documents-all", applicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["application-documents-paginated", applicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["checklist", applicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["document-comment-counts"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["application"],
        }),
      ];

      // Add application-specific query
      if (isSpouseApplication) {
        queries.push(
          queryClient.invalidateQueries({
            queryKey: ["spouse-application-details", applicationId],
          })
        );
      } else {
        queries.push(
          queryClient.invalidateQueries({
            queryKey: ["application-details", applicationId],
          })
        );
      }

      await Promise.all(queries);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check if all submitted documents are approved (only for regular applications)
  const areAllDocumentsReviewed = useMemo(() => {
    if (isSpouseApplication || !allDocuments || allDocuments.length === 0) {
      return false;
    }

    // Check if all documents have approved status (check ALL documents, not just paginated ones)
    return allDocuments.every((doc: Document) => doc.status === 'reviewed');
  }, [allDocuments, isSpouseApplication]);

  // Handle push for quality check (only for regular applications)
  const handlePushForQualityCheck = () => {
    if (isSpouseApplication || !user?.username || !application?.id) {
      console.error('Missing user or application data, or spouse application');
      return;
    }

    setIsQualityCheckModalOpen(true);
  };

  // Populate companies state from existing documents with company information
  useEffect(() => {
    if (allDocuments && allDocuments.length > 0) {
      const parsedCompanies = parseCompaniesFromDocuments(allDocuments);
      if (parsedCompanies.length > 0) {
        setCompanies(parsedCompanies);
      }
    }
  }, [allDocuments]);

  const handleAddCompany = (company: Company) => {
    // Don't override the category - it's already set correctly in AddCompanyDialog
    const newCompanies = [...companies, company];
    setCompanies(newCompanies);
    localStorageUtils.saveCompanies(applicationId, newCompanies);
  };

  const handleRemoveCompany = (companyName: string) => {
    const newCompanies = companies.filter(
      (company) => company.name.toLowerCase() !== companyName.toLowerCase()
    );
    setCompanies(newCompanies);
    localStorageUtils.saveCompanies(applicationId, newCompanies);
    if (selectedCategory === `company-${companyName}`) {
      setSelectedCategory("all");
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

  const handleReuploadDocument = (
    documentId: string,
    documentType: string,
    category: string
  ) => {
    // Find the document to reupload
    const documentToReupload = documents?.find((doc) => doc._id === documentId);
    if (!documentToReupload) {
      console.error("Document not found for reupload:", documentId);
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
    setSelectedReuploadDocumentType("");
    setSelectedReuploadDocumentCategory("");
  };

  // Enhanced cancel function that also resets category
  const handleCancelChecklist = async () => {
    setIsCategoryChanging(true);
    try {
      checklistState.cancelChecklistOperation();
      // Reset to submitted documents when canceling
      setSelectedCategory("submitted");
      setURLCategory("submitted");
      localStorageUtils.saveCategory(applicationId, "submitted");

      // Add a small delay to show the loading state
      await new Promise((resolve) => setTimeout(resolve, 300));
    } finally {
      setIsCategoryChanging(false);
    }
  };

  // Enhanced category change handler that also updates checklist state
  const handleCategoryChangeWithChecklist = async (
    category: DocumentCategory
  ) => {
    setIsCategoryChanging(true);
    try {
      setSelectedCategory(category);
      setURLCategory(category);
      localStorageUtils.saveCategory(applicationId, category);

      // Add a small delay to show the loading state
      await new Promise((resolve) => setTimeout(resolve, 300));
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
      setSelectedCategory("all");
      setURLCategory("all");
      localStorageUtils.saveCategory(applicationId, "all");

      // Add a small delay to show the loading state
      await new Promise((resolve) => setTimeout(resolve, 300));
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
      let targetCategory: DocumentCategory = "checklist";

      // If we're on a company-specific category, maintain it
      if (selectedCategory.includes("_company_documents")) {
        targetCategory = selectedCategory as DocumentCategory;
      } else if (selectedCategory === "submitted") {
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
      await new Promise((resolve) => setTimeout(resolve, 300));
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

  const handleBack = () => {
    router.back();
  }

  if (applicationError || documentsError) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="items-center flex">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
            </Button>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertDescription>
            Failed to load application details. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Determine the back navigation path
  const backPath = isSpouseApplication
    ? '/admin/spouse-skill-assessment-applications'
    : '/admin/applications';

  // Determine the page title
  const pageTitle = isSpouseApplication
    ? 'Spouse Application Details'
    : 'Application Details';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <TooltipProvider>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="items-center flex">
              <Button
                variant="outline"
                className="rounded-full w-8 h-8 cursor-pointer "
                size="sm"
                onClick={() => router.push(backPath)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <h1 className="text-xl flex md:flex-row flex-col items-start md:items-center gap-4 sm:text-2xl font-lexend font-bold">
                {pageTitle}
                {!isSpouseApplication && (
                  <Badge variant="default" className='bg-gradient-to-r from-blue-500/10 to-blue-500/20 text-blue-600 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200 md:mb-0 mb-2 md:h-8 flex items-center gap-2 px-3 py-1 rounded-full font-medium'>
                    <BadgeCheck size={16} className="text-blue-500" />
                    {application?.Package_Finalize || 'Not provided'}
                  </Badge>
                )}
                {isSpouseApplication && (
                  <Badge variant="outline" className="text-sm">
                    Spouse Skill Assessment
                  </Badge>
                )}
              </h1>
              <div className="text-muted-foreground ">
                {isApplicationLoading ? (
                  <Skeleton className="h-4 w-32" />
                ) : application ? (
                  `Application ID: ${application.id}`
                ) : (
                  "Loading..."
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      variant={areAllDocumentsReviewed ? "default" : "outline"}
                      size="sm"
                      onClick={handlePushForQualityCheck}
                      disabled={!areAllDocumentsReviewed}
                      className={`flex items-center gap-2 cursor-pointer ${areAllDocumentsReviewed
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "opacity-50 cursor-not-allowed"
                        }`}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        Push for Quality Check
                      </span>
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {areAllDocumentsReviewed
                    ? "All documents are approved. Ready for quality check."
                    : "All submitted documents must be reviewed before pushing for quality check."}
                </TooltipContent>
              </Tooltip>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </TooltipProvider>

      {/* Loading State */}
      {isAuthLoading || isApplicationLoading || isDocumentsLoading ? (
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
      ) : !isAuthLoading && isAuthenticated && (user?.role === 'admin' || user?.role === 'team_leader' || user?.role === 'master_admin' || user?.role === 'supervisor') ? (
        <div className="space-y-6">
          {/* Applicant Details */}
          <ApplicantDetails
            application={application}
            isLoading={isApplicationLoading}
            error={applicationError}
            allDocuments={allDocuments}
            isAllDocumentsLoading={isAllDocumentsLoading}
            allDocumentsError={allDocumentsError}
            user={user}
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
              onSaveChecklist={
                checklistState.state === "editing"
                  ? checklistState.savePendingChanges
                  : checklistState.saveChecklist
              }
              onCancelChecklist={handleCancelChecklist}
              isSavingChecklist={checklistState.isBatchSaving}
              // Loading state
              isCategoryChanging={isCategoryChanging}
            />

            {/* Conditional Rendering */}
            {selectedCategory === "submitted" ? (
              <DocumentsTable
                applicationId={applicationId}
                currentPage={documentsPage}
                limit={10}
                onPageChange={handleDocumentsPageChange}
                onReuploadDocument={handleReuploadDocument}
                isClientView={false}
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
                isClientView={false}
                // Checklist props
                checklistState={checklistState.state}
                filteredDocuments={checklistState.filteredDocuments}
                currentChecklistDocuments={
                  checklistState.currentChecklistDocuments
                }
                availableDocumentsForEditing={
                  checklistState.availableDocumentsForEditing
                }
                selectedDocuments={checklistState.selectedDocuments}
                requirementMap={checklistState.requirementMap}
                onSelectDocument={checklistState.selectDocument}
                onUpdateDocumentRequirement={
                  checklistState.updateDocumentRequirement
                }
                onUpdateChecklist={checklistState.updateChecklist}
                checklistData={checklistState.checklistData}
                // Pending changes props
                pendingAdditions={checklistState.pendingAdditions}
                pendingDeletions={checklistState.pendingDeletions}
                pendingUpdates={[]}
                onAddToPendingChanges={checklistState.addToPendingChanges}
                onRemoveFromPendingChanges={
                  checklistState.removeFromPendingChanges
                }
                onAddToPendingDeletions={checklistState.addToPendingDeletions}
                onRemoveFromPendingDeletions={
                  checklistState.removeFromPendingDeletions
                }
                onSavePendingChanges={checklistState.savePendingChanges}
                onClearPendingChanges={checklistState.clearPendingChanges}
                isBatchDeleting={checklistState.isBatchDeleting}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don&apos;t have permission to access this page.
          </p>
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
        document={selectedReuploadDocument}
        documentType={selectedReuploadDocumentType}
        category={selectedReuploadDocumentCategory}
        isClientView={false}
      />

      {/* Quality Check Modal - Only for regular applications */}
      {!isSpouseApplication && (
        <QualityCheckModal
          applicationId={applicationId}
          leadId={application?.id || ''}
          isOpen={isQualityCheckModalOpen}
          onOpenChange={setIsQualityCheckModalOpen}
          disabled={!areAllDocumentsReviewed}
          recordType={application?.Record_Type}
        />
      )}
    </div>
  );
}
