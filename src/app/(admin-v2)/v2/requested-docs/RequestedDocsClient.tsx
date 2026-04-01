"use client";

import { memo, useState, useEffect, useMemo } from "react";
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
import { ListNoResults } from "@/components/applications/list-no-results";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";
import { Skeleton } from "@/components/ui/skeleton";
import type { RequestedDocumentsFilters as FiltersType } from "@/components/requested-documents/RequestedDocumentsFilters";
import { FacetedFormFilter } from "@/components/ui/faceted-filter/facated-form-filter";
import { Button } from "@/components/ui/primitives/button";
import { REQUESTED_DOCUMENT_STATUS_OPTIONS } from "@/lib/constants/requestedDocuments";
import { RequestedDocumentViewSheet } from "@/components/requested-documents/RequestedDocumentViewSheet";
import { useAuth } from "@/hooks/useAuth";
import { RequestedDocument } from "@/lib/api/requestedDocuments";
import { REQUESTED_DOCS_TABLE_COLUMNS } from "@/lib/constants/requestedDocsTable";
import { RequestedDocTableRow } from "@/components/requested-documents/RequestedDocTableRow";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROLES } from "@/lib/roles";

type ActiveTab = "requested-to-me" | "my-requests" | "all-requests";

const TableLoadingRow = memo(function TableLoadingRow() {
  return (
    <TableRow>
      {REQUESTED_DOCS_TABLE_COLUMNS.map((col) => (
        <TableCell key={col.label} className={col.cellClassName}>
          <Skeleton className={col.skeletonClassName} />
        </TableCell>
      ))}
    </TableRow>
  );
});

export default function RequestedDocsClient() {
  const { user } = useAuth();
  const isMasterAdmin = user?.role === ROLES.MASTER_ADMIN;
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawDocId = searchParams.get("documentId");
  const [targetDocId, setTargetDocId] = useState<string | null>(null);
  const deepLinkActive = !!rawDocId || !!targetDocId;

  const [activeTab, setActiveTab] = useState<ActiveTab>(
    isMasterAdmin ? "all-requests" : "requested-to-me",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
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
    () =>
      adminUsers
        .map((u) => {
          const username = u.username ?? "";
          return { value: username, label: username };
        })
        .filter((o) => o.value),
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
    <main className="w-full">
      {/* Page title */}
      <div className="mb-3">
        <h1 className="text-xl  text-foreground">Requested Documents</h1>
      </div>

      {/* Tabs row */}
      <div className="mb-4">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList variant="regular" className="border-t-0 px-0">
            {isMasterAdmin && (
              <TabsTrigger value="all-requests" variant="regular" size="lg" className="gap-2">
                All Requests
                <span className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums transition-colors duration-200",
                  "bg-neutral-alpha-100 text-muted-foreground",
                  "group-data-[state=active]:bg-foreground group-data-[state=active]:text-background",
                )}>
                  {getTabCount("all-requests")}
                </span>
              </TabsTrigger>
            )}
            <TabsTrigger value="requested-to-me" variant="regular" size="lg" className="gap-2">
              Requested to Me
              <span className={cn(
                "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums transition-colors duration-200",
                "bg-neutral-alpha-100 text-muted-foreground",
                "group-data-[state=active]:bg-foreground group-data-[state=active]:text-background",
              )}>
                {getTabCount("requested-to-me")}
              </span>
            </TabsTrigger>
            <TabsTrigger value="my-requests" variant="regular" size="lg" className="gap-2">
              My Requests
              <span className={cn(
                "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums transition-colors duration-200",
                "bg-neutral-alpha-100 text-muted-foreground",
                "group-data-[state=active]:bg-foreground group-data-[state=active]:text-background",
              )}>
                {getTabCount("my-requests")}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
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
        {!displayLoading && displayDocuments.length === 0 ? (
          <div className="py-16 h-[calc(60vh-200px)] flex items-center justify-center">
            <ListNoResults
              title="No requested documents"
              description="Requested documents will appear here."
              onClearFilters={hasActiveFilters ? clearFilters : undefined}
            />
          </div>
        ) : (
          <div className="w-full">
            <Table
              isLoading={displayLoading}
              loadingRowsCount={8}
              loadingRow={<TableLoadingRow />}
            >
              <TableHeader>
                <TableRow>
                  {REQUESTED_DOCS_TABLE_COLUMNS.map((col) => (
                    <TableHead key={col.label} className={col.headerClassName}>
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              {!displayLoading && (
                <TableBody>
                  {displayDocuments.map((doc) => (
                    <RequestedDocTableRow
                      key={doc._id}
                      document={doc}
                      searchQuery={isSearchMode ? debouncedSearch : ""}
                      onView={handleViewDocument}
                    />
                  ))}
                </TableBody>
              )}
              {displayPagination && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={REQUESTED_DOCS_TABLE_COLUMNS.length} className="p-0">
                      <TablePaginationFooter
                        pageSize={limit}
                        currentPageItemsCount={displayDocuments.length}
                        totalCount={displayPagination.totalItems}
                        hasPreviousPage={displayPagination.currentPage > 1}
                        hasNextPage={
                          displayPagination.currentPage <
                          Math.max(1, Math.ceil(displayPagination.totalItems / limit))
                        }
                        onPreviousPage={() => handlePageChange(Math.max(1, displayPagination.currentPage - 1))}
                        onNextPage={() =>
                          handlePageChange(
                            Math.min(
                              Math.max(1, Math.ceil(displayPagination.totalItems / limit)),
                              displayPagination.currentPage + 1,
                            ),
                          )
                        }
                        onPageSizeChange={(size) => {
                          setLimit(size);
                          setCurrentPage(1);
                        }}
                        pageSizeOptions={[10, 20, 50]}
                      />
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
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
