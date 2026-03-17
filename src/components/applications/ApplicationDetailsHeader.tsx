"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
} from "lucide-react";
import type { MandatoryDocumentValidationDetail } from "@/utils/checklistValidation";
import { ApplicationActivitySheet } from "@/components/applications/ApplicationActivitySheet";

interface QcRequested {
  qcId: string;
  status: "pending" | "reviewed" | "removed";
  requested_at: string;
  requested_by: string;
  requested_to: string;
}

interface ApplicationDetailsHeaderProps {
  areAllDocumentsApproved: boolean;
  validationDetails?: MandatoryDocumentValidationDetail[];
  onPushForQualityCheck: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onDownloadAll: () => void;
  onResetPassword: () => void;
  onActivateAccount?: () => void;
  onAddNote?: () => void;
  userRole?: string;
  qcRequested?: QcRequested | null;
  applicationId: string;
}

function QcStatusButton({
  qcRequested,
  onPushForQualityCheck,
}: {
  qcRequested: QcRequested;
  onPushForQualityCheck: () => void;
}) {
  if (qcRequested.status === "reviewed") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onPushForQualityCheck}
        className="flex items-center gap-2 cursor-pointer border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900"
      >
        <CheckCircle className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">QC Reviewed</span>
      </Button>
    );
  }
  if (qcRequested.status === "removed") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onPushForQualityCheck}
        className="flex items-center gap-2 cursor-pointer border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
      >
        <XCircle className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">QC Removed</span>
      </Button>
    );
  }
  // pending
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onPushForQualityCheck}
      className="flex items-center gap-2 text-sm cursor-pointer border-amber-100 bg-amber-50 text-amber-800 hover:bg-amber-100/80 hover:text-amber-900"
    >
      <span className="hidden sm:inline">Quality Check Pending</span>
    </Button>
  );
}

export function ApplicationDetailsHeader({
  areAllDocumentsApproved,
  validationDetails = [],
  onPushForQualityCheck,
  onRefresh,
  isRefreshing,
  onDownloadAll,
  onResetPassword,
  onActivateAccount,
  onAddNote,
  userRole,
  qcRequested,
  applicationId,
}: ApplicationDetailsHeaderProps) {
  const isAdmin = userRole !== "client";
  const [isActivitySheetOpen, setIsActivitySheetOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* Push for Quality Check Button */}
      {qcRequested ? (
        <QcStatusButton
          qcRequested={qcRequested}
          onPushForQualityCheck={onPushForQualityCheck}
        />
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                variant={areAllDocumentsApproved ? "default" : "outline"}
                size="sm"
                onClick={onPushForQualityCheck}
                disabled={!areAllDocumentsApproved}
                className={`flex items-center gap-2 cursor-pointer ${
                  areAllDocumentsApproved
                    ? "bg-slate-900 hover:bg-slate-800 text-white"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <span className="hidden sm:inline">
                  {areAllDocumentsApproved
                    ? "Ready for Quality Check"
                    : "Push to Quality Check"}
                </span>
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-white border border-gray-200 rounded-sm text-foreground">
            {areAllDocumentsApproved ? (
              "All mandatory documents are reviewed or approved. Ready for quality check."
            ) : (
              <div className="space-y-2 w-full">
                <p className="font-semibold text-foreground">
                  Cannot push for quality check:
                </p>
                {validationDetails.length === 0 ? (
                  <p className="text-sm text-foreground">
                    All mandatory documents must be submitted and reviewed or
                    approved.
                  </p>
                ) : (
                  <div className="text-sm space-y-1">
                    <p>The following mandatory documents need attention:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {validationDetails.slice(0, 5).map((detail, index) => (
                        <li key={index}>
                          <span className="font-medium">
                            {detail.documentType}
                          </span>
                          {detail.companyName && (
                            <span className="text-gray-400">
                              {" "}
                              ({detail.companyName})
                            </span>
                          )}
                          {" - "}
                          <span className="text-yellow-400">
                            {detail.status === "missing"
                              ? "Not uploaded"
                              : detail.status}
                          </span>
                        </li>
                      ))}
                      {validationDetails.length > 5 && (
                        <li className="text-gray-400">
                          ...and {validationDetails.length - 5} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      )}

      {isAdmin && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 cursor-pointer"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="hidden sm:inline">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-44 mt-1" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={onResetPassword}
                className="cursor-pointer hover:bg-gray-100"
              >
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={
                  onActivateAccount ? () => onActivateAccount() : undefined
                }
                className="cursor-pointer hover:bg-gray-100"
              >
                Activate Account
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Documents</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={onDownloadAll}
                disabled={!areAllDocumentsApproved}
                className="cursor-pointer hover:bg-gray-100"
              >
                Download Documents
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Notes</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={onAddNote}
                className="cursor-pointer hover:bg-gray-100"
              >
                Add Note
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>History</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setIsActivitySheetOpen(true)}
                className="cursor-pointer hover:bg-gray-100"
              >
                View Activity Log
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <ApplicationActivitySheet
        open={isActivitySheetOpen}
        onOpenChange={setIsActivitySheetOpen}
        applicationId={applicationId}
      />
    </div>
  );
}
