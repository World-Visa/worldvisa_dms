"use client";

import { ActivateAccountSheet } from "@/components/applications/ActivateAccountSheet";
import ViewDocumentSheet from "@/components/applications/ViewDocumentSheet";
import { AddNoteModal } from "@/components/applications/AddNoteModal";
import { NotesBanner } from "@/components/applications/NotesBanner";
import { AddCompanyDialog } from "@/components/applications/AddCompanyDialog";
import { ApplicationDetailsSkeleton } from "@/components/applications/ApplicationDetailsSkeleton";
import { ApplicantDetails } from "@/components/applications/ApplicantDetails";
import { ApplicationDetailsHeader } from "@/components/applications/ApplicationDetailsHeader";
import { DownloadAllDocumentsModal } from "@/components/applications/DownloadAllDocumentsModal";
import { QualityCheckModal } from "@/components/applications/QualityCheckModal";
import { ReuploadDocumentModal } from "@/components/applications/ReuploadDocumentModal";
import { ResetPasswordModal } from "@/components/applications/ResetPasswordModal";
import { LayoutChips } from "@/components/applications/layouts/LayoutChips";
import { SkillAssessmentLayout } from "@/components/applications/layouts/SkillAssessmentLayout";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSpouseApplicationDetails } from "@/hooks/useSpouseApplicationDetails";
import {
  useAllApplicationDocuments,
  useApplicationDocuments,
} from "@/hooks/useApplicationDocuments";
import { useAuth } from "@/hooks/useAuth";
import { useChecklistState } from "@/hooks/useChecklistState";
import { useApplicationState } from "@/hooks/useApplicationState";
import { useApplicationModals } from "@/hooks/useApplicationModals";
import { useLayoutState } from "@/hooks/useLayoutState";
import { useChecklistURLState } from "@/lib/urlState";
import { ApplicationDetailsResponse } from "@/types/applications";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeepLinkDocument } from "@/hooks/useDeepLinkDocument";
import {
  useEffect,
  useMemo,
  useCallback,
  lazy,
  Suspense,
  useState,
} from "react";
import { useApplicationDetails } from "@/hooks/useApplicationDetails";
import type { DocumentCategory } from "@/types/documents";
import {
  areAllMandatoryDocumentsReviewed,
  getMandatoryDocumentValidationDetails,
} from "@/utils/checklistValidation";
import { useApplicationNotes, useDeleteNote } from "@/hooks/useApplicationNotes";
import { useRemoveCompany } from "@/hooks/useRemoveCompany";
import type { ApplicationNote } from "@/lib/api/applicationNotes";
import { RemoveCompanyDialog } from "@/components/applications/RemoveCompanyDialog";

const OutcomeLayout = lazy(() =>
  import("@/components/applications/layouts/OutcomeLayout").then((mod) => ({
    default: mod.OutcomeLayout,
  })),
);
const EOILayout = lazy(() =>
  import("@/components/applications/layouts/EOILayout").then((mod) => ({
    default: mod.EOILayout,
  })),
);
const InvitationLayout = lazy(() =>
  import("@/components/applications/layouts/InvitationLayout").then((mod) => ({
    default: mod.InvitationLayout,
  })),
);

interface UnifiedApplicationDetailsPageProps {
  applicationId: string;
  isSpouseApplication?: boolean;
}

