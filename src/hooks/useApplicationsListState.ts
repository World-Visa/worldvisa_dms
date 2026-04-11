"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useQueryString } from "@/hooks/useQueryString";
import { resolveCountry } from "@/lib/applications/utils";
import type {
  Country,
  DeadlineCategory,
  ApplicationStateFilter,
  ApplicationsFilters,
  SearchParams,
} from "@/types/applications";

interface UseApplicationsListStateOptions {
  componentName: string;
}

export interface ApplicationsListState {
  // State
  selectedCountry: Country;
  page: number;
  search: string;
  searchQuery: string;
  handledBy: string[];
  applicationStage: string[];
  applicationState: ApplicationStateFilter | undefined;
  deadlineCategory: DeadlineCategory | null;
  // Derived
  isSearchMode: boolean;
  filters: ApplicationsFilters;
  searchParamsForAPI: SearchParams;
  // Handlers
  handleCountryChange: (country: Country) => void;
  handlePageChange: (newPage: number) => void;
  handleSearchChange: (value: string) => void;
  handleSearchClick: () => Promise<void>;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  handleHandledByChange: (value: string[]) => void;
  handleApplicationStageChange: (value: string[]) => void;
  handleApplicationStateChange: (value: ApplicationStateFilter | undefined) => void;
  handleDeadlineCategoryClick: (category: DeadlineCategory | null) => void;
  handleClearFilters: () => void;
}

export function useApplicationsListState({
  componentName,
}: UseApplicationsListStateOptions): ApplicationsListState {
  const { queryParams, updateQuery } = useQueryString();
  const { measureAsync } = usePerformanceMonitor(componentName);

  const [selectedCountry, setSelectedCountry] = useState<Country>(() =>
    resolveCountry(queryParams.country as string | undefined),
  );
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [handledBy, setHandledBy] = useState<string[]>([]);
  const [applicationStage, setApplicationStage] = useState<string[]>([]);
  const [applicationState, setApplicationState] = useState<
    ApplicationStateFilter | undefined
  >(undefined);
  const [deadlineCategory, setDeadlineCategory] =
    useState<DeadlineCategory | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const isSearchMode = searchQuery.trim() !== "";

  // ── Derived: filters memo ────────────────────────────────────────────────
  const filters = useMemo<ApplicationsFilters>(() => {
    return {
      page,
      limit: 20,
      handledBy: handledBy.length > 0 ? handledBy : undefined,
      applicationStage:
        applicationStage.length > 0 ? applicationStage : undefined,
      applicationState: applicationState ?? undefined,
      country: selectedCountry,
    };
  }, [page, handledBy, applicationStage, applicationState, selectedCountry]);

  // ── Derived: search params memo ──────────────────────────────────────────
  const searchParamsForAPI = useMemo<SearchParams>(() => {
    if (!searchQuery.trim()) return {};
    return {
      search: searchQuery.trim(),
      country: selectedCountry,
      page,
      limit: 20,
    };
  }, [searchQuery, selectedCountry, page]);

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

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
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
    setHandledBy([]);
    setApplicationStage([]);
    setApplicationState(undefined);
    setDeadlineCategory(null);
    setSelectedCountry("Australia");
    setPage(1);
    updateQuery({
      deadlineCategory: undefined,
      country: undefined,
    });
  }, [updateQuery]);

  return {
    selectedCountry,
    page,
    search,
    searchQuery,
    handledBy,
    applicationStage,
    applicationState,
    deadlineCategory,
    isSearchMode,
    filters,
    searchParamsForAPI,
    handleCountryChange,
    handlePageChange,
    handleSearchChange,
    handleSearchClick,
    handleKeyPress,
    handleHandledByChange,
    handleApplicationStageChange,
    handleApplicationStateChange,
    handleDeadlineCategoryClick,
    handleClearFilters,
  };
}
