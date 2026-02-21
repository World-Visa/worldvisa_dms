"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
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
import { RequestedDocumentsDataTable } from "@/components/requested-documents/RequestedDocumentsDataTable";
import {
  RequestedDocumentsFilters,
  RequestedDocumentsFilters as FiltersType,
} from "@/components/requested-documents/RequestedDocumentsFilters";
import { ApplicationsPagination } from "@/components/applications/ApplicationsPagination";
import { RequestedDocumentViewSheet } from "@/components/requested-documents/RequestedDocumentViewSheet";
import { useAuth } from "@/hooks/useAuth";
import { RequestedDocument } from "@/lib/api/requestedDocuments";

type ActiveTab = "requested-to-me" | "my-requests" | "all-requests";

export default function RequestedDocsClient() {
  const { user } = useAuth();
  const isMasterAdmin = user?.role === "master_admin";

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
  const {
    data: allRequestedToMeStats,
    isLoading: isLoadingRequestedToMeCount,
  } = useRequestedDocumentsToMe({
    enabled: activeTab === "requested-to-me",
  });

  const { data: allMyRequestsStats, isLoading: isLoadingMyRequestsCount } =
    useMyRequestedDocuments({
      enabled: activeTab === "my-requests",
    });

  const { data: allRequestsStatsData, isLoading: isLoadingAllRequestsCount } =
    useAllRequestedDocuments({
      enabled: activeTab === "all-requests" && isMasterAdmin,
    });

  // Get current tab data and pagination
  const getCurrentTabData = () => {
    switch (activeTab) {
      case "requested-to-me":
        return {
          documents: requestedToMeData?.data || [],
          pagination: requestedToMeData?.pagination,
          isLoading: isLoadingRequestedToMe,
          statsData: allRequestedToMeStats?.data || [],
          isLoadingStats: isLoadingRequestedToMeCount,
        };
      case "my-requests":
        return {
          documents: myRequestsData?.data || [],
          pagination: myRequestsData?.pagination,
          isLoading: isLoadingMyRequests,
          statsData: allMyRequestsStats?.data || [],
          isLoadingStats: isLoadingMyRequestsCount,
        };
      case "all-requests":
        return {
          documents: allRequestsData?.data || [],
          pagination: allRequestsData?.pagination,
          isLoading: isLoadingAllRequests,
          statsData: allRequestsStatsData?.data || [],
          isLoadingStats: isLoadingAllRequestsCount,
        };
      default:
        return {
          documents: [],
          pagination: undefined,
          isLoading: false,
          statsData: [],
          isLoadingStats: false,
        };
    }
  };

  const { documents, pagination, isLoading, statsData, isLoadingStats } =
    getCurrentTabData();

  const displayDocuments = isSearchMode
    ? searchData?.data ?? []
    : documents;
  const displayPagination = isSearchMode ? searchData?.pagination : pagination;
  const displayLoading = isSearchMode ? isSearchLoading : isLoading;

  // Calculate stats from current tab's full dataset
  const calculateStats = (docs: RequestedDocument[]) => {
    return docs.reduce(
      (acc, doc) => {
        if (doc.requested_review?.status === "pending") acc.pendingRequests++;
        if (doc.requested_review?.status === "reviewed") acc.reviewedRequests++;
        if (doc.isOverdue) acc.overdue++;
        return acc;
      },
      { pendingRequests: 0, reviewedRequests: 0, overdue: 0 },
    );
  };

  const stats = calculateStats(statsData);

  // Event handlers
  const handleRefresh = async () => {
    try {
      switch (activeTab) {
        case "requested-to-me":
          await refetchRequestedToMe();
          break;
        case "my-requests":
          await refetchMyRequests();
          break;
        case "all-requests":
          if (isMasterAdmin) {
            await refetchAllRequests();
          }
          break;
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSearchInput((prev) => prev.trim());
      setCurrentPage(1);
    }
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
    <main className="">
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-medium text-foreground mb-2 flex items-center gap-2">
              Requested Documents
            </h1>
          </div>
          <div className="flex w-full max-w-[320px] items-center overflow-hidden rounded-md border-0 bg-[rgb(240,240,243)] shadow-none">
            <span className="flex shrink-0 pl-4 pr-1 text-[#8E8E93]" aria-hidden>
              <Search className="h-4 w-4" />
            </span>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search"
              className="h-10 min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-neutral-900 placeholder:text-[#8E8E93] focus:outline-none focus:ring-0"
              aria-label="Search requested documents"
            />
          </div>
        </div>
      </div>

      {/* <RequestedDocsStats
        pendingRequests={stats.pendingRequests}
        reviewedRequests={stats.reviewedRequests}
        overdue={stats.overdue}
      /> */}

      {/* Tabs + Filters row (same alignment) */}
      <div className="mb-4 flex items-end justify-between border-b border-gray-200">
        <div
          className="flex"
          role="tablist"
          aria-label="Requested documents tabs"
        >
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
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums transition-all duration-150",
                  activeTab === "all-requests"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-400",
                )}
              >
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
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums transition-all duration-150",
                activeTab === "requested-to-me"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-400",
              )}
            >
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
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums transition-all duration-150",
                activeTab === "my-requests"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-400",
              )}
            >
              {getTabCount("my-requests")}
            </span>
          </button>
        </div>
        <div className="pb-2">
          <RequestedDocumentsFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onRefresh={handleRefresh}
            isRefreshing={displayLoading}
            totalCount={displayPagination?.totalItems ?? 0}
            filteredCount={displayDocuments.length}
          />
        </div>
      </div>

      {isSearchMode && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-neutral-600">
            Search results for &quot;{debouncedSearch}&quot;
            {displayPagination != null && (
              <span className="ml-1 font-medium">
                ({displayPagination.totalItems} result
                {displayPagination.totalItems !== 1 ? "s" : ""})
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setCurrentPage(1);
            }}
            className="text-sm font-medium text-neutral-600 underline-offset-2 hover:underline"
          >
            Clear search
          </button>
        </div>
      )}

      <div className="space-y-4">
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
