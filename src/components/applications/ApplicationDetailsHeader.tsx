"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addTransitionType, startTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/primitives/dropdown-menu";
import { CheckCircle, XCircle } from "lucide-react";
import type { MandatoryDocumentValidationDetail } from "@/utils/checklistValidation";
import {
  QCActionCard,
  QCActionTriggerButton,
} from "@/components/applications/QCActionCard";
import { ApplicationActivitySheet } from "@/components/applications/ApplicationActivitySheet";
import { ChatButton } from "@/components/applications/ChatButton";
import { ROUTES } from "@/utils/routes";
import { RiFileDownloadLine, RiMailLine, RiMore2Fill, RiStickyNoteLine, RiPhoneLine, RiEditLine, RiFileEditLine, RiPlug2Line, RiPlugFill, RiUser4Line, RiFingerprint2Line } from "react-icons/ri";

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
  onEditAccountDetails?: () => void;
  onAddNote?: () => void;
  onEmailHistory?: () => void;
  onCallLogs?: () => void;
  onStartChat?: () => void;
  onSendReminderEmail?: () => void;
  unreadChatCount?: number;
  userRole?: string;
  qcRequested?: QcRequested | null;
  applicationId: string;
  isSpouseApplication?: boolean;
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
  onEditAccountDetails,
  onAddNote,
  onEmailHistory,
  onCallLogs,
  onStartChat,
  onSendReminderEmail,
  unreadChatCount,
  userRole,
  qcRequested,
  applicationId,
  isSpouseApplication = false,
}: ApplicationDetailsHeaderProps) {
  const router = useRouter();
  const isAdmin = userRole !== "client";
  const [isActivitySheetOpen, setIsActivitySheetOpen] = useState(false);
  const [qcPanelOpen, setQcPanelOpen] = useState(false);
  const qcLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const qcCloseButtonRef = useRef<HTMLButtonElement>(null);
  const QC_PANEL_ID = "qc-action-details-panel";

  const cancelQcPanelClose = useCallback(() => {
    if (qcLeaveTimerRef.current) {
      clearTimeout(qcLeaveTimerRef.current);
      qcLeaveTimerRef.current = null;
    }
  }, []);

  const scheduleQcPanelClose = useCallback(() => {
    cancelQcPanelClose();
    qcLeaveTimerRef.current = setTimeout(() => {
      setQcPanelOpen(false);
      qcLeaveTimerRef.current = null;
    }, 120);
  }, [cancelQcPanelClose]);

  const openQcPanel = useCallback(() => {
    cancelQcPanelClose();
    setQcPanelOpen(true);
  }, [cancelQcPanelClose]);

  useEffect(() => () => cancelQcPanelClose(), [cancelQcPanelClose]);

  const qcBlocked = !areAllDocumentsApproved;

  useEffect(() => {
    if (!qcBlocked) setQcPanelOpen(false);
  }, [qcBlocked]);

  const openQcPanelWhenBlocked = useCallback(() => {
    if (!areAllDocumentsApproved) openQcPanel();
  }, [areAllDocumentsApproved, openQcPanel]);

  const navigateToChecklist = () => {
    startTransition(() => {
      addTransitionType("nav-forward");
      const href = isSpouseApplication
        ? ROUTES.SPOUSE_APPLICATION_CHECKLIST(applicationId)
        : ROUTES.APPLICATION_CHECKLIST(applicationId);
      router.push(href);
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
        <div
          className="relative shrink-0"
          onMouseEnter={openQcPanelWhenBlocked}
          onMouseLeave={scheduleQcPanelClose}
          onFocusCapture={openQcPanelWhenBlocked}
          onBlurCapture={(e) => {
            const next = e.relatedTarget as Node | null;
            if (!next || !e.currentTarget.contains(next)) {
              scheduleQcPanelClose();
            }
          }}
        >
          <QCActionTriggerButton
            id="qc-push-trigger"
            aria-controls={qcBlocked ? QC_PANEL_ID : undefined}
            aria-expanded={qcBlocked && qcPanelOpen}
            blocked={!areAllDocumentsApproved}
            onClick={onPushForQualityCheck}
            className="min-w-0"
          >
            <span className="hidden sm:inline">
              {areAllDocumentsApproved ? "Ready for QC" : "Push to QC"}
            </span>
          </QCActionTriggerButton>

          <AnimatePresence>
            {qcPanelOpen && qcBlocked ? (
              <motion.div
                key="qc-hover-panel"
                id={QC_PANEL_ID}
                role="region"
                aria-label="Quality check document status"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className="absolute top-full right-0 z-50 flex w-[min(100vw-2rem,320px)] mt-2 flex-col bg-[#f7f7f7] border border-[#e5e7eb] rounded-[24px] shadow-lg"
                layout
                style={{
                  background: "#f7f7f7",
                  willChange: "transform",
                  gap: 6,
                  paddingTop: 12,
                  paddingLeft: 4,
                  paddingRight: 4,
                  paddingBottom: 4,
                }}
                onMouseEnter={cancelQcPanelClose}
                onMouseLeave={scheduleQcPanelClose}
              >
                <QCActionCard
                  areAllDocumentsApproved={false}
                  validationDetails={validationDetails}
                  onClose={() => setQcPanelOpen(false)}
                  closeButtonRef={qcCloseButtonRef}
                  onFooterClick={onSendReminderEmail}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      )}

      <ChatButton onClick={onStartChat} unreadCount={unreadChatCount ?? 0} />

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
          <DropdownMenuContent className="w-44 mt-1 rounded-xl" align="end" side="bottom" sideOffset={4}>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-mono font-medium py-1">Account</DropdownMenuLabel>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer font-light text-sm text-neutral-800">
                  <RiUser4Line className="size-4 mr-2 shrink-0" />
                  Profile
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={
                      onActivateAccount ? () => onActivateAccount() : undefined
                    }
                      className="cursor-pointer font-light text-sm text-neutral-800" >Onboarding Details</DropdownMenuItem>
                    <DropdownMenuItem onClick={onEditAccountDetails} className="cursor-pointer font-light text-sm text-neutral-800">
                      Account Details
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuItem
                onClick={() => setIsActivitySheetOpen(true)}
                className="cursor-pointer font-light text-sm text-neutral-800"
              >
                <RiFingerprint2Line className="size-4" />
                <span className="hidden sm:inline">Activity Log</span>
              </DropdownMenuItem>

            </DropdownMenuGroup>

            <DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-mono font-medium py-1">Documents</DropdownMenuLabel>
              <DropdownMenuItem
                className="cursor-pointer font-light text-sm text-neutral-800"
                onSelect={navigateToChecklist}
              >
                <RiFileEditLine className="size-4" />
                <span className="hidden sm:inline">Edit Checklist</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDownloadAll}
                disabled={!areAllDocumentsApproved}
                className="cursor-pointer font-light text-sm text-neutral-800"
              >
                <RiFileDownloadLine className="size-4" />
                <span className="hidden sm:inline">Download Docs</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-mono font-medium py-1">Notes</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={onAddNote}
                className="cursor-pointer font-light text-sm text-neutral-800"
              >
                <RiStickyNoteLine className="size-4" />
                <span className="hidden sm:inline">Add Note</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-mono font-medium">History</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={onCallLogs}
                className="cursor-pointer font-light text-sm text-neutral-800"
              >
                <RiPhoneLine className="size-4" />
                <span className="hidden sm:inline">Call Logs</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onEmailHistory}
                className="cursor-pointer font-light text-sm text-neutral-800"
              >
                <RiMailLine className="size-4" />
                <span className="hidden sm:inline">Email History</span>
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
