"use client";

import ViewDocumentSheet from "@/components/applications/ViewDocumentSheet";
import { AddNoteModal } from "@/components/applications/AddNoteModal";
import { NotesBanner } from "@/components/applications/NotesBanner";
import { AddCompanyDialog } from "@/components/applications/AddCompanyDialog";
import { ApplicantDetails } from "@/components/applications/ApplicantDetails";
import { ApplicationDetailsHeader } from "@/components/applications/ApplicationDetailsHeader";
import { EditProfileDetailsSheet } from "@/components/applications/EditProfileDetailsSheet";
import { DownloadAllDocumentsModal } from "@/components/applications/DownloadAllDocumentsModal";
import { EmailHistoryModal } from "@/components/applications/EmailHistoryModal";
import { CallLogsModal } from "@/components/applications/CallLogsModal";
import {
  buildPendingDocumentsReminderHtml,
  PENDING_DOCS_SUBJECT,
} from "@/lib/emailTemplates/pendingDocumentsReminder";
import { QualityCheckModal } from "@/components/applications/QualityCheckModal";
import { ReuploadDocumentModal } from "@/components/applications/ReuploadDocumentModal";
import { LayoutChips } from "@/components/applications/layouts/LayoutChips";
import { SkillAssessmentLayout } from "@/components/applications/layouts/SkillAssessmentLayout";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/primitives/breadcrumb";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
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
import { checklistUrlParsers } from "@/lib/urlState";
import {
  ApplicationDetailsResponse,
  type ApplicationOnboarding,
} from "@/types/applications";
import { useRouter } from "next/navigation";
import { useLayoutStore } from "@/store/layoutStore";
import { useLeadUnreadCount } from "@/hooks/useChat";
import { useDeepLinkDocument } from "@/hooks/useDeepLinkDocument";
import {
  useEffect,
  useMemo,
  useCallback,
  useRef,
  lazy,
  Suspense,
  useState,
} from "react";
import { motion } from "motion/react";
import { useApplicationDetails } from "@/hooks/useApplicationDetails";
import { useOnboardingSteps } from "@/hooks/use-onboarding-steps";
import type { DocumentCategory } from "@/types/documents";
import {
  areAllMandatoryDocumentsReviewed,
  getMandatoryDocumentValidationDetails,
} from "@/utils/checklistValidation";
import { useApplicationNotes, useDeleteNote } from "@/hooks/useApplicationNotes";
import { useRemoveCompany } from "@/hooks/useRemoveCompany";
import type { ApplicationNote } from "@/lib/api/applicationNotes";
import { RemoveCompanyDialog } from "@/components/applications/RemoveCompanyDialog";
import { ClientOnboardingModal } from "@/components/applications/onboarding/ClientOnboardingModal";
import { DeadlineBlockerModal } from "@/components/applications/deadline/DeadlineBlockerModal";
import { computeDaysLeft } from "@/components/applications/deadline/deadline-date-utils";
import { useApprovalRequestsByLead } from "@/hooks/useAdminApprovalRequests";
import { useLazyDocumentLoad } from "@/hooks/useLazyDocumentLoad";
import type { ApplicationLayout } from "@/components/applications/layouts/LayoutChips";
import { useQueryStates } from "nuqs";

const FADE_ANIMATION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.15 },
} as const;

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

const DEFAULT_APPLICATION_ONBOARDING: ApplicationOnboarding = {
  client_record_exists: false,
  clerk_id: null,
  clerk_invitation_id: null,
  account_status: null,
  email_verified: false,
};

interface UnifiedApplicationDetailsPageProps {
  applicationId: string;
  isSpouseApplication?: boolean;
}

