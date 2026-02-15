"use client";

import { ActivateAccountSheet } from "@/components/applications/ActivateAccountSheet";
import { AddCompanyDialog } from "@/components/applications/AddCompanyDialog";
import { ApplicantDetails } from "@/components/applications/ApplicantDetails";
import { ApplicationDetailsHeader } from "@/components/applications/ApplicationDetailsHeader";
import { DownloadAllDocumentsModal } from "@/components/applications/DownloadAllDocumentsModal";
import { QualityCheckModal } from "@/components/applications/QualityCheckModal";
import { ReuploadDocumentModal } from "@/components/applications/ReuploadDocumentModal";
import { ResetPasswordModal } from "@/components/applications/ResetPasswordModal";
import { LayoutChips } from "@/components/applications/layouts/LayoutChips";
import { SkillAssessmentLayout } from "@/components/applications/layouts/SkillAssessmentLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { ApplicationDetailsResponse, Document } from "@/types/applications";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useCallback,
  lazy,
  Suspense,
  useState,
} from "react";
import { useApplicationDetails } from "@/hooks/useApplicationDetails";
import { TooltipProvider } from "../ui/tooltip";
import type { DocumentCategory } from "@/types/documents";
import {
  areAllMandatoryDocumentsReviewed,
  getMandatoryDocumentValidationDetails,
  type MandatoryDocumentValidationDetail,
} from "@/utils/checklistValidation";
import { useDeleteDocument } from "@/hooks/useMutationsDocuments";
import {
  getCompanyDocuments,
  filterDocumentsWithValidIds,
} from "@/utils/companyDocuments";
import { RemoveCompanyDialog } from "@/components/applications/RemoveCompanyDialog";
import { toast } from "sonner";
import type { Company } from "@/types/documents";

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
  const queryClient = useQueryClient();

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSampleDocuments, setShowSampleDocuments] = useState(false);
  const maxCompanies = 10;

  // State for remove company dialog with document check
  const [removeCompanyDialog, setRemoveCompanyDialog] = useState<{
    isOpen: boolean;
    company: Company | null;
    hasDocuments: boolean;
    documentCount: number;
  }>({
    isOpen: false,
    company: null,
    hasDocuments: false,
    documentCount: 0,
  });
  const [isDeletingDocuments, setIsDeletingDocuments] = useState(false);
  const deleteDocumentMutation = useDeleteDocument();

  useEffect(() => {
    setDocumentsPage(1);
  }, [appState.selectedCategory]);

  useEffect(() => {
    if (
      !isAuthLoading &&
      (!isAuthenticated ||
        (user?.role !== "admin" &&
          user?.role !== "team_leader" &&
          user?.role !== "master_admin" &&
          user?.role !== "supervisor"))
    ) {
      router.push("/admin-login");
    }
  }, [isAuthenticated, isAuthLoading, user?.role, router]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
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
        queryClient.invalidateQueries({ queryKey: ["application"] }),
      ];

      if (isSpouseApplication) {
        queries.push(
          queryClient.invalidateQueries({
            queryKey: ["spouse-application-details", applicationId],
          }),
        );
      } else {
        queries.push(
          queryClient.invalidateQueries({
            queryKey: ["application-details", applicationId],
          }),
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
      console.error("Missing user or application data, or spouse application");
      return;
    }
    modals.openQualityCheckModal();
  }, [isSpouseApplication, user?.username, application?.id, modals]);

  const handleReuploadDocument = useCallback(
    (documentId: string, documentType: string, category: string) => {
      const documentToReupload = documents?.find(
        (doc) => doc._id === documentId,
      );
      if (!documentToReupload) {
        console.error("Document not found for reupload:", documentId);
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

  // Handler to check for documents and open remove company dialog
  const handleRemoveCompanyWithDocuments = useCallback(
    (companyName: string, companyCategory: string) => {
      // Find the company object
      const company = appState.companies.find(
        (c) => c.name.toLowerCase() === companyName.toLowerCase(),
      );

      if (!company) {
        console.error("[RemoveCompany] Company not found:", companyName);
        toast.error("Company not found");
        return;
      }

      // Check if company has documents
      const companyDocuments = getCompanyDocuments(
        companyCategory,
        allDocuments || [],
      );
      const hasDocuments = companyDocuments.length > 0;
      const documentCount = companyDocuments.length;

      // Open dialog with company info
      setRemoveCompanyDialog({
        isOpen: true,
        company,
        hasDocuments,
        documentCount,
      });
    },
    [appState.companies, allDocuments],
  );

  // Handler to delete all documents and then remove company
  const handleRemoveDocumentsAndCompany = useCallback(async () => {
    const { company, hasDocuments, documentCount } = removeCompanyDialog;

    if (!company) {
      console.error("[RemoveCompany] No company selected");
      return;
    }

    if (!hasDocuments || documentCount === 0) {
      // No documents, just remove company
      console.log("[RemoveCompany] No documents, removing company directly");
      appState.handleRemoveCompany(company.name);
      setRemoveCompanyDialog({
        isOpen: false,
        company: null,
        hasDocuments: false,
        documentCount: 0,
      });
      toast.success("Company removed successfully");
      return;
    }

    // Find company category
    const companyCategory =
      company.category || `${company.name} Company Documents`;
    const companyDocuments = getCompanyDocuments(
      companyCategory,
      allDocuments || [],
    );

    if (companyDocuments.length === 0) {
      appState.handleRemoveCompany(company.name);
      setRemoveCompanyDialog({
        isOpen: false,
        company: null,
        hasDocuments: false,
        documentCount: 0,
      });
      toast.success("Company removed successfully");
      return;
    }

    // Filter out documents without valid IDs
    const validDocuments = filterDocumentsWithValidIds(companyDocuments);
    const invalidDocumentCount =
      companyDocuments.length - validDocuments.length;

    if (invalidDocumentCount > 0) {
      console.warn(
        `[RemoveCompany] Skipping ${invalidDocumentCount} document(s) with invalid or missing IDs`,
      );
    }

    if (validDocuments.length === 0) {
      appState.handleRemoveCompany(company.name);
      setRemoveCompanyDialog({
        isOpen: false,
        company: null,
        hasDocuments: false,
        documentCount: 0,
      });
      toast.success("Company removed successfully");
      return;
    }

    // Set deleting state
    setIsDeletingDocuments(true);

    try {
      // Process each document individually, tracking results
      const deletionResults: Array<{
        success: boolean;
        documentId: string;
        fileName?: string;
        error?: string;
      }> = [];

      for (const doc of validDocuments) {
        // Additional inline validation right before mutation call
        if (!doc._id || typeof doc._id !== "string" || doc._id.trim() === "") {
          deletionResults.push({
            success: false,
            documentId: doc._id || "unknown",
            fileName: doc.file_name,
            error: "Invalid document ID",
          });
          continue;
        }

        try {
          await deleteDocumentMutation.mutateAsync(doc._id);
          deletionResults.push({
            success: true,
            documentId: doc._id,
            fileName: doc.file_name,
          });
        } catch (error) {
          // Log but continue with other documents
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          deletionResults.push({
            success: false,
            documentId: doc._id,
            fileName: doc.file_name,
            error: errorMessage,
          });
        }
      }
      const successCount = deletionResults.filter((r) => r.success).length;
      const failureCount = deletionResults.filter((r) => !r.success).length;

      if (successCount === 0 && validDocuments.length > 0) {
        setIsDeletingDocuments(false);
        toast.error(
          "Failed to delete all documents. Company was not removed. Please try again.",
        );
        return;
      }

      if (failureCount > 0) {
        toast.warning(
          `Company removed. ${successCount} document${successCount !== 1 ? "s" : ""} deleted successfully, but ${failureCount} document${failureCount !== 1 ? "s" : ""} could not be deleted.`,
        );
      } else {
        toast.success(
          `Company and ${successCount} document${successCount !== 1 ? "s" : ""} removed successfully`,
        );
      }

      appState.handleRemoveCompany(company.name);

      setRemoveCompanyDialog({
        isOpen: false,
        company: null,
        hasDocuments: false,
        documentCount: 0,
      });
      setIsDeletingDocuments(false);
    } catch (error) {
      setIsDeletingDocuments(false);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        "[RemoveCompany] Unexpected error during document deletion:",
        errorMessage,
      );

      toast.error(
        "An unexpected error occurred. Company was not removed. Please try again.",
      );
    }
  }, [removeCompanyDialog, allDocuments, appState, deleteDocumentMutation]);

  const handleCloseRemoveCompanyDialog = useCallback(() => {
    if (isDeletingDocuments) {
      return;
    }
    setRemoveCompanyDialog({
      isOpen: false,
      company: null,
      hasDocuments: false,
      documentCount: 0,
    });
  }, [isDeletingDocuments]);

  const handleRemoveCompanyDirect = useCallback(() => {
    const { company } = removeCompanyDialog;
    if (!company) return;

    appState.handleRemoveCompany(company.name);
    setRemoveCompanyDialog({
      isOpen: false,
      company: null,
      hasDocuments: false,
      documentCount: 0,
    });
    toast.success("Company removed successfully");
  }, [removeCompanyDialog, appState]);

  const backPath = useMemo(
    () =>
      isSpouseApplication
        ? "/admin/spouse-skill-assessment-applications"
        : "/admin/applications",
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
                  <Badge
                    variant="default"
                    className="bg-linear-to-r from-blue-500/10 to-blue-500/20 text-white border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200 md:mb-0 mb-2 md:h-8 flex items-center gap-2 px-3 py-1 rounded-full font-medium"
                  >
                    <BadgeCheck size={16} className="text-white" />
                    {application?.Package_Finalize || "Not provided"}
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
            validationDetails={mandatoryDocValidationDetails}
            onPushForQualityCheck={handlePushForQualityCheck}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            onDownloadAll={modals.openDownloadAllModal}
            onResetPassword={modals.openResetPasswordModal}
            onActivateAccount={modals.openActivateAccountSheet}
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

      {!isSpouseApplication && (
        <QualityCheckModal
          applicationId={applicationId}
          leadId={application?.id || ""}
          isOpen={modals.isQualityCheckModalOpen}
          onOpenChange={modals.setQualityCheckModalOpen}
          disabled={!areAllDocumentsApproved}
          recordType={application?.Record_Type}
        />
      )}

      {user?.role !== "client" && (
        <>
          <ResetPasswordModal
            isOpen={modals.isResetPasswordModalOpen}
            onOpenChange={modals.setResetPasswordModalOpen}
            leadId={application?.id || ""}
            onSuccess={() => console.log("Password reset successfully")}
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
    </div>
  );
}
