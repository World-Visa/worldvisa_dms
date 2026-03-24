"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { useDebounce } from "@/hooks/useDebounce";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useQueryString } from "@/hooks/useQueryString";
import { formatLocalDate, resolveCountry } from "@/lib/applications/utils";
import type {
  Country,
  DeadlineCategory,
  SearchType,
  ApplicationStateFilter,
  ApplicationsFilters,
  SearchParams,
} from "@/types/applications";

interface UseApplicationsListStateOptions {
  initialRecentActivity?: boolean;
  componentName: string;
}

export interface ApplicationsListState {
  // State
  selectedCountry: Country;
  page: number;
  limit: number;
  search: string;
  searchType: SearchType;
  searchQuery: string;
  dateRange: DateRange | undefined;
  handledBy: string[];
  applicationStage: string[];
  applicationState: ApplicationStateFilter | undefined;
  deadlineCategory: DeadlineCategory | null;
  recentActivity: boolean;
  // Derived
  isSearchMode: boolean;
  filters: ApplicationsFilters;
  searchParamsForAPI: SearchParams;
  // Handlers
  handleCountryChange: (country: Country) => void;
  handlePageChange: (newPage: number) => void;
  handleLimitChange: (newLimit: number) => void;
  handleSearchChange: (value: string) => void;
  handleSearchTypeChange: (type: SearchType) => void;
  handleSearchClick: () => Promise<void>;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  handleDateRangeChange: (range: DateRange | undefined) => void;
  handleHandledByChange: (value: string[]) => void;
  handleApplicationStageChange: (value: string[]) => void;
  handleApplicationStateChange: (value: ApplicationStateFilter | undefined) => void;
  handleDeadlineCategoryClick: (category: DeadlineCategory | null) => void;
  handleClearFilters: () => void;
  handleRecentActivityToggle: () => void;
}

