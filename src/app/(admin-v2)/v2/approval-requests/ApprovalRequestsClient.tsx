"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";
import { ListNoResults } from "@/components/applications/list-no-results";
import { ApprovalRequestTableRow } from "@/components/approval-requests/ApprovalRequestTableRow";
import {
  useApprovalRequests,
  useApproveRequest,
  useRejectRequest,
  type AdminApprovalRequest,
} from "@/hooks/useAdminApprovalRequests";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const TABS: { value: StatusFilter; label: string }[] = [
  { value: "all",      label: "All" },
  { value: "pending",  label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const COLUMNS = [
  { label: "Client",        skeletonClassName: "h-4 w-36" },
  { label: "From / To",     skeletonClassName: "h-4 w-32" },
  { label: "Field Change",  skeletonClassName: "h-4 w-40" },
  { label: "Reason",        skeletonClassName: "h-4 w-28" },
  { label: "Status",        skeletonClassName: "h-4 w-20" },
  { label: "Date",          skeletonClassName: "h-4 w-24" },
  { label: "Actions",       skeletonClassName: "h-4 w-24" },
];

const PAGE_SIZE = 20;

function SkeletonRow() {
  return (
    <TableRow>
      {COLUMNS.map((col) => (
        <TableCell key={col.label}>
          <Skeleton className={col.skeletonClassName} />
        </TableCell>
      ))}
    </TableRow>
  );
}

export default function ApprovalRequestsClient() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { mutate: approveRequest, isPending: isApproving } = useApproveRequest();
  const { mutate: rejectRequest, isPending: isRejecting } = useRejectRequest();

  const { data, isLoading } = useApprovalRequests({
    status: statusFilter === "all" ? undefined : statusFilter,
    page: currentPage,
    limit: PAGE_SIZE,
  });

  const requests: AdminApprovalRequest[] = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;
  const totalRecords = data?.pagination?.totalRecords ?? requests.length;

  function handleApprove(id: string) {
    approveRequest(id);
  }

  function handleReject(id: string, reason: string) {
    rejectRequest({ requestId: id, rejectionReason: reason });
  }

  function handleTabChange(value: string) {
    setStatusFilter(value as StatusFilter);
    setCurrentPage(1);
  }

  return (
    <div className="flex flex-col gap-4 ">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight text-foreground">Approval Requests</h1>
        </div>
      </div>

      {/* Status tabs */}
      <Tabs value={statusFilter} onValueChange={handleTabChange}>
        <TabsList variant="regular" className="border-t-0 px-0">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} variant="regular" size="lg" className="gap-2">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50">
                {COLUMNS.map((col) => (
                  <TableHead key={col.label} className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 6 }, (_, i) => <SkeletonRow key={i} />)}
            </TableBody>
          </Table>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex min-h-[240px] flex-1 flex-col items-center justify-center py-12">
          <ListNoResults
            title="No requests found"
            description={
              statusFilter === "all"
                ? "No approval requests have been submitted yet."
                : `No ${statusFilter} requests found.`
            }
          />
        </div>
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50">
                {COLUMNS.map((col) => (
                  <TableHead key={col.label} className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <ApprovalRequestTableRow
                  key={request._id}
                  request={request}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  approving={isApproving}
                  rejecting={isRejecting}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <TablePaginationFooter
          pageSize={PAGE_SIZE}
          currentPageItemsCount={requests.length}
          hasPreviousPage={currentPage > 1}
          hasNextPage={currentPage < totalPages}
          onPreviousPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
          onNextPage={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          onPageSizeChange={() => {}}
          totalCount={totalRecords}
        />
      )}
    </div>
  );
}
