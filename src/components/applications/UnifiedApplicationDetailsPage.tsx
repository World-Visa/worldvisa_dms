"use client";

import { AddCompanyDialog } from '@/components/applications/AddCompanyDialog';
import { ApplicantDetails } from '@/components/applications/ApplicantDetails';
import { ApplicationDetailsHeader } from '@/components/applications/ApplicationDetailsHeader';
import { DownloadAllDocumentsModal } from '@/components/applications/DownloadAllDocumentsModal';
import { QualityCheckModal } from '@/components/applications/QualityCheckModal';
import { ReuploadDocumentModal } from '@/components/applications/ReuploadDocumentModal';
import { ResetPasswordModal } from '@/components/applications/ResetPasswordModal';
import { LayoutChips } from '@/components/applications/layouts/LayoutChips';
import { SkillAssessmentLayout } from '@/components/applications/layouts/SkillAssessmentLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSpouseApplicationDetails } from '@/hooks/useSpouseApplicationDetails';
import { useAllApplicationDocuments, useApplicationDocuments } from '@/hooks/useApplicationDocuments';
import { useAuth } from '@/hooks/useAuth';
import { useChecklistState } from '@/hooks/useChecklistState';
import { useApplicationState } from '@/hooks/useApplicationState';
import { useApplicationModals } from '@/hooks/useApplicationModals';
import { useLayoutState } from '@/hooks/useLayoutState';
import { useChecklistURLState } from '@/lib/urlState';
import { ApplicationDetailsResponse, Document } from '@/types/applications';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BadgeCheck } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useCallback, lazy, Suspense, useState } from 'react';
import { useApplicationDetails } from '@/hooks/useApplicationDetails';
import { TooltipProvider } from '../ui/tooltip';
import type { DocumentCategory } from '@/types/documents';
import { areAllMandatoryDocumentsReviewed } from '@/utils/checklistValidation';