export function useApplicationsListState({
  initialRecentActivity = false,
  componentName,
}: UseApplicationsListStateOptions): ApplicationsListState {
  const { queryParams, updateQuery } = useQueryString();
  const { measureAsync } = usePerformanceMonitor(componentName);

  const [selectedCountry, setSelectedCountry] = useState<Country>(() =>
    resolveCountry(queryParams.country as string | undefined),
  );
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [handledBy, setHandledBy] = useState<string[]>([]);
  const [applicationStage, setApplicationStage] = useState<string[]>([]);
  const [applicationState, setApplicationState] = useState<
    ApplicationStateFilter | undefined
  >(undefined);
  const [deadlineCategory, setDeadlineCategory] =
    useState<DeadlineCategory | null>(null);
  const [recentActivity, setRecentActivity] = useState(
    () =>
      queryParams.recentActivity === "true" ||
      queryParams.recentActivity === true ||
      initialRecentActivity,
  );

  const debouncedSearch = useDebounce(search, 300);

  const isSearchMode = searchQuery.trim() !== "";

  // ── Derived: filters memo ────────────────────────────────────────────────
  const filters = useMemo<ApplicationsFilters>(() => {
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (dateRange?.from && dateRange?.to) {
      if (dateRange.from <= dateRange.to) {
        startDate = formatLocalDate(dateRange.from);
        endDate = formatLocalDate(dateRange.to);
      } else {
        startDate = formatLocalDate(dateRange.to);
        endDate = formatLocalDate(dateRange.from);
      }
    } else if (dateRange?.from) {
      startDate = formatLocalDate(dateRange.from);
    } else if (dateRange?.to) {
      endDate = formatLocalDate(dateRange.to);
    }

    return {
      page,
      limit,
      startDate,
      endDate,
      recentActivity: recentActivity || undefined,
      handledBy: handledBy.length > 0 ? handledBy : undefined,
      applicationStage:
        applicationStage.length > 0 ? applicationStage : undefined,
      applicationState: applicationState ?? undefined,
      country: selectedCountry,
    };
  }, [
    page,
    limit,
    dateRange,
    recentActivity,
    handledBy,
    applicationStage,
    applicationState,
    selectedCountry,
  ]);

  // ── Derived: search params memo ──────────────────────────────────────────
  const searchParamsForAPI = useMemo<SearchParams>(() => {
    if (!searchQuery.trim()) return {};
    const params: SearchParams = {};
    params[searchType] = searchQuery.trim();
    params.country = selectedCountry;
    return params;
  }, [searchQuery, searchType, selectedCountry]);

  // ── URL sync effects ─────────────────────────────────────────────────────
  useEffect(() => {
    if (debouncedSearch.trim() && debouncedSearch.length >= 2) {
      setSearchQuery(debouncedSearch.trim());
      setPage(1);
    } else if (debouncedSearch.trim() === "") {
      setSearchQuery("");
    }
  }, [debouncedSearch]);

  useEffect(() => {
    const urlRecentActivity =
      queryParams.recentActivity === "true" ||
      queryParams.recentActivity === true;
    if (urlRecentActivity !== recentActivity) {
      setRecentActivity(urlRecentActivity);
    }
  }, [queryParams.recentActivity, recentActivity]);

  useEffect(() => {
    const urlDeadlineCategory = queryParams.deadlineCategory;
    const valid: DeadlineCategory[] = [
      "approaching",
      "overdue",
      "noDeadline",
      "future",
    ];
    if (urlDeadlineCategory && valid.includes(urlDeadlineCategory as DeadlineCategory)) {
      setDeadlineCategory(urlDeadlineCategory as DeadlineCategory);
    } else if (!urlDeadlineCategory && deadlineCategory) {
      setDeadlineCategory(null);
    }
  }, [queryParams.deadlineCategory, deadlineCategory]);

  useEffect(() => {
    const resolved = resolveCountry(queryParams.country as string | undefined);
    if (resolved !== selectedCountry) {
      setSelectedCountry(resolved);
    }
  }, [queryParams.country, selectedCountry]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCountryChange = useCallback(
    (country: Country) => {
      setSelectedCountry(country);
      setPage(1);
      setDeadlineCategory(null);
      setSearch("");
      setSearchQuery("");
      updateQuery({
        country: country === "Australia" ? undefined : country,
        deadlineCategory: undefined,
      });
    },
    [updateQuery],
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleSearchTypeChange = useCallback((type: SearchType) => {
    setSearchType(type);
  }, []);

  const handleSearchClick = useCallback(async () => {
    if (search.trim()) {
      await measureAsync(async () => {
        setSearchQuery(search.trim());
        setPage(1);
      }, "searchApplications");
    }
  }, [search, measureAsync]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && search.trim()) {
        handleSearchClick();
      }
    },
    [search, handleSearchClick],
  );

  const handleDateRangeChange = useCallback(
    (range: DateRange | undefined) => {
      setDateRange(range);
      setPage(1);
    },
    [],
  );

  const handleHandledByChange = useCallback((value: string[]) => {
    setHandledBy(value);
    setPage(1);
  }, []);

  const handleApplicationStageChange = useCallback((value: string[]) => {
    setApplicationStage(value);
    setPage(1);
  }, []);

  const handleApplicationStateChange = useCallback(
    (value: ApplicationStateFilter | undefined) => {
      setApplicationState(value);
      setPage(1);
    },
    [],
  );

  const handleDeadlineCategoryClick = useCallback(
    (category: DeadlineCategory | null) => {
      setDeadlineCategory(category);
      setPage(1);
      updateQuery({ deadlineCategory: category ?? undefined });
    },
    [updateQuery],
  );

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setSearchQuery("");
    setSearchType("name");
    setDateRange(undefined);
    setHandledBy([]);
    setApplicationStage([]);
    setApplicationState(undefined);
    setRecentActivity(false);
    setDeadlineCategory(null);
    setSelectedCountry("Australia");
    setPage(1);
    updateQuery({
      recentActivity: undefined,
      deadlineCategory: undefined,
      country: undefined,
    });
  }, [updateQuery]);

  const handleRecentActivityToggle = useCallback(() => {
    const next = !recentActivity;
    setRecentActivity(next);
    setPage(1);
    updateQuery({ recentActivity: next ? "true" : undefined });
  }, [recentActivity, updateQuery]);

  return {
    selectedCountry,
    page,
    limit,
    search,
    searchType,
    searchQuery,
    dateRange,
    handledBy,
    applicationStage,
    applicationState,
    deadlineCategory,
    recentActivity,
    isSearchMode,
    filters,
    searchParamsForAPI,
    handleCountryChange,
    handlePageChange,
    handleLimitChange,
    handleSearchChange,
    handleSearchTypeChange,
    handleSearchClick,
    handleKeyPress,
    handleDateRangeChange,
    handleHandledByChange,
    handleApplicationStageChange,
    handleApplicationStateChange,
    handleDeadlineCategoryClick,
    handleClearFilters,
    handleRecentActivityToggle,
  };
}
