"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  FileText,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { HighlightText } from "@/components/ui/HighlightText";
import { useRouter } from "next/navigation";
import type { QualityCheckListItem } from "@/lib/api/qualityCheck";

function QCStatusBadge({ status }: { status: string }) {
  if (status === "reviewed") {
    return (
      <Badge variant="default" className="bg-emerald-50 text-emerald-800 border border-emerald-200/90 text-xs px-1.5 py-0.5 flex items-center gap-1 w-fit">
        <Eye className="h-3 w-3" />
        Reviewed
      </Badge>
    );
  }
  if (status === "removed") {
    return (
      <Badge variant="destructive" className="text-xs px-1.5 py-0.5 flex items-center gap-1 w-fit">
        <AlertCircle className="h-3 w-3" />
        Removed
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs px-1.5 py-0.5 flex items-center gap-1 w-fit">
      <Clock className="h-3 w-3" />
      Pending
    </Badge>
  );
}

interface QualityCheckDataTableProps {
  items: QualityCheckListItem[];
  isLoading: boolean;
  totalItems: number;
  currentPage: number;
  limit: number;
  searchQuery?: string;
  onPageChange: (page: number) => void;
  onRowClick: (item: QualityCheckListItem) => void;
}

export function QualityCheckDataTable({
  items,
  isLoading,
  totalItems,
  currentPage,
  limit,
  searchQuery = "",
  onPageChange,
  onRowClick,
}: QualityCheckDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const router = useRouter();

  const handleViewApplication = useCallback(
    (item: QualityCheckListItem, e: React.MouseEvent) => {
      e.stopPropagation();
      const route =
        item.Record_Type === "spouse_skill_assessment"
          ? `/v2/spouse-skill-assessment-applications/${item.id}`
          : `/v2/applications/${item.id}`;
      router.push(route);
    },
    [router],
  );

  const {
    paginationRange,
    totalPages,
    hasNext,
    hasPrev,
    nextPage,
    prevPage,
    startIndex,
    endIndex,
  } = usePagination({ total: totalItems, currentPage, pageSize: limit });

  const handleRowClick = useCallback(
    (item: QualityCheckListItem) => onRowClick(item),
    [onRowClick],
  );

  const columns = useMemo<ColumnDef<QualityCheckListItem>[]>(
    () => [
      {
        accessorKey: "Name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 h-8 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Applicant
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="min-w-[180px]">
            <p className="font-medium text-foreground truncate">
              <HighlightText text={row.original.Name} query={searchQuery} />
            </p>
            <p className="text-xs text-muted-foreground truncate">
              <HighlightText text={row.original.Email} query={searchQuery} />
            </p>
          </div>
        ),
        enableSorting: true,
      },
      {
        id: "qcStatus",
        header: "Status",
        cell: ({ row }) => <QCStatusBadge status={row.original.qcStatus} />,
        enableSorting: false,
      },
      {
        id: "requestedBy",
        header: "Requested By",
        cell: ({ row }) => {
          const by = row.original.qcRequestedBy || row.original.Quality_Check_From;
          const to = row.original.qcRequestedTo;
          return (
            <div className="text-sm">
              <p className="text-foreground">{by || "—"}</p>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "qcRequestedAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 h-8 font-medium hover:bg-gray-100" 
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Requested
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        ),
        cell: ({ row }) => {
          const val = row.original.qcRequestedAt;
          if (!val)
            return <span className="text-sm text-muted-foreground">—</span>;
          return (
            <span className="text-sm text-foreground">
              {new Date(val).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          );
        },
        enableSorting: true,
        sortingFn: "datetime",
      },
      {
        id: "messageCount",
        header: "Messages",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{row.original.messageCount}</span>
          </div>
        ),
        enableSorting: false,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {/* <Button
              variant="ghost"
              size="sm"
              className="h-8 text-muted-foreground hover:text-foreground"
              onClick={(e) => handleViewApplication(row.original, e)}
              title="View Application"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button> */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-foreground hover:text-gray-900"
              onClick={(e) => {
                e.stopPropagation();
                handleRowClick(row.original);
              }}
            >
              View
            </Button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [handleRowClick, handleViewApplication, searchQuery],
  );

  const table = useReactTable({
    data: items ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium text-foreground mb-1">
          No applications found
        </h3>
        <p className="text-sm text-muted-foreground">
          Quality check applications will appear here.
        </p>
      </div>
    );
  }

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleRowClick(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    onClick={(e) => {
                      if (cell.column.id === "actions") e.stopPropagation();
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex}–{endIndex} of {totalItems.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => prevPage && onPageChange(prevPage)}
              disabled={!hasPrev}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
            </Button>
            <div className="flex items-center gap-0.5">
              {paginationRange.map((page, index) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 py-1 text-sm text-muted-foreground"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                ),
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => nextPage && onPageChange(nextPage)}
              disabled={!hasNext}
              className="h-8"
            >
              <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
