"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  useRequestedDocumentsToMePaginated,
  useMyRequestedDocumentsPaginated,
  useAllRequestedDocumentsPaginated,
  useRequestedDocumentsToMe,
  useMyRequestedDocuments,
  useAllRequestedDocuments,
  useRequestedDocumentsSearch,
} from "@/hooks/useRequestedDocuments";
import { useDebounce } from "@/hooks/useDebounce";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { RequestedDocumentsDataTable } from "@/components/requested-documents/RequestedDocumentsDataTable";
import type { RequestedDocumentsFilters as FiltersType } from "@/components/requested-documents/RequestedDocumentsFilters";
import { FacetedFormFilter } from "@/components/ui/faceted-filter/facated-form-filter";
import { Button } from "@/components/ui/primitives/button";
import { REQUESTED_DOCUMENT_STATUS_OPTIONS } from "@/lib/constants/requestedDocuments";
import { ApplicationsPagination } from "@/components/applications/ApplicationsPagination";
import { RequestedDocumentViewSheet } from "@/components/requested-documents/RequestedDocumentViewSheet";
import { useAuth } from "@/hooks/useAuth";
import { RequestedDocument } from "@/lib/api/requestedDocuments";

type ActiveTab = "requested-to-me" | "my-requests" | "all-requests";

