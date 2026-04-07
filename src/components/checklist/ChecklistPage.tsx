"use client";

import React, { useMemo } from "react";
import { useApplicationDetails } from "@/hooks/useApplicationDetails";
import { useAllApplicationDocuments } from "@/hooks/useApplicationDocuments";
import { parseCompaniesFromDocuments } from "@/utils/companyParsing";
import { useChecklistPage } from "./useChecklistPage";
import { ChecklistLayout } from "./ChecklistLayout";
import { ChecklistEditor } from "./ChecklistEditor";
import { ChecklistPageSkeleton } from "./ChecklistPageSkeleton";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/utils/routes";

interface ChecklistPageProps {
  applicationId: string;
  isSpouseApplication: boolean;
}

export function ChecklistPage({
  applicationId,
  isSpouseApplication,
}: ChecklistPageProps) {
  const { data: applicationData } = useApplicationDetails(applicationId);
  const { data: documentsData, error: docsError } =
    useAllApplicationDocuments(applicationId);

  const documents = documentsData?.data;
  const companies = useMemo(
    () => parseCompaniesFromDocuments(documents ?? []),
    [documents],
  );
  const recordType =
    (applicationData as { data?: { Record_Type?: string } })?.data
      ?.Record_Type ?? "default_record_type";

  const visaServiceType =
    (applicationData as { data?: { Service_Finalized?: string } })?.data
      ?.Service_Finalized ?? "";

  const applicationLabel =
    (applicationData as { data?: { Name?: string } })?.data?.Name ??
    "Application";
  const applicationsListHref = isSpouseApplication
    ? "/v2/spouse-skill-assessment-applications"
    : ROUTES.ADMIN_HOME;
  const applicationDetailsHref = isSpouseApplication
    ? ROUTES.SPOUSE_SKILL_ASSESSMENT_APPLICATION_DETAILS(applicationId)
    : ROUTES.APPLICATION_DETAILS(applicationId);

  const page = useChecklistPage({
    applicationId,
    documents,
    companies,
    recordType,
    visaServiceType,
  });

  if (page.isChecklistLoading) {
    return <ChecklistPageSkeleton />;
  }

  if (docsError) {
    return (
      <Card className="p-6 border-none">
        <p className="text-destructive">Failed to load documents.</p>
        <p className="text-sm text-muted-foreground mt-1">
          {String(docsError)}
        </p>
      </Card>
    );
  }

  return (
    <ChecklistLayout
      applicationsListHref={applicationsListHref}
      applicationDetailsHref={applicationDetailsHref}
      applicationLabel={applicationLabel}
      mode={page.mode}
      isSaving={page.isSaving}
      hasChanges={page.hasChanges}
      onSave={page.handleSave}
    >
      <ChecklistEditor
        mode={page.mode}
        activeTab={page.activeTab}
        categories={page.categories}
        selectedCategory={page.selectedCategory}
        searchQuery={page.searchQuery}
        filteredItems={page.filteredItems}
        categoryFilteredItems={page.categoryFilteredItems}
        onCategoryChange={page.handleCategoryChange}
        onTabChange={page.handleTabChange}
        onSearchChange={page.setSearchQuery}
        onUpdateRequirement={page.updateDocumentRequirement}
        applicationId={applicationId}
      />
    </ChecklistLayout>
  );
}
