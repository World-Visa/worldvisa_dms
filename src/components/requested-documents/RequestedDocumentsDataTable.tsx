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
import {
  ArrowUpDown,
  Eye,
  MessageSquare,
  User,
  Clock,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { RequestedDocument } from "@/lib/api/requestedDocuments";
import { StatusBadge } from "./StatusBadge";
import { ClientNameCell } from "./ClientNameCell";
import { RequestedDocumentType } from "@/types/common";
import { HighlightText } from "@/components/ui/HighlightText";

interface RequestedDocumentsDataTableProps {
  documents: RequestedDocument[];
  isLoading: boolean;
  type: RequestedDocumentType;
  totalItems?: number;
  onViewDocument?: (document: RequestedDocument) => void;
  searchQuery?: string;
}

export function RequestedDocumentsDataTable({
  documents,
  isLoading,
  type,
  totalItems = 0,
  onViewDocument,
  searchQuery,
}: RequestedDocumentsDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "requested_review.requested_at", desc: true }, // Default: newest first
  ]);

  const columns = useMemo<ColumnDef<RequestedDocument>[]>(
    () => [
      {
        accessorKey: "document_name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Document
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const doc = row.original;
          const docName = doc.document_name || doc.file_name || "";
          const docCategory = doc.document_category ?? "";
          const hasQuery = (searchQuery?.trim()?.length ?? 0) > 0;
          return (
            <div className="space-y-1 min-w-[200px]">
              <p className="font-semibold text-gray-900">
                {hasQuery ? (
                  <HighlightText
                    text={docName}
                    query={searchQuery!}
                    className="font-semibold text-gray-900"
                  />
                ) : (
                  docName
                )}
              </p>
              {doc.document_category && (
                <p className="text-xs text-gray-500">
                  {hasQuery ? (
                    <HighlightText
                      text={docCategory}
                      query={searchQuery!}
                      className="text-xs text-gray-500"
                    />
                  ) : (
                    docCategory
                  )}
                </p>
              )}
              {doc.isOverdue && (
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Overdue ({doc.daysSinceRequest} days)</span>
                </div>
              )}
            </div>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: "record_id",
        header: "Client Name",
        cell: ({ row }) => (
          <ClientNameCell
            recordId={row.original.record_id}
            clientName={row.original.client_name}
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: "requested_review.requested_by",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Requested By
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 min-w-[120px]">
            <span className="text-sm">
              {row.original.requested_review.requested_by}
            </span>
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "requested_review.requested_to",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Requested To
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 min-w-[120px]">
            <span className="text-sm">
              {row.original.requested_review.requested_to}
            </span>
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "requested_review.status",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <StatusBadge status={row.original.requested_review.status} />
        ),
        enableSorting: true,
      },
      {
        accessorKey: "requested_review.requested_at",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Requested
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const date = new Date(row.original.requested_review.requested_at);
          return (
            <div className="space-y-1 min-w-[130px]">
              <p className="font-medium text-sm">
                {date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {date.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
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
          <div className="flex items-center justify-end gap-2 min-w-[80px]">
            {row.original.requested_review.messages &&
              row.original.requested_review.messages.length > 0 && (
                <div className="flex items-center gap-1 font-bold text-xs text-blue-500">
                  <MessageSquare className="h-3 w-3" />
                  <span>{row.original.requested_review.messages.length}</span>
                </div>
              )}
            <Button
              variant="link"
              onClick={() => onViewDocument?.(row.original)}
              className="p-0"
            >
              <Eye className="h-4 w-4 sm:hidden inline-block" />
              <span className="hidden sm:inline text-gray-900 cursor-pointer hover:text-gray-800">View</span>
            </Button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [onViewDocument, searchQuery],
  );

  const table = useReactTable({
    data: documents || [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true, // Server handles pagination
    pageCount: -1, // Unknown, handled externally
  });

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  // Empty state
  if (!documents || documents.length === 0) {
    const emptyMessages = {
      "requested-to-me": {
        title: "No documents requested to you",
        description: "Documents that need your review will appear here.",
      },
      "my-requests": {
        title: "No review requests sent",
        description: "Documents you request others to review will appear here.",
      },
      "all-requests": {
        title: "No review requests found",
        description: "All document review requests will appear here.",
      },
    };

    const message = emptyMessages[type];

    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-gray-100 p-3 mb-4">
          <FileText className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">
          {message.title}
        </h3>
        <p className="text-sm text-gray-500">{message.description}</p>
      </div>
    );
  }

  const rows = table.getRowModel().rows;

  return (
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
              className="hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onViewDocument?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  onClick={(e) => {
                    // Prevent row click when clicking on action buttons
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
  );
}
