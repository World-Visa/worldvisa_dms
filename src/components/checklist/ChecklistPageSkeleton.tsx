"use client";

import { ChevronRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CHECKLIST_EDITOR_TABLE_COLUMNS,
  CHECKLIST_EDITOR_TABLE_COLUMN_COUNT,
} from "@/lib/constants/checklistEditorTable";
import { cn } from "@/lib/utils";

const BODY_ROWS = 5;
const CATEGORY_TAB_COUNT = 5;

function BreadcrumbChevron() {
  return (
    <ChevronRight
      className="size-3.5 shrink-0 text-muted-foreground"
      aria-hidden
    />
  );
}

export function ChecklistPageSkeleton() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-busy="true"
      aria-label="Loading checklist"
    >
      <div className="flex flex-row items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div
            aria-hidden
            className="flex flex-wrap items-center gap-1.5 text-sm font-medium sm:gap-2.5"
          >
            <Skeleton className="h-4 w-24" />
            <span className="text-muted-foreground">/</span>
            <Skeleton className="h-4 max-w-[min(40vw,16rem)] w-32" />
            <span className="text-muted-foreground">/</span>
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-44 rounded-lg" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-nowrap items-end gap-3 overflow-hidden pb-0">
            {Array.from({ length: CATEGORY_TAB_COUNT }).map((_, i) => (
              <Skeleton
                key={i}
                className="-mb-px h-10 w-28 shrink-0 rounded"
              />
            ))}
          </div>
        </div>

        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-6 border-b border-neutral-alpha-200 border-t border-t-transparent px-3.5">
              <Skeleton className="h-12.5 w-40 rounded-md" />
              <Skeleton className="h-12.5 w-44 rounded-md" />
            </div>
            <Skeleton className="h-9 w-60 shrink-0 rounded-md" />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                {CHECKLIST_EDITOR_TABLE_COLUMNS.map((colDef) => (
                  <TableHead key={colDef.label} className={colDef.headerClassName}>
                    {colDef.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: BODY_ROWS }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {CHECKLIST_EDITOR_TABLE_COLUMNS.map((colDef) => (
                    <TableCell
                      key={colDef.label}
                      className={colDef.cellClassName}
                    >
                      <Skeleton
                        className={cn(colDef.skeletonClassName)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell
                  colSpan={CHECKLIST_EDITOR_TABLE_COLUMN_COUNT}
                  className="p-0"
                >
                  <Skeleton className="h-12 w-full rounded" />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </div>
  );
}
