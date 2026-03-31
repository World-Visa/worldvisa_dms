"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  CheckCircle,
  XCircle,
  ChevronDown,
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
  onDownloadAll: () => void;
  onActivateAccount?: () => void;
  onAddNote?: () => void;
  onEmailHistory?: () => void;
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
  onDownloadAll,
  onActivateAccount,
  onAddNote,
  onEmailHistory,
  userRole,
  qcRequested,
  applicationId,
}: ApplicationDetailsHeaderProps) {
  const router = useRouter();
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
                    ? "Ready for QC"
                    : "Push to QC"}
                </span>
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent variant="default">
            {areAllDocumentsApproved ? (
              <span>
                All mandatory documents are.
                <br />Ready for quality check.
              </span>
            ) : (
              <div className="w-full">
                {validationDetails.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    All mandatory documents must be reviewed or
                    approved.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="font-medium text-sm">The following mandatory documents need attention:</p>
                    <ul className="list-disc pl-4 text-xs space-y-1">
                      {validationDetails.slice(0, 10).map((detail, index) => (
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
              <span className="hidden sm:inline">Actions</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-44 mt-1" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs uppercase text-muted-foreground font-mono font-bold py-1">Account</DropdownMenuLabel>
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
              <DropdownMenuLabel className="text-xs uppercase text-muted-foreground font-mono font-bold py-1">Documents</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push(`/v2/applications/${applicationId}/checklist`)}
                className="cursor-pointer hover:bg-gray-100"
              >
                Edit checklist
              </DropdownMenuItem>
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
              <DropdownMenuLabel className="text-xs uppercase text-muted-foreground font-mono font-bold py-1">Notes</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={onAddNote}
                className="cursor-pointer hover:bg-gray-100"
              >
                Add Note
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs uppercase text-muted-foreground font-mono font-bold">History</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setIsActivitySheetOpen(true)}
                className="cursor-pointer hover:bg-gray-100"
              >
                View Activity Log
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onEmailHistory}
                className="cursor-pointer hover:bg-gray-100"
              >
                Email History
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
