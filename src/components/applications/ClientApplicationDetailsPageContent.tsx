"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { ClientApplicationDetails } from "@/components/applications/ClientApplicationDetails";
import { LayoutChips, type ApplicationLayout } from "@/components/applications/layouts/LayoutChips";
import { ClientSkillAssessmentLayout } from "@/components/applications/layouts/ClientSkillAssessmentLayout";
import { EOILayout } from "@/components/applications/layouts/EOILayout";
import { InvitationLayout } from "@/components/applications/layouts/InvitationLayout";
import { OutcomeLayout } from "@/components/applications/layouts/OutcomeLayout";
import { Company } from "@/types/documents";
import { Document } from "@/types/applications";
import { useClientApplication } from "@/hooks/useClientApplication";
import {
  useClientDocuments,
  useAllClientDocuments,
} from "@/hooks/useClientDocuments";
import { useClientChecklist } from "@/hooks/useClientChecklist";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AddCompanyDialog } from "@/components/applications/AddCompanyDialog";
import { ReuploadDocumentModal } from "@/components/applications/ReuploadDocumentModal";
import { parseCompaniesFromDocuments } from '@/utils/companyParsing';
import { useStage2Documents } from "@/hooks/useStage2Documents";

export default function ClientApplicationDetailsPageContent() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  const [selectedLayout, setSelectedLayout] = useState<ApplicationLayout>("skill-assessment");
  const [selectedCategory, setSelectedCategory] = useState<string>("submitted");
  const [documentsPage, setDocumentsPage] = useState(1);
  const documentsLimit = 10;
  const [isCategoryChanging, setIsCategoryChanging] = useState(false);

  const [companies, setCompanies] = useState<Company[]>([]);
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLayoutChange = useCallback((layout: ApplicationLayout) => {
    setSelectedLayout(layout);
  }, []);

  // Refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidate all relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["client-application"] }),
        queryClient.invalidateQueries({ queryKey: ["client-documents"] }),
        queryClient.invalidateQueries({ queryKey: ["client-documents-all"] }),
        queryClient.invalidateQueries({
          queryKey: ["client-checklist", applicationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["document-comment-counts"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["stage2-documents", applicationId],
        }),
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || user?.role !== "client")) {
      router.push("/client-login");
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

  // Fetch all documents for categories and checklist (not paginated)
  const {
    data: allDocumentsData,
    isLoading: isAllDocumentsLoading,
    error: allDocumentsError,
  } = useAllClientDocuments();

  const {
    data: checklistData,
    isLoading: isChecklistLoading,
    error: checklistError,
  } = useClientChecklist(applicationId);

  const invitationDocumentsQuery = useStage2Documents(applicationId, "invitation");
  const invitationDocuments = invitationDocumentsQuery.data?.data ?? [];
  const hasInvitationDocuments = invitationDocuments.length > 0;

  const eoiDocumentsQuery = useStage2Documents(applicationId, "eoi");
  const eoiDocuments = eoiDocumentsQuery.data?.data ?? [];
  const hasEOIDocuments = eoiDocuments.length > 0;

  const outcomeDocumentsQuery = useStage2Documents(applicationId, "outcome");
  const outcomeDocuments = outcomeDocumentsQuery.data?.data ?? [];
  const hasOutcomeDocuments = outcomeDocuments.length > 0;

  const availableLayouts = useMemo(() => {
    const layouts: ApplicationLayout[] = ["skill-assessment"];

    if (hasOutcomeDocuments) {
      layouts.push("outcome");
    }

    if (hasEOIDocuments) {
      layouts.push("eoi");
    }

    if (hasInvitationDocuments) {
      layouts.push("invitation");
    }

    return layouts;
  }, [hasEOIDocuments, hasInvitationDocuments, hasOutcomeDocuments]);

  useEffect(() => {
    if (!availableLayouts.includes(selectedLayout)) {
      setSelectedLayout(availableLayouts[0] ?? "skill-assessment");
    }
  }, [availableLayouts, selectedLayout]);

  const checklistRequested = applicationData?.data?.Checklist_Requested === true;
  const checklistRequestedAt = applicationData?.data?.Checklist_Requested_At;
  const leadId = applicationData?.data?.leadId || applicationData?.data?.id;

  // Prioritize API data (allDocumentsData) over locally generated data
  useEffect(() => {
    if (
      allDocumentsData?.data?.documents &&
      allDocumentsData.data.documents.length > 0
    ) {
      const parsedCompanies = parseCompaniesFromDocuments(allDocumentsData.data.documents);
      
      // Update companies state with parsed data
      if (parsedCompanies.length > 0) {
        setCompanies(parsedCompanies);
      }
    }
  }, [allDocumentsData?.data?.documents]);

  // Extract companies from documents API response, but prioritize actual company data
  const extractedCompanies = useMemo(() => {
    const companyCategories = new Set<string>();
    if (
      allDocumentsData?.data?.documents &&
      allDocumentsData.data.documents.length > 0
    ) {
      allDocumentsData.data.documents.forEach(
        (doc: { document_category?: string }) => {
          if (
            doc.document_category &&
            doc.document_category.includes("Company Documents")
          ) {
            companyCategories.add(doc.document_category);
          }
        }
      );
    }

    // Always include companies from the companies state (which have correct dates and descriptions)
    const existingCompanies = companies || [];

    // If we have companies from state, use them (regardless of whether they have documents)
    if (existingCompanies.length > 0) {
      return existingCompanies;
    }

    if (companyCategories.size > 0) {
      return parseCompaniesFromDocuments(allDocumentsData?.data?.documents || []);
    }

    return [];
  }, [allDocumentsData?.data?.documents, companies]);

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

      await new Promise((resolve) => setTimeout(resolve, 300));
    } finally {
      setIsCategoryChanging(false);
    }
  };

  const handleDeleteSuccess = () => {
    // Just invalidate queries to refresh the data without page reload
    queryClient.invalidateQueries({ queryKey: ["client-documents"] });
    queryClient.invalidateQueries({ queryKey: ["client-checklist"] });
  };

  // Company management functions
  const handleAddCompany = (company: Company) => {
    // Don't override the category - it's already set correctly in AddCompanyDialog
    setCompanies((prev) => [...prev, company]);
    setIsAddCompanyDialogOpen(false);
  };

  const handleRemoveCompany = (companyName: string) => {
    setCompanies((prev) =>
      prev.filter(
        (company) => company.name.toLowerCase() !== companyName.toLowerCase()
      )
    );
  };

  const handleReuploadDocument = (
    documentId: string,
    documentType: string,
    category: string
  ) => {
    // Find the document to reupload
    const documentToReupload = documentsData?.data?.documents?.find(
      (doc) => doc._id === documentId
    );
    if (!documentToReupload) {
      console.error("Document not found for reupload:", documentId);
      return;
    }

    setSelectedReuploadDocument(documentToReupload as unknown as Document);
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

  // Handle document upload success to refresh data
  const handleUploadSuccess = () => {
    // Invalidate all relevant queries to ensure UI updates
    queryClient.invalidateQueries({ queryKey: ["client-documents"] });
    queryClient.invalidateQueries({ queryKey: ["client-documents-all"] });
    queryClient.invalidateQueries({
      queryKey: ["client-checklist", applicationId],
    });
  };

  if (
    (applicationError && !applicationData) ||
    (allDocumentsError && !allDocumentsData)
  ) {
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
          <div>
            <h1 className="text-xl sm:text-2xl font-lexend font-bold">
              My Application
            </h1>
            <div className="text-muted-foreground ">
              {isApplicationLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : applicationData?.data ? (
                `Application ID: ${applicationData.data.id}`
              ) : (
                "Loading..."
              )}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>
      {/* Loading State */}
      {isAuthLoading ||
        isApplicationLoading ||
        isDocumentsLoading ||
        isAllDocumentsLoading ||
        isChecklistLoading ? (
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
      ) : !isAuthLoading && isAuthenticated && user?.role === "client" ? (
        <div className="space-y-6">
          {/* Application Details */}
          <ClientApplicationDetails
            data={applicationData}
            documents={allDocumentsData?.data?.documents}
            isDocumentsLoading={isAllDocumentsLoading}
            documentsError={allDocumentsError}
            isLoading={isApplicationLoading}
            error={applicationError}
          />
          <LayoutChips
            selectedLayout={selectedLayout}
            onLayoutChange={handleLayoutChange}
            availableLayouts={availableLayouts}
          />

          {selectedLayout === "skill-assessment" ? (
            <ClientSkillAssessmentLayout
              applicationId={applicationId}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              documentsPage={documentsPage}
              documentsLimit={documentsLimit}
              onDocumentsPageChange={handleDocumentsPageChange}
              isCategoryChanging={isCategoryChanging}
              maxCompanies={10}
              companies={finalCompanies}
              onAddCompany={() => setIsAddCompanyDialogOpen(true)}
              onRemoveCompany={handleRemoveCompany}
              documentsResponse={documentsData}
              isDocumentsLoading={isDocumentsLoading}
              documentsError={documentsError}
              allDocumentsResponse={allDocumentsData}
              isAllDocumentsLoading={isAllDocumentsLoading}
              allDocumentsError={allDocumentsError}
              checklistData={checklistData}
              isChecklistLoading={isChecklistLoading}
              checklistError={checklistError}
              onClientDeleteSuccess={handleDeleteSuccess}
              onReuploadDocument={handleReuploadDocument}
              onUploadSuccess={handleUploadSuccess}
              checklistRequested={checklistRequested}
              checklistRequestedAt={checklistRequestedAt}
              leadId={leadId}
              onChecklistRefresh={handleRefresh}
              onChecklistRequestSuccess={handleRefresh}
            />
          ) : selectedLayout === "outcome" ? (
            hasOutcomeDocuments ? (
              <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
                <OutcomeLayout applicationId={applicationId} isClientView />
              </Suspense>
            ) : null
          ) : selectedLayout === "eoi" ? (
            hasEOIDocuments ? (
              <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
                <EOILayout applicationId={applicationId} isClientView />
              </Suspense>
            ) : null
          ) : selectedLayout === "invitation" ? (
            hasInvitationDocuments ? (
              <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
                <InvitationLayout applicationId={applicationId} isClientView />
              </Suspense>
            ) : null
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

      {/* Add Company Dialog */}
      <AddCompanyDialog
        isOpen={isAddCompanyDialogOpen}
        onClose={() => setIsAddCompanyDialogOpen(false)}
        onAddCompany={handleAddCompany}
        existingCompanies={finalCompanies}
        maxCompanies={10}
      />

      {/* Reupload Document Modal */}
      <ReuploadDocumentModal
        isOpen={isReuploadModalOpen}
        onClose={handleReuploadModalClose}
        applicationId={applicationId}
        document={selectedReuploadDocument}
        documentType={selectedReuploadDocumentType}
        category={selectedReuploadDocumentCategory}
        isClientView={true}
      />
    </div>
  );
}

