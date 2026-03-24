"use client";

import { memo } from "react";
import { useApplications } from "@/hooks/useApplications";
import { useSearchApplications } from "@/hooks/useSearchApplications";
import { ApplicationsListPage } from "@/components/applications/ApplicationsListPage";

interface ApplicationsClientProps {
  initialRecentActivity?: boolean;
}

export const ApplicationsClient = memo(function ApplicationsClient({
  initialRecentActivity = false,
}: ApplicationsClientProps) {
  return (
    <ApplicationsListPage
      useApplicationsHook={useApplications}
      useSearchHook={useSearchApplications}
      type="visa"
      getTitle={(country) => `${country} visa applications`}
      enabledFilters={{
        handledBy: true,
        applicationStage: true,
        applicationState: true,
      }}
      initialRecentActivity={initialRecentActivity}
    />
  );
});
