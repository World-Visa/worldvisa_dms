"use client";

import React, { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Search,
  User,
  Phone,
  Mail,
  Filter,
  X,
  Calendar,
  Users,
  Layers,
  CircleDot,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAuth } from "@/hooks/useAuth";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";

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

interface ApplicationsFiltersProps {
  search: string;
  searchType: "name" | "phone" | "email";
  dateRange: DateRange | undefined;
  limit: number;
  handledBy?: string[];
  applicationStage?: string[];
  applicationState?: ApplicationStateValue;
  isSearchMode?: boolean;
  onSearchChange: (value: string) => void;
  onSearchTypeChange: (type: "name" | "phone" | "email") => void;
  onSearchClick: () => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onLimitChange: (value: number) => void;
  onHandledByChange?: (value: string[]) => void;
  onApplicationStageChange?: (value: string[]) => void;
  onApplicationStateChange?: (value: ApplicationStateValue | undefined) => void;
  onClearFilters: () => void;
  onKeyPress?: (e: React.KeyboardEvent) => void;
}

export function ApplicationsFilters({
  search,
  searchType,
  dateRange,
  limit,
  handledBy = [],
  applicationStage = [],
  applicationState,
  onSearchChange,
  onSearchTypeChange,
  onSearchClick,
  onDateRangeChange,
  onLimitChange,
  onHandledByChange,
  onApplicationStageChange,
  onApplicationStateChange,
  onClearFilters,
  onKeyPress,
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
    []
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

  const getSearchIcon = () => {
    switch (searchType) {
      case "name":
        return <User className="h-4 w-4" />;
      case "phone":
        return <Phone className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="w-full max-w-lg">
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-lg border border-input bg-background shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center divide-x divide-border">
            <div className="relative shrink-0">
              <Select value={searchType} onValueChange={onSearchTypeChange}>
                <SelectTrigger className="h-10 min-w-[100px] border-0 bg-transparent px-4 rounded-l-lg focus:ring-0 focus:ring-offset-0 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {getSearchIcon()}
                    <span className="font-medium text-sm capitalize">
                      {searchType}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-lg shadow-lg">
                  <SelectGroup>
                    <SelectItem value="name" className="rounded-md py-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Search by name</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="phone" className="rounded-md py-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Search by phone</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="email" className="rounded-md py-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Search by email</span>
                      </div>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 relative">
              <Input
                placeholder={`Search by ${searchType}...`}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyPress={onKeyPress}
                className="h-10 border-0 bg-transparent px-4 focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground text-sm"
              />
            </div>

            <div className="shrink-0 p-1.5">
              <Button
                onClick={onSearchClick}
                disabled={!search.trim()}
                size="sm"
                className={`h-7 w-7 rounded-md p-0 transition-all ${
                  search.trim()
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={`h-10 w-10 rounded-lg relative ${
                hasActiveFilters ? "border-primary ring-1 ring-primary" : ""
              }`}
              aria-label="Open filters menu"
            >
              <Filter className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full px-1 text-[10px] font-medium"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-lg p-4">
            <DropdownMenuLabel className="text-base font-semibold px-0">
              Filters
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-3" />

            <DropdownMenuGroup className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Date range
                </Label>
                <DateRangePicker
                  value={dateRange}
                  onChange={onDateRangeChange}
                  placeholder="Select date range"
                  className="w-full"
                />
              </div>

              {canViewHandledByFilter && onHandledByChange && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Handled by
                  </Label>
                  <MultiSelect
                    options={adminOptions}
                    value={handledBy}
                    onChange={onHandledByChange}
                    placeholder="Select admins..."
                    disabled={isLoadingAdmins}
                    loading={isLoadingAdmins}
                    className="w-full"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  Application stage
                </Label>
                <MultiSelect
                  options={stageOptions}
                  value={applicationStage}
                  onChange={onApplicationStageChange ?? (() => {})}
                  placeholder="Select stages..."
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <CircleDot className="h-4 w-4 text-muted-foreground" />
                  Application state
                </Label>
                <Select
                  value={applicationState ?? APPLICATION_STATE_ALL}
                  onValueChange={(value) =>
                    onApplicationStateChange?.(
                      value === APPLICATION_STATE_ALL
                        ? undefined
                        : (value as ApplicationStateValue)
                    )
                  }
                >
                  <SelectTrigger className="w-full h-9 rounded-md">
                    <SelectValue placeholder="All" />
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

              <div className="space-y-2">
                <Label className="text-sm font-medium">Results per page</Label>
                <Select
                  value={limit.toString()}
                  onValueChange={(value) => onLimitChange(Number(value))}
                >
                  <SelectTrigger className="w-full h-9 rounded-md">
                    <SelectValue>{limit} results</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-lg shadow-lg">
                    <SelectGroup>
                      <SelectItem value="10" className="rounded-md py-2 text-sm">
                        10 results
                      </SelectItem>
                      <SelectItem value="20" className="rounded-md py-2 text-sm">
                        20 results
                      </SelectItem>
                      <SelectItem value="50" className="rounded-md py-2 text-sm">
                        50 results
                      </SelectItem>
                      <SelectItem value="100" className="rounded-md py-2 text-sm">
                        100 results
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </DropdownMenuGroup>

            {hasActiveFilters && (
              <>
                <DropdownMenuSeparator className="my-4" />
                <Button
                  onClick={onClearFilters}
                  variant="ghost"
                  className="w-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  Clear all filters
                </Button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {dateRange?.from && dateRange?.to && (
            <Badge
              variant="secondary"
              className="gap-1.5 py-1.5 pl-2.5 pr-1 text-sm font-medium"
            >
              <span>
                {dateRange.from.toLocaleDateString()} –{" "}
                {dateRange.to.toLocaleDateString()}
              </span>
              <button
                type="button"
                onClick={() => onDateRangeChange(undefined)}
                className="rounded-full p-0.5 hover:bg-muted transition-colors"
                aria-label="Remove date filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {handledBy && handledBy.length > 0 && onHandledByChange && (
            <Badge
              variant="secondary"
              className="gap-1.5 py-1.5 pl-2.5 pr-1 text-sm font-medium"
            >
              <Users className="h-3 w-3" />
              <span>
                {handledBy.length === 1
                  ? `Handled by: ${handledBy[0]}`
                  : `Handled by: ${handledBy.length} admins`}
              </span>
              <button
                type="button"
                onClick={() => onHandledByChange([])}
                className="rounded-full p-0.5 hover:bg-muted transition-colors"
                aria-label="Remove handled by filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {applicationStage && applicationStage.length > 0 && onApplicationStageChange && (
            <Badge
              variant="secondary"
              className="gap-1.5 py-1.5 pl-2.5 pr-1 text-sm font-medium"
            >
              <Layers className="h-3 w-3" />
              <span>
                {applicationStage.length === 1
                  ? applicationStage[0]
                  : `${applicationStage.length} stages`}
              </span>
              <button
                type="button"
                onClick={() => onApplicationStageChange([])}
                className="rounded-full p-0.5 hover:bg-muted transition-colors"
                aria-label="Remove application stage filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {applicationState && onApplicationStateChange && (
            <Badge
              variant="secondary"
              className="gap-1.5 py-1.5 pl-2.5 pr-1 text-sm font-medium"
            >
              <CircleDot className="h-3 w-3" />
              <span>State: {applicationState}</span>
              <button
                type="button"
                onClick={() => onApplicationStateChange(undefined)}
                className="rounded-full p-0.5 hover:bg-muted transition-colors"
                aria-label="Remove application state filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