type ExtendedWindow = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export default function UnifiedApplicationDetailsPage({
  applicationId,
  isSpouseApplication = false,
}: UnifiedApplicationDetailsPageProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { category: urlCategory } = useChecklistURLState(applicationId);

  const layoutState = useLayoutState();
  const modals = useApplicationModals();

  const spouseApplicationQuery = useSpouseApplicationDetails(applicationId);
  const regularApplicationQuery = useApplicationDetails(applicationId);
  const applicationData = isSpouseApplication
    ? spouseApplicationQuery.data
    : regularApplicationQuery.data;
  const isApplicationLoading = isSpouseApplication
    ? spouseApplicationQuery.isLoading
    : regularApplicationQuery.isLoading;
  const applicationError = isSpouseApplication
    ? spouseApplicationQuery.error
    : regularApplicationQuery.error;

  const {
    data: documentsData,
    isLoading: isDocumentsLoading,
    error: documentsError,
  } = useApplicationDocuments(applicationId);

  const shouldEagerLoadAllDocuments = useMemo(
    () => urlCategory && urlCategory !== "submitted",
    [urlCategory],
  );
  const [shouldLoadAllDocuments, setShouldLoadAllDocuments] = useState<boolean>(
    () => Boolean(shouldEagerLoadAllDocuments),
  );

  useEffect(() => {
    if (shouldEagerLoadAllDocuments) {
      setShouldLoadAllDocuments(true);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const extendedWindow = window as ExtendedWindow;
    let idleHandle: number | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const triggerFetch = () => setShouldLoadAllDocuments(true);

    if (extendedWindow.requestIdleCallback) {
      idleHandle = extendedWindow.requestIdleCallback(triggerFetch, {
        timeout: 1500,
      });
    } else {
      timeoutHandle = setTimeout(triggerFetch, 200);
    }

    return () => {
      if (idleHandle !== null && extendedWindow.cancelIdleCallback) {
        extendedWindow.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    };
  }, [shouldEagerLoadAllDocuments]);

  const {
    data: allDocumentsData,
    isLoading: isAllDocumentsLoading,
    error: allDocumentsError,
  } = useAllApplicationDocuments(applicationId, {
    enabled: shouldLoadAllDocuments,
  });

  const application =
    (applicationData as ApplicationDetailsResponse)?.data || applicationData;
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
    recordType: isSpouseApplication
      ? "spouse_skill_assessment"
      : application?.Record_Type,
  });

  const areAllDocumentsApproved = useMemo(() => {
    return areAllMandatoryDocumentsReviewed(
      checklistState.checklistData?.data,
      allDocuments,
    );
  }, [allDocuments, checklistState.checklistData]);

  const mandatoryDocValidationDetails = useMemo(() => {
    return getMandatoryDocumentValidationDetails(
      checklistState.checklistData?.data,
      allDocuments,
    );
  }, [allDocuments, checklistState.checklistData]);

  const [documentsPage, setDocumentsPage] = useState(1);
  const [showSampleDocuments, setShowSampleDocuments] = useState(false);
  const maxCompanies = 10;

  const {
    removeCompanyDialog,
    isDeletingDocuments,
    handleRemoveCompanyWithDocuments,
    handleRemoveDocumentsAndCompany,
    handleRemoveCompanyDirect,
    handleCloseRemoveCompanyDialog,
  } = useRemoveCompany({
    allDocuments,
    companies: appState.companies,
    onRemoveCompany: appState.handleRemoveCompany,
  });

  // Notes state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ApplicationNote | null>(null);
  const { data: notesData } = useApplicationNotes(applicationId, isSpouseApplication);
  const notes = Array.isArray(notesData) ? notesData : [];
  const deleteNoteMutation = useDeleteNote(applicationId, isSpouseApplication);

  // Deep-link: auto-open a document sheet when navigating from a notification
  const { deepLinkDoc, clearDeepLinkDoc } = useDeepLinkDocument({
    allDocuments,
    documents,
  });

  useEffect(() => {
    setDocumentsPage(1);
  }, [appState.selectedCategory]);

  const handlePushForQualityCheck = useCallback(() => {
    if (!user?.username || !application?.id) {
      return;
    }
    modals.openQualityCheckModal();
  }, [user?.username, application?.id, modals]);

  const handleReuploadDocument = useCallback(
    (documentId: string, documentType: string, category: string) => {
      const documentToReupload = documents?.find(
        (doc) => doc._id === documentId,
      );
      if (!documentToReupload) {
        return;
      }
      modals.openReuploadModal(documentToReupload, documentType, category);
    },
    [documents, modals],
  );

  const handleCancelChecklist = useCallback(() => {
    checklistState.cancelChecklistOperation();
    appState.handleCategoryChange("submitted");
  }, [appState, checklistState]);

  const handleCategoryChangeWithChecklist = useCallback(
    (category: DocumentCategory) => {
      appState.handleCategoryChange(category);
    },
    [appState],
  );

  const handleStartCreatingChecklist = useCallback(() => {
    checklistState.startCreatingChecklist();
    appState.handleCategoryChange("all");
  }, [appState, checklistState]);

  const handleStartEditingChecklist = useCallback(() => {
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
    appState.handleCategoryChange(targetCategory);
  }, [appState, checklistState]);


  const backPath = useMemo(
    () =>
      isSpouseApplication
        ? "/v2/spouse-skill-assessment-applications"
        : "/v2/applications",
    [isSpouseApplication],
  );

  const pageTitle = useMemo(
    () =>
      isSpouseApplication
        ? "Spouse Application Details"
        : "Application Details",
    [isSpouseApplication],
  );

  const isAuthorized = useMemo(
    () =>
      !isAuthLoading &&
      isAuthenticated &&
      (user?.role === "admin" ||
        user?.role === "team_leader" ||
        user?.role === "master_admin" ||
        user?.role === "supervisor"),
    [isAuthLoading, isAuthenticated, user?.role],
  );

  if (applicationError || documentsError) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
        </Button>
        <ErrorState
          title="Failed to load application details"
          message="Please try again later."
        />
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            className="rounded-full w-9 h-9 cursor-pointer"
            size="sm"
            onClick={() => router.push(backPath)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl flex md:flex-row flex-col items-start md:items-center gap-4 sm:text-2xl font-medium">
              {application?.Name} {pageTitle}

            </h1>
          </div>
        </div>
        <ApplicationDetailsHeader
          areAllDocumentsApproved={areAllDocumentsApproved}
          validationDetails={mandatoryDocValidationDetails}
          onPushForQualityCheck={handlePushForQualityCheck}
          onDownloadAll={modals.openDownloadAllModal}
          onResetPassword={modals.openResetPasswordModal}
          onActivateAccount={modals.openActivateAccountSheet}
          applicationId={applicationId}
          onAddNote={() => {
            setEditingNote(null);
            setIsNoteModalOpen(true);
          }}
          userRole={user?.role}
          qcRequested={application?.qc_requested}
        />
      </div>

      {notes && notes.length > 0 && (
        <NotesBanner
          notes={notes as ApplicationNote[]}
          isAdmin={user?.role !== "client"}
          onEdit={(note) => {
            setEditingNote(note);
            setIsNoteModalOpen(true);
          }}
          onDelete={(noteId) => deleteNoteMutation.mutate(noteId)}
        />
      )}
      <AddNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false);
          setEditingNote(null);
        }}
        applicationId={applicationId}
        isSpouseApplication={isSpouseApplication}
        editNote={editingNote}
      />

      {isAuthLoading || isApplicationLoading || isDocumentsLoading ? (
        <ApplicationDetailsSkeleton variant="admin" showHeader={false} />
      ) : isAuthorized ? (
        <div className="space-y-6 mt-6">
          <ApplicantDetails
            application={application}
            isLoading={isApplicationLoading}
            error={applicationError}
            user={user}
          />

          <LayoutChips
            selectedLayout={layoutState.selectedLayout}
            onLayoutChange={layoutState.handleLayoutChange}
            showSampleDocuments={showSampleDocuments}
            onToggleSampleDocuments={() =>
              setShowSampleDocuments(!showSampleDocuments)
            }
          />

          {layoutState.selectedLayout === "skill-assessment" ? (
            <SkillAssessmentLayout
              allDocuments={allDocuments}
              isAllDocumentsLoading={isAllDocumentsLoading}
              allDocumentsError={allDocumentsError}
              selectedCategory={appState.selectedCategory}
              onCategoryChange={handleCategoryChangeWithChecklist}
              companies={appState.companies}
              onAddCompany={modals.openAddCompanyDialog}
              onRemoveCompany={appState.handleRemoveCompany}
              onRemoveCompanyWithCheck={handleRemoveCompanyWithDocuments}
              maxCompanies={maxCompanies}
              checklistState={checklistState}
              onStartCreatingChecklist={handleStartCreatingChecklist}
              onStartEditingChecklist={handleStartEditingChecklist}
              onSaveChecklist={checklistState.saveChecklist}
              onCancelChecklist={handleCancelChecklist}
              applicationId={applicationId}
              onReuploadDocument={handleReuploadDocument}
              showSampleDocuments={showSampleDocuments}
              onToggleSampleDocuments={() =>
                setShowSampleDocuments(!showSampleDocuments)
              }
            />
          ) : layoutState.selectedLayout === "outcome" ? (
            <Suspense
              fallback={<Skeleton className="h-96 w-full rounded-xl" />}
            >
              <OutcomeLayout applicationId={applicationId} />
            </Suspense>
          ) : layoutState.selectedLayout === "eoi" ? (
            <Suspense
              fallback={<Skeleton className="h-96 w-full rounded-xl" />}
            >
              <EOILayout applicationId={applicationId} />
            </Suspense>
          ) : layoutState.selectedLayout === "invitation" ? (
            <Suspense
              fallback={<Skeleton className="h-96 w-full rounded-xl" />}
            >
              <InvitationLayout applicationId={applicationId} />
            </Suspense>
          ) : null}
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

      <AddCompanyDialog
        isOpen={modals.isAddCompanyDialogOpen}
        onClose={modals.closeAddCompanyDialog}
        onAddCompany={appState.handleAddCompany}
        existingCompanies={appState.companies}
        maxCompanies={maxCompanies}
      />

      {removeCompanyDialog.company && (
        <RemoveCompanyDialog
          isOpen={removeCompanyDialog.isOpen}
          onClose={handleCloseRemoveCompanyDialog}
          onConfirm={handleRemoveCompanyDirect}
          company={removeCompanyDialog.company}
          hasDocuments={removeCompanyDialog.hasDocuments}
          documentCount={removeCompanyDialog.documentCount}
          isDeleting={isDeletingDocuments}
          onRemoveDocumentsAndCompany={handleRemoveDocumentsAndCompany}
        />
      )}

      <ReuploadDocumentModal
        isOpen={modals.isReuploadModalOpen}
        onClose={modals.closeReuploadModal}
        applicationId={applicationId}
        document={modals.selectedReuploadDocument}
        documentType={modals.selectedReuploadDocumentType}
        category={modals.selectedReuploadDocumentCategory}
        isClientView={false}
      />

      <QualityCheckModal
        applicationId={applicationId}
        leadId={application?.id || ""}
        isOpen={modals.isQualityCheckModalOpen}
        onOpenChange={modals.setQualityCheckModalOpen}
        disabled={!areAllDocumentsApproved}
        recordType={application?.Record_Type}
        existingQc={application?.qc_requested}
      />

      {user?.role !== "client" && (
        <>
          <ResetPasswordModal
            isOpen={modals.isResetPasswordModalOpen}
            onOpenChange={modals.setResetPasswordModalOpen}
            leadId={application?.id || ""}
            onSuccess={() => {}}
          />

          <DownloadAllDocumentsModal
            isOpen={modals.isDownloadAllModalOpen}
            onOpenChange={modals.setDownloadAllModalOpen}
            leadId={application?.id || ""}
          />

          <ActivateAccountSheet
            open={modals.isActivateAccountSheetOpen}
            onOpenChange={modals.setActivateAccountSheetOpen}
            leadId={application?.id || ""}
            application={application}
          />
        </>
      )}

      {deepLinkDoc && (
        <ViewDocumentSheet
          document={deepLinkDoc}
          documents={allDocuments ?? documents ?? []}
          applicationId={applicationId}
          isOpen
          onClose={clearDeepLinkDoc}
        />
      )}
    </main>
  );
}
