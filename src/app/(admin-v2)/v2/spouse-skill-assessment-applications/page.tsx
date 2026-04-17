"use client";

import { memo, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useSpouseApplications,
  useSearchSpouseApplications,
} from "@/hooks/useSpouseApplications";
import { ApplicationsListPage } from "@/components/applications/ApplicationsListPage";

const SpouseSkillAssessmentApplications = memo(
  function SpouseSkillAssessmentApplications() {
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = useCallback(async () => {
      setIsRefreshing(true);
      try {
        await queryClient.invalidateQueries({
          queryKey: ["spouse-applications"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["spouse-applications-search"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["deadline-stats"],
        });
      } catch (err) {
        console.error("Error refreshing spouse applications:", err);
      } finally {
        setIsRefreshing(false);
      }
    }, [queryClient]);

    return (
      <main>
        <ApplicationsListPage
          useApplicationsHook={useSpouseApplications}
          useSearchHook={useSearchSpouseApplications}
          type="spouse"
          getTitle={(country) =>
            `${country} spouse skill assessment applications`
          }
          enabledFilters={{
            handledBy: true,
            applicationStage: false,
            applicationState: false,
            deadline: false,
            serviceType: false,
          }}
          isSpouseApplication={true}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      </main>
    );
  },
);

export default SpouseSkillAssessmentApplications;
