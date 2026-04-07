"use client";

import { useState } from "react";
import { useJiggle } from "@/hooks/useJiggle";
import { useRouter } from "next/navigation";
import { addTransitionType, startTransition } from "react";
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
} from "@/components/ui/primitives/dropdown-menu";
import {
  CheckCircle,
  XCircle,
  ChevronDown,
} from "lucide-react";
import type { MandatoryDocumentValidationDetail } from "@/utils/checklistValidation";
import { ApplicationActivitySheet } from "@/components/applications/ApplicationActivitySheet";
import { ROUTES } from "@/utils/routes";
import { RiMore2Fill, RiMessage3Line, RiMessage3Fill } from "react-icons/ri";
import { motion, useReducedMotion } from "motion/react";

const SPRING_PRESS = { type: "spring" as const, stiffness: 500, damping: 28 };
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
  onStartChat?: () => void;
  unreadChatCount?: number;
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
  onStartChat,
  unreadChatCount,
  userRole,
  qcRequested,
  applicationId,
}: ApplicationDetailsHeaderProps) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const isAdmin = userRole !== "client";
  const [isActivitySheetOpen, setIsActivitySheetOpen] = useState(false);
  const chatJiggle = useJiggle(unreadChatCount ?? 0);

  const navigateToChecklist = () => {
    startTransition(() => {
      addTransitionType("nav-forward");
      router.push(ROUTES.APPLICATION_CHECKLIST(applicationId));
    });
  };

  return (
    <div className="flex shrink-0 items-center gap-2">
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
                variant={areAllDocumentsApproved ? "default" : "secondary"}
                size="sm"
                onClick={onPushForQualityCheck}
                disabled={!areAllDocumentsApproved}
                className={`flex items-center gap-2 cursor-pointer ${areAllDocumentsApproved
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

      <div className="relative shrink-0">
        <motion.button
          onClick={onStartChat}
          className="relative flex items-center gap-1.5 justify-center overflow-hidden rounded-[8px] outline-none
              focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#c0d5ff]"
          style={{
            padding: 6,
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.153) 6.6667%, rgba(255,255,255,0) 103.33%)," +
              "linear-gradient(90deg, #171717 0%, #171717 100%)",
            boxShadow:
              "0px 0px 0px 0.75px #171717," +
              "inset 0px 1px 2px 0px rgba(255,255,255,0.16)",
          }}
          whileHover={reduced ? {} : { opacity: 0.88 }}
          whileTap={reduced ? {} : { scale: 0.98 }}
          transition={SPRING_PRESS}
        >
          <motion.span
            className="origin-top flex items-center"
            animate={chatJiggle ? { rotate: [0, 15, -15, 11, -11, 7.5, -7.5, 3.75, -3.75, 1.5, 0] } : { rotate: 0 }}
            transition={{ duration: 3, ease: "easeInOut" }}
          >
            <RiMessage3Fill className="size-3.5 text-white" />
          </motion.span>
          <p
            className="font-medium text-xs leading-[20px] tracking-[-0.084px] text-white select-none"
            style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
          >
            Start Chat
          </p>
        </motion.button>

        {(unreadChatCount ?? 0) > 0 && (
          <div className="pointer-events-none absolute -top-1.5 -right-1.5 z-10 flex h-3.5 min-w-[14px] items-center justify-center rounded-full border border-neutral-200 bg-white px-0.5 shadow-sm">
            <span className="text-[9px] font-semibold tabular-nums leading-none text-neutral-800">
              {(unreadChatCount ?? 0) > 99 ? "99+" : unreadChatCount}
            </span>
          </div>
        )}
      </div>

      {isAdmin && (
        <DropdownMenu >
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center rounded-lg gap-1 cursor-pointer outline-none focus-visible:ring-0"
            >
              <span className="hidden sm:inline">Actions</span>
              <RiMore2Fill className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-44 mt-1" align="end" side="bottom" sideOffset={4}>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs uppercase text-muted-foreground font-mono font-bold py-1">Account</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={
                  onActivateAccount ? () => onActivateAccount() : undefined
                }
                className="cursor-pointer hover:bg-gray-100"
              >
                Onboarding Detail
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs uppercase text-muted-foreground font-mono font-bold py-1">Documents</DropdownMenuLabel>
              <DropdownMenuItem
                className="cursor-pointer hover:bg-gray-100"
                onSelect={navigateToChecklist}
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
