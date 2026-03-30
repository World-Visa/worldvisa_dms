"use client";

import { useMemo } from "react";
import { RiLoader4Line } from "react-icons/ri";
import { Button } from "@/components/ui/primitives/button";
import { FacetedFormFilter } from "@/components/ui/faceted-filter/facated-form-filter";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAuth } from "@/hooks/useAuth";
import { ApplicationStage, ApplicationState, DeadlineCategoryEnum } from "@/lib/enums";
import { ROLES } from "@/lib/roles";
import type {
  ApplicationStateFilter,
  DeadlineCategory,
  EnabledFilters,
} from "@/types/applications";

const APPLICATION_STAGE_OPTIONS = Object.values(ApplicationStage).map((s) => ({
  label: s,
  value: s,
}));

const APPLICATION_STATE_OPTIONS = Object.values(ApplicationState).map((s) => ({
  label: s,
  value: s,
}));

const DEADLINE_OPTIONS = [
  { label: "Approaching", value: DeadlineCategoryEnum.Approaching },
  { label: "Overdue", value: DeadlineCategoryEnum.Overdue },
  { label: "Future", value: DeadlineCategoryEnum.Future },
  { label: "No Deadline", value: DeadlineCategoryEnum.NoDeadline },
];

interface ApplicationsFilterBarProps {
  search: string;
  applicationStage: string[];
  applicationState: ApplicationStateFilter | undefined;
  handledBy: string[];
  deadlineCategory: DeadlineCategory | null;
  enabledFilters: EnabledFilters;
  onSearchChange: (value: string) => void;
  onApplicationStageChange: (value: string[]) => void;
  onApplicationStateChange: (value: ApplicationStateFilter | undefined) => void;
  onHandledByChange: (value: string[]) => void;
  onDeadlineCategoryChange: (value: DeadlineCategory | null) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
}

export function ApplicationsFilterBar({
  search,
  applicationStage,
  applicationState,
  handledBy,
  deadlineCategory,
  enabledFilters,
  onSearchChange,
  onApplicationStageChange,
  onApplicationStateChange,
  onHandledByChange,
  onDeadlineCategoryChange,
  onClearFilters,
  isLoading = false,
}: ApplicationsFilterBarProps) {
  const { user } = useAuth();
  const { data: adminUsers, isLoading: isLoadingAdmins } = useAdminUsers();

  const canViewHandledByFilter = useMemo(() => {
    if (!user?.role) return false;
    return [ROLES.MASTER_ADMIN, ROLES.SUPERVISOR].includes(user.role);
  }, [user?.role]);

  const adminOptions = useMemo(() => {
    if (!adminUsers) return [];
    return adminUsers
      .filter((admin) => admin.role === ROLES.ADMIN && (admin.username ?? admin.full_name))
      .map((admin) => ({
        value: admin.username ?? admin.full_name ?? "",
        label: admin.username ?? admin.full_name ?? "",
      }));
  }, [adminUsers]);

  const hasActiveFilters =
    search.trim() !== "" ||
    applicationStage.length > 0 ||
    Boolean(applicationState) ||
    handledBy.length > 0 ||
    Boolean(deadlineCategory);

  return (
    <div className="flex flex-wrap items-center gap-2 py-2.5">
      <FacetedFormFilter
        type="text"
        size="small"
        title="Search"
        value={search}
        onChange={onSearchChange}
        placeholder="Search by name…"
      />

      {enabledFilters.applicationStage && (
        <FacetedFormFilter
          type="multi"
          size="small"
          title="Stage"
          placeholder="Filter by stage…"
          options={APPLICATION_STAGE_OPTIONS}
          selected={applicationStage}
          onSelect={onApplicationStageChange}
        />
      )}

      {enabledFilters.applicationState && (
        <FacetedFormFilter
          type="single"
          size="small"
          title="Status"
          placeholder="Filter by status…"
          options={APPLICATION_STATE_OPTIONS}
          selected={applicationState ? [applicationState] : []}
          onSelect={(vals) =>
            onApplicationStateChange((vals[0] as ApplicationStateFilter) || undefined)
          }
        />
      )}

      {enabledFilters.handledBy && canViewHandledByFilter && (
        <FacetedFormFilter
          type="multi"
          size="small"
          title="Handled by"
          placeholder="Filter by admin…"
          options={adminOptions}
          selected={handledBy}
          onSelect={onHandledByChange}
          isLoading={isLoadingAdmins}
        />
      )}

      {enabledFilters.deadline && (
        <FacetedFormFilter
          type="single"
          size="small"
          title="Deadline"
          placeholder="Filter by deadline…"
          options={DEADLINE_OPTIONS}
          selected={deadlineCategory ? [deadlineCategory] : []}
          onSelect={(vals) =>
            onDeadlineCategoryChange((vals[0] as DeadlineCategory) ?? null)
          }
        />
      )}

      {hasActiveFilters && (
        <Button variant="secondary" mode="ghost" size="2xs" className="text-xs! font-normal! text-neutral-700" onClick={onClearFilters}>
          Reset
          {isLoading && <RiLoader4Line className="h-3 w-3 animate-spin text-neutral-400" />}
        </Button>
      )}
    </div>
  );
}