export default function RequestedDocsClient() {
  const { user } = useAuth();
  const isMasterAdmin = user?.role === "master_admin";
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawDocId = searchParams.get("documentId");
  const [targetDocId, setTargetDocId] = useState<string | null>(null);
  const deepLinkActive = !!rawDocId || !!targetDocId;

  const [activeTab, setActiveTab] = useState<ActiveTab>(
    isMasterAdmin ? "all-requests" : "requested-to-me",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [filters, setFilters] = useState<FiltersType>({
    search: "",
    status: "all",
    priority: "",
    requestedBy: "",
    requestedTo: "",
  });
  const [selectedDocument, setSelectedDocument] =
    useState<RequestedDocument | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const { data: adminUsers = [], isLoading: isLoadingAdmins } = useAdminUsers();
  const adminOptions = useMemo(
    () => adminUsers.map((u) => ({ value: u.username ?? "", label: u.username ?? "" })).filter((o) => o.value),
    [adminUsers],
  );

  const debouncedSearch = useDebounce(searchInput.trim(), 350);
  const isSearchMode = debouncedSearch.length > 0;

  const apiFilters =
    filters.status !== "all"
      ? {
        status: filters.status,
        requested_by: filters.requestedBy || undefined,
        requested_to: filters.requestedTo || undefined,
      }
      : {
        requested_by: filters.requestedBy || undefined,
        requested_to: filters.requestedTo || undefined,
      };

  const {
    data: requestedToMeData,
    isLoading: isLoadingRequestedToMe,
    refetch: refetchRequestedToMe,
  } = useRequestedDocumentsToMePaginated(
    currentPage,
    limit,
    apiFilters,
    {
      enabled: activeTab === "requested-to-me",
    },
  );

  const {
    data: myRequestsData,
    isLoading: isLoadingMyRequests,
    refetch: refetchMyRequests,
  } = useMyRequestedDocumentsPaginated(
    currentPage,
    limit,
    apiFilters,
    {
      enabled: activeTab === "my-requests",
    },
  );

  const {
    data: allRequestsData,
    isLoading: isLoadingAllRequests,
    refetch: refetchAllRequests,
  } = useAllRequestedDocumentsPaginated(currentPage, limit, apiFilters, {
    enabled: activeTab === "all-requests" && isMasterAdmin,
  });

  const { data: searchData, isLoading: isSearchLoading } =
    useRequestedDocumentsSearch(currentPage, limit, debouncedSearch, {
      enabled: isSearchMode,
    });

  // Stats queries - fetch all data for stats calculation
  // Also enabled during deep-link navigation so we can find the document across all tabs
  const {
    data: allRequestedToMeStats,
    isLoading: isLoadingRequestedToMeCount,
  } = useRequestedDocumentsToMe({
    enabled: activeTab === "requested-to-me" || deepLinkActive,
  });

  const { data: allMyRequestsStats, isLoading: isLoadingMyRequestsCount } =
    useMyRequestedDocuments({
      enabled: activeTab === "my-requests" || deepLinkActive,
    });

  const { data: allRequestsStatsData, isLoading: isLoadingAllRequestsCount } =
    useAllRequestedDocuments({
      enabled: (activeTab === "all-requests" && isMasterAdmin) || (deepLinkActive && isMasterAdmin),
    });

  // Deep-link Phase 1: capture URL param into state and clear URL immediately.
  // Decoupled from data fetching so URL oscillation doesn't cancel the sheet open.
  useEffect(() => {
    if (!rawDocId) return;
    setTargetDocId(rawDocId);
    router.replace("/v2/requested-docs", { scroll: false });
  }, [rawDocId, router]);

  // Deep-link Phase 2: once we have a target ID and data, find and open the sheet.
  useEffect(() => {
    if (!targetDocId) return;
    const found =
      allRequestedToMeStats?.data?.find((d) => d._id === targetDocId) ??
      allMyRequestsStats?.data?.find((d) => d._id === targetDocId) ??
      allRequestsStatsData?.data?.find((d) => d._id === targetDocId);
    if (!found) return;
    setSelectedDocument(found);
    setTargetDocId(null);
  }, [targetDocId, allRequestedToMeStats?.data, allMyRequestsStats?.data, allRequestsStatsData?.data]);

  // Get current tab data and pagination
  const getCurrentTabData = () => {
    switch (activeTab) {
      case "requested-to-me":
        return {
          documents: requestedToMeData?.data || [],
          pagination: requestedToMeData?.pagination,
          isLoading: isLoadingRequestedToMe,
        };
      case "my-requests":
        return {
          documents: myRequestsData?.data || [],
          pagination: myRequestsData?.pagination,
          isLoading: isLoadingMyRequests,
        };
      case "all-requests":
        return {
          documents: allRequestsData?.data || [],
          pagination: allRequestsData?.pagination,
          isLoading: isLoadingAllRequests,
        };
      default:
        return {
          documents: [],
          pagination: undefined,
          isLoading: false,
        };
    }
  };

  const { documents, pagination, isLoading } =
    getCurrentTabData();

  const displayDocuments = isSearchMode
    ? searchData?.data ?? []
    : documents;
  const displayPagination = isSearchMode ? searchData?.pagination : pagination;
  const displayLoading = isSearchMode ? isSearchLoading : isLoading;

  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as ActiveTab);
    setCurrentPage(1);
  };

  const handleViewDocument = (document: RequestedDocument) => {
    setSelectedDocument(document);
  };

  const handleCloseSheet = () => {
    setSelectedDocument(null);
  };

  const hasActiveFilters =
    searchInput.trim() !== "" ||
    filters.status !== "all" ||
    Boolean(filters.requestedBy) ||
    Boolean(filters.requestedTo);

  const clearFilters = () => {
    setSearchInput("");
    setFilters({ search: "", status: "all", priority: "", requestedBy: "", requestedTo: "" });
    setCurrentPage(1);
  };

  // Get counts for tab labels
  const getTabCount = (tab: ActiveTab) => {
    switch (tab) {
      case "requested-to-me":
        return isLoadingRequestedToMeCount
          ? "..."
          : allRequestedToMeStats?.data?.length || 0;
      case "my-requests":
        return isLoadingMyRequestsCount
          ? "..."
          : allMyRequestsStats?.data?.length || 0;
      case "all-requests":
        return isLoadingAllRequestsCount
          ? "..."
          : allRequestsStatsData?.data?.length || 0;
      default:
        return 0;
    }
  };

  return (
    <main className="max-w-[1200px] mx-auto">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-foreground">Requested Documents</h1>
      </div>

      {/* Tabs row */}
      <div className="mb-4 flex items-end border-b border-gray-200">
        <div className="flex" role="tablist" aria-label="Requested documents tabs">
          {isMasterAdmin && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "all-requests"}
              onClick={() => handleTabChange("all-requests")}
              className={cn(
                "relative flex items-center gap-2.5 px-5 pb-3 pt-2 text-sm font-medium tracking-wide",
                "focus:outline-none transition-colors duration-150",
                "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-full",
                "after:transition-all after:duration-200",
                activeTab === "all-requests"
                  ? "text-gray-900 after:bg-gray-900"
                  : "text-gray-400 hover:text-gray-600 after:bg-transparent hover:after:bg-gray-200",
              )}
            >
              All Requests
              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums transition-all duration-150", activeTab === "all-requests" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400")}>
                {getTabCount("all-requests")}
              </span>
            </button>
          )}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "requested-to-me"}
            onClick={() => handleTabChange("requested-to-me")}
            className={cn(
              "relative flex items-center gap-2.5 px-5 pb-3 pt-2 text-sm font-medium tracking-wide",
              "focus:outline-none transition-colors duration-150",
              "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-full",
              "after:transition-all after:duration-200",
              activeTab === "requested-to-me"
                ? "text-gray-900 after:bg-gray-900"
                : "text-gray-400 hover:text-gray-600 after:bg-transparent hover:after:bg-gray-200",
            )}
          >
            Requested to Me
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums transition-all duration-150", activeTab === "requested-to-me" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400")}>
              {getTabCount("requested-to-me")}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "my-requests"}
            onClick={() => handleTabChange("my-requests")}
            className={cn(
              "relative flex items-center gap-2.5 px-5 pb-3 pt-2 text-sm font-medium tracking-wide",
              "focus:outline-none transition-colors duration-150",
              "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-full",
              "after:transition-all after:duration-200",
              activeTab === "my-requests"
                ? "text-gray-900 after:bg-gray-900"
                : "text-gray-400 hover:text-gray-600 after:bg-transparent hover:after:bg-gray-200",
            )}
          >
            My Requests
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums transition-all duration-150", activeTab === "my-requests" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400")}>
              {getTabCount("my-requests")}
            </span>
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2 py-2.5">
        <FacetedFormFilter
          type="text"
          size="small"
          title="Search"
          value={searchInput}
          onChange={(v) => { setSearchInput(v); setCurrentPage(1); }}
          placeholder="Search by name…"
        />
        <FacetedFormFilter
          type="single"
          size="small"
          title="Status"
          options={REQUESTED_DOCUMENT_STATUS_OPTIONS}
          selected={filters.status !== "all" ? [filters.status] : []}
          onSelect={(vals) => { handleFiltersChange({ ...filters, status: vals[0] ?? "all" }); }}
        />
        <FacetedFormFilter
          type="single"
          size="small"
          title="Requested By"
          options={adminOptions}
          selected={filters.requestedBy ? [filters.requestedBy] : []}
          onSelect={(vals) => { handleFiltersChange({ ...filters, requestedBy: vals[0] ?? "" }); }}
          isLoading={isLoadingAdmins}
        />
        <FacetedFormFilter
          type="single"
          size="small"
          title="Requested To"
          options={adminOptions}
          selected={filters.requestedTo ? [filters.requestedTo] : []}
          onSelect={(vals) => { handleFiltersChange({ ...filters, requestedTo: vals[0] ?? "" }); }}
          isLoading={isLoadingAdmins}
        />
        {hasActiveFilters && (
          <Button variant="secondary" mode="ghost" size="2xs" className="text-xs! font-normal! text-neutral-700" onClick={clearFilters}>
            Reset
          </Button>
        )}
      </div>

      <div className="space-y-4 mt-2">
        <RequestedDocumentsDataTable
          documents={displayDocuments}
          isLoading={displayLoading}
          type={activeTab}
          totalItems={displayPagination?.totalItems ?? 0}
          onViewDocument={handleViewDocument}
          searchQuery={isSearchMode ? debouncedSearch : ""}
        />

        {displayPagination && (
          <ApplicationsPagination
            currentPage={displayPagination.currentPage}
            totalRecords={displayPagination.totalItems}
            limit={limit}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {selectedDocument && (
        <RequestedDocumentViewSheet
          document={selectedDocument}
          isOpen={!!selectedDocument}
          onClose={handleCloseSheet}
          type={activeTab}
        />
      )}
    </main>
  );
}
