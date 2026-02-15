"use client";

import React, { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { ArrowUpDown, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { QualityCheckApplication } from "@/lib/api/qualityCheck";
import { useRouter } from "next/navigation";
import { usePagination } from "@/hooks/usePagination";

interface QualityCheckDataTableProps {
  applications: QualityCheckApplication[];
  isLoading: boolean;
  totalItems: number;
  currentPage: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function QualityCheckDataTable({
  applications,
  isLoading,
  totalItems,
  currentPage,
  limit,
  onPageChange,
}: QualityCheckDataTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);

  const {
    paginationRange,
    totalPages,
    hasNext,
    hasPrev,
    nextPage,
    prevPage,
    startIndex,
    endIndex,
  } = usePagination({
    total: totalItems,
    currentPage,
    pageSize: limit,
  });

  const columns = useMemo<ColumnDef<QualityCheckApplication>[]>(
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
            <p className="font-medium text-neutral-900 truncate">
              {row.original.Name}
            </p>
            <p className="text-xs text-neutral-500 truncate">
              ID: {row.original.id}
            </p>
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "Email",
        header: "Contact",
        cell: ({ row }) => (
          <div className="space-y-1 min-w-[140px]">
            <p className="text-sm text-neutral-600 truncate">
              {row.original.Email}
            </p>
            <p className="text-xs text-neutral-500">{row.original.Phone}</p>
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "Application_Handled_By",
        header: "Handled By",
        cell: ({ row }) => (
          <span className="text-sm text-neutral-700">
            {row.original.Application_Handled_By}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "Quality_Check_From",
        header: "QC From",
        cell: ({ row }) => (
          <span className="text-sm text-neutral-700">
            {row.original.Quality_Check_From}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "Created_Time",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 h-8 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        ),
        cell: ({ row }) => {
          const date = new Date(row.original.Created_Time);
          return (
            <div className="text-sm text-neutral-700">
              {date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          );
        },
        enableSorting: true,
        sortingFn: "datetime",
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-neutral-600 hover:text-neutral-900"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/applications/${row.original.id}`);
            }}
          >
            View
          </Button>
        ),
        enableSorting: false,
      },
    ],
    [router],
  );

  const table = useReactTable({
    data: applications || [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  const handleViewApplication = (id: string) => {
    router.push(`/admin/applications/${id}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-neutral-100 p-3 mb-4">
          <FileText className="h-6 w-6 text-neutral-400" />
        </div>
        <h3 className="text-sm font-medium text-neutral-900 mb-1">
          No applications found
        </h3>
        <p className="text-sm text-neutral-500">
          Quality check applications will appear here.
        </p>
      </div>
    );
  }

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
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
                className="cursor-pointer hover:bg-neutral-50/80 transition-colors"
                onClick={() => handleViewApplication(row.original.id)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    onClick={(e) => {
                      if (cell.column.id === "actions") {
                        e.stopPropagation();
                      }
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
          <p className="text-sm text-neutral-500">
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
                    className="px-2 py-1 text-sm text-neutral-500"
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
