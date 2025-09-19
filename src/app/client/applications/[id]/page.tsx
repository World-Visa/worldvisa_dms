"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ClientApplicationDetails } from "@/components/applications/ClientApplicationDetails";
import { DocumentsTable } from "@/components/applications/DocumentsTable";
import { DocumentChecklistTable } from "@/components/applications/DocumentChecklistTable";
import { DocumentCategoryFilter } from "@/components/applications/DocumentCategoryFilter";
import { RequestChecklistCard } from "@/components/applications/RequestChecklistCard";
import { ChecklistRequestSuccessCard } from "@/components/applications/ChecklistRequestSuccessCard";
import { DocumentCategory, Company } from "@/types/documents";
import { ClientDocument } from "@/types/client";
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
import { generateChecklistCategories } from "@/lib/checklist/categoryUtils";

export default function ClientApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

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

  // Prioritize API data (allDocumentsData) over locally generated data
  useEffect(() => {
    if (
      allDocumentsData?.data?.documents &&
      allDocumentsData.data.documents.length > 0
    ) {
      const companyMap = new Map<string, Company>();

      allDocumentsData.data.documents.forEach((doc: ClientDocument) => {
        if (
          doc.document_category &&
          doc.document_category.includes("Company Documents")
        ) {
          // Extract company name from category (e.g., "Microsoft Company Documents" -> "Microsoft")
          const companyName = doc.document_category
            .replace(" Company Documents", "")
            .toLowerCase();

          // Always prioritize API data if description is available
          if (doc.description) {
            // Try to extract dates from description (e.g., "Worked at worldvisa from Aug 06, 2024 to Jul 24, 2025 (11 months)")
            const dateMatch = doc.description.match(
              /from\s+(\w+\s+\d{2},\s+\d{4})\s+to\s+(\w+\s+\d{2},\s+\d{4})/i
            );
            if (dateMatch) {
              const fromDateStr = dateMatch[1]; // "Aug 06, 2024"
              const toDateStr = dateMatch[2]; // "Jul 24, 2025"

              try {
                // Convert to YYYY-MM-DD format without timezone issues
                const fromDateObj = new Date(fromDateStr);
                const toDateObj = new Date(toDateStr);

                // Format as YYYY-MM-DD without timezone conversion
                const fromDate = `${fromDateObj.getFullYear()}-${String(
                  fromDateObj.getMonth() + 1
                ).padStart(2, "0")}-${String(fromDateObj.getDate()).padStart(
                  2,
                  "0"
                )}`;
                const toDate = `${toDateObj.getFullYear()}-${String(
                  toDateObj.getMonth() + 1
                ).padStart(2, "0")}-${String(toDateObj.getDate()).padStart(
                  2,
                  "0"
                )}`;

                companyMap.set(companyName, {
                  name: companyName,
                  category: doc.document_category,
                  fromDate: fromDate,
                  toDate: toDate,
                  description: doc.description,
                });
              } catch (error) {
                console.error(
                  "Error parsing dates from API description:",
                  error
                );
                companyMap.set(companyName, {
                  name: companyName,
                  category: doc.document_category,
                  fromDate: "2024-01-01",
                  toDate: "2025-12-31",
                  description: doc.description || "",
                });
              }
            } else {
              // If no date match found, still save the company with default dates
              companyMap.set(companyName, {
                name: companyName,
                category: doc.document_category,
                fromDate: "2024-01-01",
                toDate: "2025-12-31",
                description: doc.description || "",
              });
            }
          } else {
            // If API has a company document but no description, still save the company so the chip persists
            companyMap.set(companyName, {
              name: companyName,
              category: doc.document_category,
              fromDate: "2024-01-01",
              toDate: "2025-12-31",
              description: doc.description || "",
            });
          }
        }
      });

      // Update companies state with API data if available
      if (companyMap.size > 0) {
        setCompanies(Array.from(companyMap.values()));
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
      return Array.from(companyCategories).map((category) => {
        // Extract company name from category (e.g., "worldvisa Company Documents" -> "worldvisa")
        const companyName = category.split(" ")[0].toLowerCase();

        // Try to find a document with description for this company to extract dates
        let description = "";
        let fromDate = "2024-01-01"; // Default fallback dates
        let toDate = "2025-12-31";

        if (
          allDocumentsData?.data?.documents &&
          allDocumentsData.data.documents.length > 0
        ) {
          const companyDoc = allDocumentsData.data.documents.find(
            (doc: ClientDocument) =>
              doc.document_category === category && doc.description
          );

          if (companyDoc && companyDoc.description) {
            description = companyDoc.description;

            // Try to extract dates from description
            const dateMatch = companyDoc.description.match(
              /from\s+(\w+\s+\d{2},\s+\d{4})\s+to\s+(\w+\s+\d{2},\s+\d{4})/i
            );
            if (dateMatch) {
              const fromDateStr = dateMatch[1];
              const toDateStr = dateMatch[2];

              try {
                const fromDateObj = new Date(fromDateStr);
                const toDateObj = new Date(toDateStr);

                fromDate = `${fromDateObj.getFullYear()}-${String(
                  fromDateObj.getMonth() + 1
                ).padStart(2, "0")}-${String(fromDateObj.getDate()).padStart(
                  2,
                  "0"
                )}`;
                toDate = `${toDateObj.getFullYear()}-${String(
                  toDateObj.getMonth() + 1
                ).padStart(2, "0")}-${String(toDateObj.getDate()).padStart(
                  2,
                  "0"
                )}`;
              } catch {
                // Failed to parse dates, using defaults
              }
            }
          }
        }

        return {
          name: companyName,
          category: category,
          fromDate: fromDate,
          toDate: toDate,
          description: description,
        };
      });
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

  // Check if checklist has company documents
  const hasCompanyDocuments =
    checklistData?.data?.some((item) => item.document_category === "Company") ||
    false;

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
              submittedDocumentsCount={
                allDocumentsData?.data?.documents?.length || 0
              }
              checklistCategories={generateChecklistCategories(
                checklistData,
                allDocumentsData,
                finalCompanies
              )}
              hasCompanyDocuments={hasCompanyDocuments}
              // Loading state
              isCategoryChanging={isCategoryChanging}
            />

            {/* Conditional Rendering */}
            {(() => {
              const hasChecklist =
                checklistData?.data &&
                Array.isArray(checklistData.data) &&
                checklistData.data.length > 0;
              const hasSubmittedDocuments =
                (allDocumentsData?.data?.documents?.length || 0) > 0;

              // Check if checklist has been requested
              const checklistRequested = applicationData?.data?.Checklist_Requested === true;
              const leadId = applicationData?.data?.leadId || applicationData?.data?.id;

              // If checklist has been requested, show success card
              if (checklistRequested && !hasChecklist) {
                return (
                  <ChecklistRequestSuccessCard
                    onRefresh={() => {
                      window.location.reload();
                    }}
                    requestedAt={applicationData?.data?.Checklist_Requested_At}
                  />
                );
              }

              // If no checklist and no submitted documents, show the request card
              if (!hasChecklist && !hasSubmittedDocuments && !checklistRequested && leadId) {
                return (
                  <RequestChecklistCard
                    leadId={leadId}
                    onRequestSuccess={() => {
                      // Refresh the page to show success state
                      window.location.reload();
                    }}
                  />
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
                    onClientDeleteSuccess={handleDeleteSuccess}
                    onReuploadDocument={handleReuploadDocument}
                    onUploadSuccess={handleUploadSuccess}
                  />
                );
              }

              // Normal rendering based on selected category
              if (selectedCategory === "submitted") {
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
                    onClientDeleteSuccess={handleDeleteSuccess}
                    onReuploadDocument={handleReuploadDocument}
                    onUploadSuccess={handleUploadSuccess}
                  />
                );
              } else {
                return (
                  <DocumentChecklistTable
                    documents={
                      allDocumentsData?.data?.documents as unknown as Document[]
                    }
                    isLoading={isChecklistLoading}
                    error={checklistError}
                    applicationId={applicationId}
                    selectedCategory={selectedCategory as DocumentCategory}
                    companies={finalCompanies}
                    isClientView={true}
                    checklistData={checklistData}
                    checklistState={
                      checklistData?.data && checklistData.data.length > 0
                        ? "saved"
                        : "none"
                    }
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
        maxCompanies={5}
      />

      {/* Reupload Document Modal */}
      <ReuploadDocumentModal
        isOpen={isReuploadModalOpen}
        onClose={handleReuploadModalClose}
        applicationId={applicationId}
        document={selectedReuploadDocument}
        documentType={selectedReuploadDocumentType}
        category={selectedReuploadDocumentCategory}
      />
    </div>
  );
}
