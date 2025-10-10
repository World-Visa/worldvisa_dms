"use client";

import React, { useEffect, useRef, useCallback, memo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChecklistRequestItem,
  ChecklistRequestsResponse,
} from "@/lib/api/checklistRequests";
import { gsap } from "gsap";
import { Eye, FileText, Loader, Trash } from "lucide-react";
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

interface ChecklistRequestsTableProps {
  requests: ChecklistRequestItem[];
  currentPage: number;
  limit: number;
  isLoading?: boolean;
  refetch: (
    options?: RefetchOptions
  ) => Promise<QueryObserverResult<ChecklistRequestsResponse, Error>>;
}

export const ChecklistRequestsTable = memo(function ChecklistRequestsTable({
  requests,
  currentPage,
  limit,
  isLoading = false,
  refetch,
}: ChecklistRequestsTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter out empty or invalid records
  const validRequests = requests
    ? requests.filter(
        (req) =>
          req.id && req.id.trim() !== "" && req.Checklist_Requested === true
      )
    : [];

  const getSerialNumber = useCallback(
    (index: number) => {
      return (currentPage - 1) * limit + index + 1;
    },
    [currentPage, limit]
  );

  const getRecordTypeBadgeVariant = useCallback((recordType?: string) => {
    switch (recordType) {
      case "spouse_skill_assessment":
        return "default"; // Blue badge for spouse applications
      case "visa_application":
        return "secondary"; // Gray badge for regular visa applications
      default:
        return "outline"; // Default outline badge
    }
  }, []);

  const getRecordTypeDisplayName = useCallback((recordType?: string) => {
    switch (recordType) {
      case "spouse_skill_assessment":
        return "Spouse Assessment";
      case "visa_application":
        return "Visa Application";
      default:
        return recordType || "Unknown";
    }
  }, []);

  const handleRowClick = useCallback(
    (applicationId: string, recordType?: string) => {
      // Route based on Record_Type
      if (recordType === "spouse_skill_assessment") {
        router.push(
          `/admin/spouse-skill-assessment-applications/${applicationId}`
        );
      } else {
        router.push(`/admin/applications/${applicationId}`);
      }
    },
    [router]
  );

  const handleRemoveFromReqChecklist = async (
    e: React.MouseEvent<HTMLButtonElement>,
    reqChecklistId: string,
    recordType: string | undefined
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
  };

  useEffect(() => {
    if (tableRef.current && requests.length > 0) {
      const rows = tableRef.current.querySelectorAll("tbody tr");

      // Set initial state
      gsap.set(rows, { opacity: 0, y: 20 });

      // Animate rows in
      gsap.to(rows, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
      });
    }
  }, [requests, currentPage]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Checklist Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Checklist Requests
          <Badge variant="secondary" className="ml-2">
            {validRequests.length} request
            {validRequests.length !== 1 ? "s" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={tableRef}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">S.No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Record Type</TableHead>
                <TableHead>Handled By</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validRequests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-gray-400" />
                      <p>No checklist requests found</p>
                      <p className="text-sm text-gray-500">
                        Applications that request checklists will appear here
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                validRequests.map((request, index) => (
                  <TableRow
                    key={request.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() =>
                      handleRowClick(request.id, request.Record_Type)
                    }
                  >
                    <TableCell className="font-medium">
                      {getSerialNumber(index)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {request.Name}
                    </TableCell>
                    <TableCell>{request.Email}</TableCell>
                    <TableCell>{request.Phone}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getRecordTypeBadgeVariant(request.Record_Type)}
                        className="text-xs"
                      >
                        {getRecordTypeDisplayName(request.Record_Type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {request.Application_Handled_By || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-[8px]">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(request.id, request.Record_Type);
                          }}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <div onClick={(e) => e.stopPropagation()}>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent
                              onClick={(e) => e.stopPropagation()}
                            >
                              <AlertDialogTitle>
                                Are you sure you want to Delete this checklist
                                request?
                              </AlertDialogTitle>
                              <AlertDialogFooter>
                                <AlertDialogCancel
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  disabled={isDeleting}
                                  onClick={(e) =>
                                    handleRemoveFromReqChecklist(
                                      e,
                                      request.id,
                                      request.Record_Type
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
});