const OutcomeLayout = lazy(() => 
  import('@/components/applications/layouts/OutcomeLayout').then(mod => ({ default: mod.OutcomeLayout }))
);
const EOILayout = lazy(() => 
  import('@/components/applications/layouts/EOILayout').then(mod => ({ default: mod.EOILayout }))
);
const InvitationLayout = lazy(() => 
  import('@/components/applications/layouts/InvitationLayout').then(mod => ({ default: mod.InvitationLayout }))
);

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

  const { category: urlCategory } = useChecklistURLState(applicationId);

  const layoutState = useLayoutState();
  const modals = useApplicationModals();

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

  const {
    data: allDocumentsData,
    isLoading: isAllDocumentsLoading,
    error: allDocumentsError,
  } = useAllApplicationDocuments(applicationId);

  const application = (applicationData as ApplicationDetailsResponse)?.data || applicationData;
  const documents = documentsData?.data;
  const allDocuments = allDocumentsData?.data;

  const appState = useApplicationState({
    applicationId,
    urlCategory,
    allDocuments,
  });

  const checklistState = useChecklistState({
    applicationId,
    documents: allDocuments,
    companies: appState.companies,
    recordType: application?.Record_Type,
  });

  const areAllDocumentsApproved = useMemo(() => {
    if (isSpouseApplication) {
      return false;
    }
    return areAllMandatoryDocumentsReviewed(
      checklistState.checklistData?.data,
      allDocuments
    );
  }, [allDocuments, isSpouseApplication, checklistState.checklistData]);

  const [documentsPage, setDocumentsPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const maxCompanies = 10;

  useEffect(() => {
    setDocumentsPage(1);
  }, [appState.selectedCategory]);

  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'team_leader' && user?.role !== 'master_admin' && user?.role !== 'supervisor'))) {
      router.push('/admin-login');
    }
  }, [isAuthenticated, isAuthLoading, user?.role, router]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const queries = [
        queryClient.invalidateQueries({ queryKey: ["application-documents", applicationId] }),
        queryClient.invalidateQueries({ queryKey: ["application-documents-all", applicationId] }),
        queryClient.invalidateQueries({ queryKey: ["application-documents-paginated", applicationId] }),
        queryClient.invalidateQueries({ queryKey: ["checklist", applicationId] }),
        queryClient.invalidateQueries({ queryKey: ["document-comment-counts"] }),
        queryClient.invalidateQueries({ queryKey: ["application"] }),
      ];

      if (isSpouseApplication) {
        queries.push(
          queryClient.invalidateQueries({ queryKey: ["spouse-application-details", applicationId] })
        );
      } else {
        queries.push(
          queryClient.invalidateQueries({ queryKey: ["application-details", applicationId] })
        );
      }

      await Promise.all(queries);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [applicationId, isSpouseApplication, queryClient]);

  const handlePushForQualityCheck = useCallback(() => {
    if (isSpouseApplication || !user?.username || !application?.id) {
      console.error('Missing user or application data, or spouse application');
      return;
    }
    modals.openQualityCheckModal();
  }, [isSpouseApplication, user?.username, application?.id, modals]);

  const handleReuploadDocument = useCallback((
    documentId: string,
    documentType: string,
    category: string
  ) => {
    const documentToReupload = documents?.find((doc) => doc._id === documentId);
    if (!documentToReupload) {
      console.error("Document not found for reupload:", documentId);
      return;
    }
    modals.openReuploadModal(documentToReupload, documentType, category);
  }, [documents, modals]);

  const handleCancelChecklist = useCallback(async () => {
    appState.setIsCategoryChanging(true);
    try {
      checklistState.cancelChecklistOperation();
      await appState.handleCategoryChange("submitted");
    } finally {
      appState.setIsCategoryChanging(false);
    }
  }, [appState, checklistState]);

  const handleCategoryChangeWithChecklist = useCallback(async (category: DocumentCategory) => {
    await appState.handleCategoryChange(category);
  }, [appState]);

  const handleStartCreatingChecklist = useCallback(async () => {
    appState.setIsCategoryChanging(true);
    try {
      checklistState.startCreatingChecklist();
      await appState.handleCategoryChange("all");
    } finally {
      appState.setIsCategoryChanging(false);
    }
  }, [appState, checklistState]);

  const handleStartEditingChecklist = useCallback(async () => {
    appState.setIsCategoryChanging(true);
    try {
      checklistState.startEditingChecklist();
      let targetCategory: DocumentCategory = "checklist";
      if (appState.selectedCategory.includes("_company_documents")) {
        targetCategory = appState.selectedCategory as DocumentCategory;
      } else if (appState.selectedCategory === "submitted") {
        const firstCategory = checklistState.checklistCategories[0];
        if (firstCategory) {
          targetCategory = firstCategory.id as DocumentCategory;
        }
      }
      await appState.handleCategoryChange(targetCategory);
    } finally {
      appState.setIsCategoryChanging(false);
    }
  }, [appState, checklistState]);

  const backPath = useMemo(() => 
    isSpouseApplication
      ? '/admin/spouse-skill-assessment-applications'
      : '/admin/applications',
    [isSpouseApplication]
  );

  const pageTitle = useMemo(() =>
    isSpouseApplication
      ? 'Spouse Application Details'
      : 'Application Details',
    [isSpouseApplication]
  );

  const isAuthorized = useMemo(() => 
    !isAuthLoading && isAuthenticated && 
    (user?.role === 'admin' || user?.role === 'team_leader' || 
     user?.role === 'master_admin' || user?.role === 'supervisor'),
    [isAuthLoading, isAuthenticated, user?.role]
  );

  if (applicationError || documentsError) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
          </Button>
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
            <Button
              variant="outline"
              className="rounded-full w-8 h-8 cursor-pointer"
              size="sm"
              onClick={() => router.push(backPath)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
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
              <div className="text-muted-foreground">
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
          <ApplicationDetailsHeader
            areAllDocumentsApproved={areAllDocumentsApproved}
            onPushForQualityCheck={handlePushForQualityCheck}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            onDownloadAll={modals.openDownloadAllModal}
            onResetPassword={modals.openResetPasswordModal}
            userRole={user?.role}
          />
        </div>
      </TooltipProvider>

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
      ) : isAuthorized ? (
        <div className="space-y-6">
          <ApplicantDetails
            application={application}
            isLoading={isApplicationLoading}
            error={applicationError}
            user={user}
          />

          <LayoutChips
            selectedLayout={layoutState.selectedLayout}
            onLayoutChange={layoutState.handleLayoutChange}
          />

          {layoutState.selectedLayout === 'skill-assessment' ? (
            <SkillAssessmentLayout
              allDocuments={allDocuments}
              isAllDocumentsLoading={isAllDocumentsLoading}
              allDocumentsError={allDocumentsError}
              selectedCategory={appState.selectedCategory}
              onCategoryChange={handleCategoryChangeWithChecklist}
              companies={appState.companies}
              onAddCompany={modals.openAddCompanyDialog}
              onRemoveCompany={appState.handleRemoveCompany}
              maxCompanies={maxCompanies}
              checklistState={checklistState}
              onStartCreatingChecklist={handleStartCreatingChecklist}
              onStartEditingChecklist={handleStartEditingChecklist}
              onSaveChecklist={checklistState.saveChecklist}
              onCancelChecklist={handleCancelChecklist}
              isCategoryChanging={appState.isCategoryChanging}
              applicationId={applicationId}
              documentsPage={documentsPage}
              onDocumentsPageChange={setDocumentsPage}
              onReuploadDocument={handleReuploadDocument}
            />
          ) : layoutState.selectedLayout === 'outcome' ? (
            <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
              <OutcomeLayout applicationId={applicationId} />
            </Suspense>
          ) : layoutState.selectedLayout === 'eoi' ? (
            <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
              <EOILayout applicationId={applicationId} />
            </Suspense>
          ) : layoutState.selectedLayout === 'invitation' ? (
            <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
              <InvitationLayout applicationId={applicationId} />
            </Suspense>
          ) : null}
        </div>
      ) : (
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      )}

      <AddCompanyDialog
        isOpen={modals.isAddCompanyDialogOpen}
        onClose={modals.closeAddCompanyDialog}
        onAddCompany={appState.handleAddCompany}
        existingCompanies={appState.companies}
        maxCompanies={maxCompanies}
      />

      <ReuploadDocumentModal
        isOpen={modals.isReuploadModalOpen}
        onClose={modals.closeReuploadModal}
        applicationId={applicationId}
        document={modals.selectedReuploadDocument}
        documentType={modals.selectedReuploadDocumentType}
        category={modals.selectedReuploadDocumentCategory}
        isClientView={false}
      />

      {!isSpouseApplication && (
        <QualityCheckModal
          applicationId={applicationId}
          leadId={application?.id || ''}
          isOpen={modals.isQualityCheckModalOpen}
          onOpenChange={modals.setQualityCheckModalOpen}
          disabled={!areAllDocumentsApproved}
          recordType={application?.Record_Type}
        />
      )}

      {user?.role !== 'client' && (
        <>
          <ResetPasswordModal
            isOpen={modals.isResetPasswordModalOpen}
            onOpenChange={modals.setResetPasswordModalOpen}
            leadId={application?.id || ''}
            onSuccess={() => console.log('Password reset successfully')}
          />

          <DownloadAllDocumentsModal
            isOpen={modals.isDownloadAllModalOpen}
            onOpenChange={modals.setDownloadAllModalOpen}
            leadId={application?.id || ''}
          />
        </>
      )}
    </div>
  );
}
