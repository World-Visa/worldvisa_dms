"use client";

import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Trash2,
  Clock,
  Eye,
  AlertCircle,
  Info,
  Loader2,
  Mail,
  User,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { QualityCheckMessages } from "./QualityCheckMessages";
import {
  useUpdateQualityCheckStatus,
  useRemoveQualityCheck,
  useQualityCheckDetails,
} from "@/hooks/useQualityCheckList";
import type { QualityCheckListItem } from "@/lib/api/qualityCheck";

interface QualityCheckViewSheetProps {
  item: QualityCheckListItem | null;
  isOpen: boolean;
  onClose: () => void;
}

function QCStatusBadge({ status }: { status: string }) {
  if (status === "reviewed") {
    return (
      <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-200/90 font-medium text-xs px-2 py-1 flex items-center gap-1 w-fit">
        <Eye className="h-3 w-3" />
        Reviewed
      </Badge>
    );
  }
  if (status === "removed") {
    return (
      <Badge className="bg-red-50 text-red-700 border border-red-200/90 font-medium text-xs px-2 py-1 flex items-center gap-1 w-fit">
        <AlertCircle className="h-3 w-3" />
        Removed
      </Badge>
    );
  }
  return (
    <Badge className="bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs px-2 py-1 flex items-center gap-1 w-fit">
      <Clock className="h-3 w-3" />
      Pending
    </Badge>
  );
}

export function QualityCheckViewSheet({
  item,
  isOpen,
  onClose,
}: QualityCheckViewSheetProps) {
  const { user } = useAuth();
  const router = useRouter();
  const updateStatusMutation = useUpdateQualityCheckStatus();
  const removeMutation = useRemoveQualityCheck();

  // Fetch details to get qcId if not in list item, or to get requested_to
  const { data: detailsData } = useQualityCheckDetails(item?.id ?? "", {
    enabled: !!item?.id && isOpen,
  });

  const details = detailsData?.data;

  // Determine the qcId for messaging
  const qcId = item?.qcId || details?._id || "";

  const [recordType, setRecordType] = useState("");

  useEffect(() => {
    if (item) {
      // Extract record type from the item or details
      setRecordType(details?.recordType ?? "Visa_Applications");
    }
  }, [item, details]);

  if (!item) return null;

  const handleViewApplication = () => {
    const rt = details?.recordType ?? item.Record_Type ?? "";
    const route =
      rt === "Spouse_Skill_Assessment" || rt === "spouse_skill_assessment"
        ? `/v2/spouse-skill-assessment-applications/${item.id}`
        : `/v2/applications/${item.id}`;
    router.push(route);
    onClose();
  };

  const canAccessMessages =
    user?.role &&
    ["admin", "team_leader", "master_admin", "supervisor"].includes(user.role);

  const isAssignedToMe =
    (item.qcRequestedTo ?? details?.requested_to) === user?.username;
  const canReviewAnyAsRole =
    user?.role === "master_admin" || user?.role === "supervisor";
  const canMarkReviewed =
    item.qcStatus === "pending" && (isAssignedToMe || !!canReviewAnyAsRole);
  const canRemove =
    item.qcStatus !== "removed" &&
    (user?.role === "master_admin" ||
      user?.role === "admin" ||
      user?.role === "supervisor" ||
      (item.qcRequestedBy ?? details?.requested_by) === user?.username);

  const handleMarkReviewed = async () => {
    if (!qcId) return;
    try {
      await updateStatusMutation.mutateAsync({ qcId, status: "reviewed" });
      onClose();
    } catch {
      // handled by mutation
    }
  };

  const handleRemove = async () => {
    if (!item.id) return;
    try {
      await removeMutation.mutateAsync({
        leadId: item.id,
        recordType: recordType || "Visa_Applications",
      });
      onClose();
    } catch {
      // handled by mutation
    }
  };

  const requestedAt = item.qcRequestedAt
    ? new Date(item.qcRequestedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      })
    : "Unknown";

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="inset-3! sm:inset-5! lg:inset-7! h-auto! w-auto! max-w-[1140px]! translate-x-0! translate-y-0! mx-auto rounded-2xl border border-border/50 shadow-2xl p-0">
        <div className="flex flex-col h-full overflow-hidden rounded-2xl">
          {/* Header */}
          <SheetHeader className="px-6 py-3 border-b border-border/40 shrink-0">
            <SheetTitle className="sr-only">Quality Check Review</SheetTitle>
            <div className="flex items-center justify-between gap-4 pr-8">
              <div className="min-w-0">
                <p className="text-lg font-medium text-foreground truncate">
                  {item.Name}
                </p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {item.Email}
                  </span>
                  {(item.qcRequestedBy || item.Quality_Check_From) && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span className="font-medium">By:</span>
                      {item.qcRequestedBy || item.Quality_Check_From}
                    </span>
                  )}
                  {item.qcRequestedTo && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="font-medium">To:</span>
                      {item.qcRequestedTo}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">Requested:</span>
                    {requestedAt}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={handleViewApplication}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer shrink-0"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Application
                </Button>
                <QCStatusBadge status={item.qcStatus} />
              </div>
            </div>
          </SheetHeader>

          {/* Body */}
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* Left panel */}
            <div className="flex-1 flex flex-col min-h-0 order-1">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Migrated banner */}
                {item.migrated && (
                  <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-800">
                      This request was created before messaging was introduced.
                      You can still send new messages using the chat panel.
                    </p>
                  </div>
                )}

                {/* Application details */}
                <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
                  <h3 className="text-sm font-medium text-foreground">
                    Application Details
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Applicant Name
                      </p>
                      <p className="font-medium mt-0.5">{item.Name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium mt-0.5 break-all">
                        {item.Email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        DMS Status
                      </p>
                      <p className="font-medium mt-0.5">
                        {item.DMS_Application_Status || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Requested By</p>
                      <p className="font-medium mt-0.5">
                        {item.qcRequestedBy || details?.requested_by || item.Quality_Check_From || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Assigned To</p>
                      <p className="font-medium mt-0.5">
                        {item.qcRequestedTo || details?.requested_to || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <div className="mt-1">
                        <QCStatusBadge status={item.qcStatus} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Messages
                      </p>
                      <p className="font-medium mt-0.5">
                        {item.messageCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div className="border-t border-border/40 px-6 py-3 shrink-0">
                <div className="flex flex-row gap-2 flex-wrap">
                  {canMarkReviewed && (
                    <Button
                      onClick={handleMarkReviewed}
                      disabled={updateStatusMutation.isPending}
                      variant="default"
                      size="sm"
                    >
                      {updateStatusMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {updateStatusMutation.isPending
                        ? "Marking..."
                        : "Mark as Reviewed"}
                    </Button>
                  )}
                  {canRemove && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemove}
                      disabled={removeMutation.isPending}
                    >
                      {removeMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      {removeMutation.isPending ? "Removing..." : "Remove QC"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Messages sidebar */}
            {canAccessMessages && qcId && (
              <>
                <div className="hidden lg:block w-px bg-border/40 shrink-0" />
                <div className="w-full lg:w-[380px] lg:shrink-0 flex flex-col min-h-0 border-t lg:border-t-0 lg:border-l order-2 bg-muted/20 h-[50vh] lg:h-full">
                  <QualityCheckMessages qcId={qcId} />
                </div>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
