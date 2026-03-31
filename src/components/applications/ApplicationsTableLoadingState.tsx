"use client";

import { memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  APPLICATIONS_TABLE_COLUMNS,
  type ApplicationsTableColumn,
} from "@/lib/constants/applicationsTable";

export interface ApplicationsTableLoadingStateProps {
  /** Column definitions (defaults to shared applications list columns). */
  columns?: readonly ApplicationsTableColumn[];
  rowCount?: number;
  className?: string;
}

export const ApplicationsTableLoadingState = memo(
  function ApplicationsTableLoadingState({
    columns = APPLICATIONS_TABLE_COLUMNS,
    rowCount = 9,
    className,
  }: ApplicationsTableLoadingStateProps) {
    const rows = Array.from({ length: rowCount }, (_, i) => i);

    return (
      <div className={cn("space-y-4", className)}>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col.label}
                    className={col.headerClassName}
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((col) => (
                    <TableCell key={col.label} className={col.cellClassName}>
                      <Skeleton className={col.skeletonClassName} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  },
);
