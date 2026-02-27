"use client";
"use no memo";

import { DataTable } from "@/components/v2/datatable/data-table";
import { DataTablePagination } from "@/components/v2/datatable/data-table-pagination";
import { DataTableViewOptions } from "@/components/v2/datatable/data-table-view-options";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { RecentApplication } from "@/types/dashboard";

import { applicationColumns } from "./columns.application";

interface RecentApplicationsTableProps {
  data?: RecentApplication[];
  isLoading?: boolean;
}

export function RecentApplicationsTable({ data = [], isLoading }: RecentApplicationsTableProps) {
  const table = useDataTableInstance({
    data,
    columns: applicationColumns,
    getRowId: (row) => row.id.toString(),
  });

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs">
      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
          <CardDescription>Latest visa applications submitted across all stages.</CardDescription>
          <CardAction>
            <DataTableViewOptions table={table} />
          </CardAction>
        </CardHeader>
        <CardContent className="flex size-full flex-col gap-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows have no stable id
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-md border">
                <DataTable table={table} columns={applicationColumns} />
              </div>
              {data.length > 10 && <DataTablePagination table={table} />}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
