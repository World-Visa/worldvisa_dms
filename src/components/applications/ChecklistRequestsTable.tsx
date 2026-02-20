"use client";

import React, { useCallback, memo, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChecklistRequestItem,
  ChecklistRequestsResponse,
} from "@/lib/api/checklistRequests";
import { FileText, Loader, Trash } from "lucide-react";
import { updateChecklistRequested } from "@/lib/api/getApplicationById";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";
import { DataTable } from "@/components/v2/datatable/data-table";
import { DataTableColumnHeader } from "@/components/v2/datatable/data-table-column-header";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

interface ChecklistRequestsTableProps {
  requests: ChecklistRequestItem[];
  currentPage: number;
  limit: number;
  isLoading?: boolean;
  refetch: (
    options?: RefetchOptions,
  ) => Promise<QueryObserverResult<ChecklistRequestsResponse, Error>>;
}

function getRecordTypeBadgeVariant(recordType?: string) {
  switch (recordType) {
    case "spouse_skill_assessment":
      return "default";
    case "visa_application":
      return "secondary";
    default:
      return "outline";
  }
}

function getRecordTypeDisplayName(recordType?: string) {
  switch (recordType) {
    case "spouse_skill_assessment":
      return "Spouse Assessment";
    case "visa_application":
      return "Visa Application";
    default:
      return recordType || "Unknown";
  }
}

export const ChecklistRequestsTable = memo(function ChecklistRequestsTable({
  requests,
  currentPage,
  limit,
  isLoading = false,
  refetch,
}: ChecklistRequestsTableProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const validRequests = useMemo(
    () =>
      requests
        ? requests.filter(
          (req) =>
            req.id &&
            req.id.trim() !== "" &&
            req.Checklist_Requested === true,
        )
        : [],
    [requests],
  );

  const getSerialNumber = useCallback(
    (index: number) => (currentPage - 1) * limit + index + 1,
    [currentPage, limit],
  );

  const handleRowClick = useCallback(
    (applicationId: string, recordType?: string) => {
      if (recordType === "spouse_skill_assessment") {
        router.push(
          `/v2/spouse-skill-assessment-applications/${applicationId}`,
        );
      } else {
        router.push(`/v2/applications/${applicationId}`);
      }
    },
    [router],
  );

  const handleRemoveFromReqChecklist = useCallback(
    async (
      e: React.MouseEvent<HTMLButtonElement>,
      reqChecklistId: string,
      recordType: string | undefined,
    ) => {
      e.stopPropagation();
      if (recordType) {
        try {
          setIsDeleting(true);
          await updateChecklistRequested(reqChecklistId, false, recordType);
          refetch();
        } catch (error) {
          console.log("error: ", error);
        } finally {
          setIsDeleting(false);
        }
      }
    },
    [refetch],
  );

  const columns = useMemo<ColumnDef<ChecklistRequestItem>[]>(
    () => [
      {
        id: "sno",
        header: "S.No",
        cell: ({ row }) => (
          <span className="font-medium">
            {getSerialNumber(row.index)}
          </span>
        ),
        size: 80,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "Name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.Name}</span>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "Email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Email" />
        ),
        cell: ({ row }) => row.original.Email,
        enableSorting: false,
      },
      {
        accessorKey: "Phone",
        header: "Phone",
        cell: ({ row }) => row.original.Phone,
        enableSorting: false,
      },
      {
        accessorKey: "Record_Type",
        header: "Record Type",
        cell: ({ row }) => (
          <Badge
            variant={getRecordTypeBadgeVariant(row.original.Record_Type)}
            className="text-xs"
          >
            {getRecordTypeDisplayName(row.original.Record_Type)}
          </Badge>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "Application_Handled_By",
        header: "Handled By",
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {row.original.Application_Handled_By || "N/A"}
          </span>
        ),
        enableSorting: false,
      },
      {
        id: "actions",
        header: () => <span className="text-center w-full block">Actions</span>,
        cell: ({ row }) => (
          <div
            className="flex justify-center gap-[8px]"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="link"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRowClick(row.original.id, row.original.Record_Type);
              }}
              className="flex items-center gap-2 text-gray-900 cursor-pointer"
            >
              View
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-red-600 cursor-pointer"
                >
                  <Trash />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogTitle>
                  Are you sure you want to Delete this checklist request?
                </AlertDialogTitle>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    disabled={isDeleting}
                    onClick={(e) =>
                      handleRemoveFromReqChecklist(
                        e,
                        row.original.id,
                        row.original.Record_Type,
                      )
                    }
                  >
                    {isDeleting ? (
                      <div className="flex items-center gap-[8px]">
                        <Loader className="animate-spin" />
                        <p>Continuing...</p>
                      </div>
                    ) : (
                      "Continue"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [
      getSerialNumber,
      handleRowClick,
      handleRemoveFromReqChecklist,
      isDeleting,
    ],
  );

  const table = useDataTableInstance({
    data: validRequests,
    columns,
    enableRowSelection: false,
    defaultPageSize: limit,
    getRowId: (row) => row.id,
  });

  const handleTableRowClick = useCallback(
    (row: { original: ChecklistRequestItem }) => {
      handleRowClick(row.original.id, row.original.Record_Type);
    },
    [handleRowClick],
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (validRequests.length === 0) {
    return (
      <Card className="border shadow-none bg-white/80">
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
            <FileText className="h-8 w-8 text-gray-400" />
            <p>No checklist requests found</p>
            <p className="text-sm text-gray-500">
              Applications that request checklists will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <DataTable
        table={table}
        columns={columns}
        onRowClick={handleTableRowClick}
      />
    </div>
  );
});
