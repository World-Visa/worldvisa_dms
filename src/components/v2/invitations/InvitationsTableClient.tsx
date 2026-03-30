"use client";

import * as React from "react";
import type { ColumnDef, Table as TanStackTable } from "@tanstack/react-table";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/v2/datatable/data-table";
import { DataTablePagination } from "@/components/v2/datatable/data-table-pagination";

type EmptyState = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

interface InvitationsTableClientProps<TData, TValue> {
  table: TanStackTable<TData>;
  columns: ColumnDef<TData, TValue>[];
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onRetry: () => void;
  emptyState: EmptyState;
  skeleton: React.ReactNode;
}

export function InvitationsTableClient<TData, TValue>({
  table,
  columns,
  isLoading,
  isError,
  error,
  onRetry,
  emptyState,
  skeleton,
}: InvitationsTableClientProps<TData, TValue>) {
  const rowCount = table.getRowModel().rows.length;

  return (
    <div className="flex flex-col gap-4">
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load invitations."}{" "}
            <Button
              variant="link"
              className="h-auto p-0 text-destructive"
              onClick={onRetry}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="overflow-hidden rounded-md">
        {isLoading ? (
          skeleton
        ) : rowCount === 0 && !isError ? (
          <Empty className="border-none">
            <EmptyHeader>
              <EmptyMedia variant="icon">{emptyState.icon}</EmptyMedia>
              <EmptyTitle>{emptyState.title}</EmptyTitle>
              <EmptyDescription>{emptyState.description}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <DataTable table={table} columns={columns} />
        )}
      </div>

      {!isLoading && rowCount > 0 && (
        <div className="[&>div>div:first-child]:hidden!">
          <DataTablePagination table={table} />
        </div>
      )}
    </div>
  );
}