export default function UnifiedApplicationDetailsPage({
  applicationId,
  isSpouseApplication = false,
}: UnifiedApplicationDetailsPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [{ category: urlCategoryParam, sample: isSampleQuery }, setChecklistUrlState] =
    useQueryStates(
      {
        category: checklistUrlParsers.category,
        sample: checklistUrlParsers.sample,
      },
      { history: "replace" },
    );
  const urlCategory = isSampleQuery
    ? undefined
    : ((urlCategoryParam as DocumentCategory | null) ?? undefined);

  const layoutState = useLayoutState();
  const modals = useApplicationModals();

  const spouseApplicationQuery = useSpouseApplicationDetails(
    applicationId,
    undefined,
    { enabled: isSpouseApplication },
  );
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
  const shouldLoadAllDocuments = useLazyDocumentLoad(
    Boolean(shouldEagerLoadAllDocuments),
  );

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

  const onboardingData =
    application?.application_onboarding ?? DEFAULT_APPLICATION_ONBOARDING;
  const { isFullyOnboarded } = useOnboardingSteps(onboardingData);
  const [isClientOnboardingOpen, setIsClientOnboardingOpen] = useState(false);
  const dismissedOnboardingIds = useRef(new Set<string>());
  const hasLoadedApplicationData = !isApplicationLoading && Boolean(application);

  const leadId = application?.id ?? "";

  const {
    data: leadRequestsForBlocker,
    isLoading: isLeadRequestsLoading,
  } = useApprovalRequestsByLead(leadId, {});

  const isDeadlineBlocking = useMemo(() => {
    if (!hasLoadedApplicationData || isLeadRequestsLoading) return false;
    const daysLeft = computeDaysLeft(application?.Deadline_For_Lodgment);
    if (daysLeft === null || daysLeft >= 0) return false;
    const requests = leadRequestsForBlocker?.data ?? [];
    const latest = [...requests]
      .filter(
        (r) =>
          r.fieldName === "Deadline_For_Lodgment" &&
          r.recordType === "visa_application",
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime(),
      )[0];
    return latest?.status !== "pending";
  }, [
    hasLoadedApplicationData,
    isLeadRequestsLoading,
    application?.Deadline_For_Lodgment,
    leadRequestsForBlocker,
  ]);

  useEffect(() => {
    if (!hasLoadedApplicationData || isLeadRequestsLoading) return;
    if (isDeadlineBlocking) { setIsClientOnboardingOpen(false); return; }
    if (isFullyOnboarded)   { setIsClientOnboardingOpen(false); return; }
    if (dismissedOnboardingIds.current.has(applicationId)) return;
    setIsClientOnboardingOpen(true);
  }, [
    applicationId,
    hasLoadedApplicationData,
    isLeadRequestsLoading,
    isDeadlineBlocking,
    isFullyOnboarded,
  ]);

  const handleOnboardingModalOpenChange = useCallback((open: boolean) => {
    setIsClientOnboardingOpen(open);
    if (!open) dismissedOnboardingIds.current.add(applicationId);
  }, [applicationId]);

  const handleActivateAccount = useCallback(() => {
    dismissedOnboardingIds.current.delete(applicationId);
    setIsClientOnboardingOpen(true);
  }, [applicationId]);

  const [isEditProfileSheetOpen, setIsEditProfileSheetOpen] = useState(false);

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

  const [reminderEmailData, setReminderEmailData] = useState<
    { subject: string; html: string } | undefined
  >();

  const [isCallLogsModalOpen, setIsCallLogsModalOpen] = useState(false);
  const [emailAutoSelectLatest, setEmailAutoSelectLatest] = useState(false);

  const handleSendReminderEmail = useCallback(() => {
    const docs = mandatoryDocValidationDetails.map((d) => ({
      label: d.companyName ? `${d.documentType} (${d.companyName})` : d.documentType,
      status: d.status,
    }));
    setReminderEmailData({
      subject: PENDING_DOCS_SUBJECT,
      html: buildPendingDocumentsReminderHtml(application?.Name ?? "", docs),
    });
    modals.openEmailHistoryModal();
  }, [mandatoryDocValidationDetails, application?.Name, modals]);

  const [documentsPage, setDocumentsPage] = useState(1);
  const showSampleDocuments = isSampleQuery;
  const [previousCategoryBeforeSample, setPreviousCategoryBeforeSample] =
    useState<DocumentCategory | null>(null);
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

  useEffect(() => {
    if (isSampleQuery && urlCategoryParam) {
      void setChecklistUrlState({ category: null });
    }
  }, [isSampleQuery, setChecklistUrlState, urlCategoryParam]);

  const openChatPanel = useLayoutStore((s) => s.openChatPanel);
  const unreadChatCount = useLeadUnreadCount(
    application?.id ?? "",
    application?.Name,
    user?.role,
    user?.username,
  );

  const handleStartChat = useCallback(() => {
    if (!application) return;
    openChatPanel({
      applicationId,
      applicationHandledBy: application.Application_Handled_By,
      leadId: application.id,
      clientName: application.Name,
    });
  }, [application, applicationId, openChatPanel]);

  const handleEmailLastComm = useCallback(() => {
    setEmailAutoSelectLatest(true);
    modals.openEmailHistoryModal();
  }, [modals]);

  const handleChatLastComm = useCallback(() => {
    handleStartChat();
  }, [handleStartChat]);

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

  const handleCategoryChangeWithChecklist = useCallback(
    (category: DocumentCategory) => {
      if (showSampleDocuments) {
        void setChecklistUrlState({ sample: null });
      }
      appState.handleCategoryChange(category);
    },
    [appState, setChecklistUrlState, showSampleDocuments],
  );

  const handleShowSampleDocuments = useCallback(() => {
    setPreviousCategoryBeforeSample(appState.selectedCategory);
    void setChecklistUrlState({
      category: null,
      sample: true,
    });
  }, [appState.selectedCategory, setChecklistUrlState]);

  const handleHideSampleDocuments = useCallback(() => {
    const categoryToRestore =
      previousCategoryBeforeSample ?? appState.selectedCategory ?? "submitted";
    void setChecklistUrlState({
      sample: null,
      category: categoryToRestore,
    });
    appState.handleCategoryChange(categoryToRestore);
    setPreviousCategoryBeforeSample(null);
  }, [
    appState,
    previousCategoryBeforeSample,
    setChecklistUrlState,
  ]);

  const backPath = useMemo(
    () =>
      isSpouseApplication
        ? "/v2/spouse-skill-assessment-applications"
        : "/v2/applications",
    [isSpouseApplication],
  );

  const combinedError =
    applicationError ?? documentsError ?? allDocumentsError;

  if (combinedError) {
    const message =
      combinedError instanceof Error
        ? combinedError.message
        : String(combinedError);
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          Back
        </Button>
        <ErrorState
          title="Failed to load application details"
          message={message}
        />
      </div>
    );
  }

  return (
    <main className="w-full min-w-0">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex flex-1 min-w-0 flex-col gap-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={backPath}>Applications</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="truncate capitalize">
                  {isApplicationLoading ? "Applciation" : application?.Name ?? "Application"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <ApplicationDetailsHeader
          areAllDocumentsApproved={areAllDocumentsApproved}
          validationDetails={mandatoryDocValidationDetails}
          onPushForQualityCheck={handlePushForQualityCheck}
          onDownloadAll={modals.openDownloadAllModal}
          onActivateAccount={handleActivateAccount}
          onEditAccountDetails={() => setIsEditProfileSheetOpen(true)}
          applicationId={applicationId}
          onAddNote={() => {
            setEditingNote(null);
            setIsNoteModalOpen(true);
          }}
          onCallLogs={() => setIsCallLogsModalOpen(true)}
          onEmailHistory={modals.openEmailHistoryModal}
          onStartChat={handleStartChat}
          onSendReminderEmail={handleSendReminderEmail}
          unreadChatCount={unreadChatCount}
          userRole={user?.role}
          qcRequested={application?.qc_requested}
          isSpouseApplication={isSpouseApplication}
        />
      </div>

      {notes && notes.length > 0 ? (
        <NotesBanner
          notes={notes as ApplicationNote[]}
          isAdmin={user?.role !== "client"}
          onEdit={(note) => {
            setEditingNote(note);
            setIsNoteModalOpen(true);
          }}
          onDelete={(noteId) => deleteNoteMutation.mutate(noteId)}
        />
      ) : null}

      <div className="space-y-6 mt-6">
        <ApplicantDetails
          application={application}
          isLoading={isApplicationLoading}
          error={null}
          suppressErrorUI
          isSpouseApplication={isSpouseApplication}
          user={user}
          onEmailLastComm={handleEmailLastComm}
          onChatLastComm={handleChatLastComm}
        />

        <Tabs
          value={layoutState.selectedLayout}
          onValueChange={(value) =>
            layoutState.handleLayoutChange(value as ApplicationLayout)
          }
        >
          <LayoutChips
            selectedLayout={layoutState.selectedLayout}
          />

          <TabsContent value="skill-assessment" className="mt-4 pb-4">
            <motion.div {...FADE_ANIMATION}>
              <SkillAssessmentLayout
                allDocuments={allDocuments}
                isApplicationDocumentsLoading={isDocumentsLoading}
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
                applicationId={applicationId}
                onReuploadDocument={handleReuploadDocument}
                isSpouseApplication={isSpouseApplication}
                showSampleDocuments={showSampleDocuments}
                onShowSampleDocuments={handleShowSampleDocuments}
                onHideSampleDocuments={handleHideSampleDocuments}
                visaServiceType={application?.Service_Finalized}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="outcome" className="mt-4">
            <motion.div {...FADE_ANIMATION}>
              <Suspense
                fallback={<Skeleton className="h-96 w-full rounded-xl" />}
              >
                <OutcomeLayout applicationId={applicationId} />
              </Suspense>
            </motion.div>
          </TabsContent>

          <TabsContent value="eoi" className="mt-4">
            <motion.div {...FADE_ANIMATION}>
              <Suspense
                fallback={<Skeleton className="h-96 w-full rounded-xl" />}
              >
                <EOILayout applicationId={applicationId} />
              </Suspense>
            </motion.div>
          </TabsContent>

          <TabsContent value="invitation" className="mt-4">
            <motion.div {...FADE_ANIMATION}>
              <Suspense
                fallback={<Skeleton className="h-96 w-full rounded-xl" />}
              >
                <InvitationLayout applicationId={applicationId} />
              </Suspense>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

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
        visaServiceType={application?.Service_Finalized}
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
        <DownloadAllDocumentsModal
          isOpen={modals.isDownloadAllModalOpen}
          onOpenChange={modals.setDownloadAllModalOpen}
          leadId={application?.id || ""}
        />
      )}

      <EmailHistoryModal
        isOpen={modals.isEmailHistoryModalOpen}
        onOpenChange={(open) => {
          modals.setEmailHistoryModalOpen(open);
          if (!open) {
            setReminderEmailData(undefined);
            setEmailAutoSelectLatest(false);
          }
        }}
        clientEmail={application?.Email ?? ""}
        clientName={application?.Name ?? ""}
        initialCompose={reminderEmailData}
        autoSelectLatest={emailAutoSelectLatest}
      />

      <CallLogsModal
        isOpen={isCallLogsModalOpen}
        onOpenChange={setIsCallLogsModalOpen}
        customerPhone={application?.Phone ?? ""}
        customerName={application?.Name ?? ""}
      />

      {deepLinkDoc && (
        <ViewDocumentSheet
          document={deepLinkDoc}
          documents={allDocuments ?? documents ?? []}
          applicationId={applicationId}
          isOpen
          onClose={clearDeepLinkDoc}
        />
      )}

      <DeadlineBlockerModal
        open={isDeadlineBlocking}
        leadId={leadId}
        currentDeadline={application?.Deadline_For_Lodgment}
      />

      <ClientOnboardingModal
        applicationId={applicationId}
        application={application}
        onboarding={onboardingData}
        isSpouseApplication={isSpouseApplication}
        open={isClientOnboardingOpen}
        onOpenChange={handleOnboardingModalOpenChange}
      />

      {application && (
        <EditProfileDetailsSheet
          open={isEditProfileSheetOpen}
          onOpenChange={setIsEditProfileSheetOpen}
          application={application}
        />
      )}
    </main>
  );
}
