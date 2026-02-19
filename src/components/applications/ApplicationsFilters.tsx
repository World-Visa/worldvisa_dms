"use client";

import React, { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Search,
  SlidersHorizontal,
  Calendar,
  Users,
  Layers,
  LayoutList,
} from "lucide-react";
import { DateRange } from "react-day-picker";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAuth } from "@/hooks/useAuth";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { cn } from "@/lib/utils";

const APPLICATION_STAGES = [
  "Stage 1 Documentation: Approved",
  "Stage 1 Documentation: Rejected",
  "Stage 1 Milestone Completed",
  "Stage 1 Documentation Reviewed",
  "Skill Assessment Stage",
  "Language Test",
  "Lodge Application 1",
  "Lodge Application 2",
  "Lodge Application 3",
  "Lodge Application 4",
  "INIVITATION TO APPLY",
  "Invitation to Apply",
  "Invitation to Apply 2",
  "VA Application Lodge",
  "Stage 3 Documentation: Approved",
  "Stage 3 Visa Application",
] as const;

const APPLICATION_STATE_ALL = "__all__";

const APPLICATION_STATE_OPTIONS = [
  { value: APPLICATION_STATE_ALL, label: "All" },
  { value: "Active", label: "Active" },
  { value: "In-Active", label: "In-Active" },
] as const;

type ApplicationStateValue = "Active" | "In-Active";

// ─── ApplicationsSearch ─────────────────────────────────────────────────────

interface ApplicationsSearchProps {
  search: string;
  searchType: "name" | "phone" | "email";
  onSearchChange: (value: string) => void;
  onSearchTypeChange: (type: "name" | "phone" | "email") => void;
  onSearchClick: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function ApplicationsSearch({
  search,
  searchType,
  onSearchChange,
  onSearchTypeChange,
  onSearchClick,
  onKeyDown,
}: ApplicationsSearchProps) {
  return (
    <div className="flex w-[400px] items-center overflow-hidden rounded-lg border border-input bg-accent shadow-xs">
      <Select value={searchType} onValueChange={onSearchTypeChange}>
        <SelectTrigger className="h-10 w-[100px] shrink-0 rounded-none border-0 border-r border-input bg-transparent px-3 focus:ring-0 focus:ring-offset-0 hover:bg-muted/40 transition-colors gap-1">
          <span className="text-sm font-medium text-muted-foreground capitalize">
            {searchType}
          </span>
        </SelectTrigger>
        <SelectContent className="rounded-lg shadow-lg">
          <SelectGroup>
            <SelectItem value="name" className="rounded-md">
              Search by name
            </SelectItem>
            <SelectItem value="phone" className="rounded-md">
              Search by phone
            </SelectItem>
            <SelectItem value="email" className="rounded-md">
              Search by email
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="min-w-0 flex-1">
        <Input
          placeholder={`Search by ${searchType}…`}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="h-10 border-0 bg-accent px-3 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      <div className="shrink-0 px-2">
        <Search className="h-4 w-4 text-slate-500" />
      </div>
    </div>
  );
}

// ─── ApplicationsFilters ─────────────────────────────────────────────────────

interface ApplicationsFiltersProps {
  dateRange: DateRange | undefined;
  limit: number;
  handledBy?: string[];
  applicationStage?: string[];
  applicationState?: ApplicationStateValue;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onLimitChange: (value: number) => void;
  onHandledByChange?: (value: string[]) => void;
  onApplicationStageChange?: (value: string[]) => void;
  onApplicationStateChange?: (value: ApplicationStateValue | undefined) => void;
  onClearFilters: () => void;
}

export function ApplicationsFilters({
  dateRange,
  limit,
  handledBy = [],
  applicationStage = [],
  applicationState,
  onDateRangeChange,
  onLimitChange,
  onHandledByChange,
  onApplicationStageChange,
  onApplicationStateChange,
  onClearFilters,
}: ApplicationsFiltersProps) {
  const { user } = useAuth();
  const { data: adminUsers, isLoading: isLoadingAdmins } = useAdminUsers();

  const canViewHandledByFilter = useMemo(() => {
    if (!user?.role) return false;
    return ["master_admin", "supervisor"].includes(user.role);
  }, [user?.role]);

  const adminOptions: MultiSelectOption[] = useMemo(() => {
    if (!adminUsers) return [];
    return adminUsers
      .filter((admin) => admin.role === "admin")
      .map((admin) => ({
        value: admin.username,
        label: admin.username,
        role: admin.role,
      }));
  }, [adminUsers]);

  const stageOptions: MultiSelectOption[] = useMemo(
    () =>
      APPLICATION_STAGES.map((stage) => ({
        value: stage,
        label: stage,
      })),
    [],
  );

  const hasActiveFilters =
    Boolean(dateRange?.from || dateRange?.to) ||
    (handledBy && handledBy.length > 0) ||
    (applicationStage && applicationStage.length > 0) ||
    Boolean(applicationState);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (dateRange?.from || dateRange?.to) count++;
    if (handledBy && handledBy.length > 0) count++;
    if (applicationStage && applicationStage.length > 0) count++;
    if (applicationState) count++;
    return count;
  }, [dateRange, handledBy, applicationStage, applicationState]);

  const showApplicationSection =
    Boolean(onApplicationStageChange) || Boolean(onApplicationStateChange);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 gap-2 rounded-lg px-3.5 text-sm font-medium transition-all",
            hasActiveFilters
              ? "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[400px] overflow-hidden rounded-xl border border-border/80 p-0 shadow-xl"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Filters
            </span>
            {activeFilterCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {activeFilterCount} active
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <Button
              onClick={onClearFilters}
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* ── Sections ── */}
        <div className="max-h-[520px] divide-y divide-border/60 overflow-y-auto">

          {/* Date Range */}
          <div className="px-5 py-4">
            <div className="mb-3 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Date Range
              </span>
            </div>
            <DateRangePicker
              value={dateRange}
              onChange={onDateRangeChange}
              placeholder="Select date range"
              className="w-full"
            />
          </div>

          {/* Team */}
          {canViewHandledByFilter && onHandledByChange && (
            <div className="px-5 py-4">
              <div className="mb-3 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Team
                </span>
              </div>
              <MultiSelect
                options={adminOptions}
                value={handledBy}
                onChange={onHandledByChange}
                placeholder="Select admins…"
                disabled={isLoadingAdmins}
                loading={isLoadingAdmins}
                className="w-full"
              />
            </div>
          )}

          {/* Application */}
          {showApplicationSection && (
            <div className="space-y-3.5 px-5 py-4">
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Application
                </span>
              </div>

              {onApplicationStageChange && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Stage
                  </Label>
                  <MultiSelect
                    options={stageOptions}
                    value={applicationStage}
                    onChange={onApplicationStageChange}
                    placeholder="Select stages…"
                    className="w-full"
                  />
                </div>
              )}

              {onApplicationStateChange && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Status
                  </Label>
                  <Select
                    value={applicationState ?? APPLICATION_STATE_ALL}
                    onValueChange={(value) =>
                      onApplicationStateChange(
                        value === APPLICATION_STATE_ALL
                          ? undefined
                          : (value as ApplicationStateValue),
                      )
                    }
                  >
                    <SelectTrigger className="h-9 w-full rounded-md">
                      <SelectValue placeholder="All states" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg shadow-lg">
                      <SelectGroup>
                        {APPLICATION_STATE_OPTIONS.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            className="rounded-md py-2 text-sm"
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Display */}
          <div className="px-5 py-4">
            <div className="mb-3 flex items-center gap-1.5">
              <LayoutList className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Display
              </span>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Results per page
              </Label>
              <Select
                value={limit.toString()}
                onValueChange={(value) => onLimitChange(Number(value))}
              >
                <SelectTrigger className="h-9 w-full rounded-md">
                  <SelectValue>{limit} results</SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-lg shadow-lg">
                  <SelectGroup>
                    {[10, 20, 50, 100].map((n) => (
                      <SelectItem
                        key={n}
                        value={n.toString()}
                        className="rounded-md py-2 text-sm"
                      >
                        {n} results
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
