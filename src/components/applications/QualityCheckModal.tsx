"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useQualityCheck } from "@/hooks/useQualityCheck";
import { useAuth } from "@/hooks/useAuth";
import { getQualityCheckDetails } from "@/lib/api/qualityCheck";
import { addQualityCheckMessage } from "@/lib/api/qualityCheckMessages";

interface ExistingQc {
  qcId: string;
  status: "pending" | "reviewed" | "removed";
  requested_at: string;
  requested_by: string;
  requested_to: string;
}

interface QualityCheckModalProps {
  applicationId: string;
  leadId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  recordType?: string;
  existingQc?: ExistingQc | null;
}

function getRoleBadgeClass(role: string): string {
  switch (role) {
    case "master_admin":
      return "bg-purple-50 text-purple-700 border-purple-200/70";
    case "team_leader":
      return "bg-blue-50 text-blue-700 border-blue-200/70";
    case "supervisor":
      return "bg-amber-50 text-amber-700 border-amber-200/70";
    default:
      return "bg-muted/60 text-muted-foreground border-border/60";
  }
}

function QcStatusBadge({ status }: { status: ExistingQc["status"] }) {
  const styles = {
    reviewed: "text-[10px] font-medium tracking-wide text-emerald-700 bg-emerald-50/90 border border-emerald-200/60 rounded px-1.5 py-0.5",
    removed: "text-[10px] font-medium tracking-wide text-red-700/90 bg-red-50/90 border border-red-200/60 rounded px-1.5 py-0.5",
    pending: "text-[10px] font-medium tracking-wide text-amber-700 bg-amber-50/90 border border-amber-200/60 rounded px-1.5 py-0.5",
  };
  const label = status === "reviewed" ? "Reviewed" : status === "removed" ? "Removed" : "Pending";
  return <span className={styles[status]}>{label}</span>;
}

export function QualityCheckModal({
  applicationId,
  leadId,
  isOpen,
  onOpenChange,
  disabled = false,
  recordType = "default_record_type",
  existingQc,
}: QualityCheckModalProps) {
  const { user } = useAuth();
  const {
    data: adminUsers,
    isLoading: isLoadingAdmins,
    error: adminError,
  } = useAdminUsers();

  const qualityCheckMutation = useQualityCheck({
    onError: (error) => {
      console.error("Quality check failed:", error);
    },
  });

  const [selectedUser, setSelectedUser] = useState(
    existingQc?.requested_to ?? "",
  );
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync pre-fill when existingQc changes (e.g. modal re-opens)
  useEffect(() => {
    if (isOpen) {
      setSelectedUser(existingQc?.requested_to ?? "");
      setNote("");
    }
  }, [isOpen, existingQc?.requested_to]);

  const eligibleUsers = useMemo(() => {
    if (!adminUsers) return [];
    return adminUsers.filter(
      (admin) =>
        ["team_leader", "master_admin", "supervisor"].includes(admin.role) &&
        admin.username !== user?.username,
    );
  }, [adminUsers, user?.username]);

  const selectedUserDetails = useMemo(
    () => eligibleUsers.find((u) => u.username === selectedUser),
    [eligibleUsers, selectedUser],
  );

  const isResend = !!existingQc;

  const handleClose = () => {
    if (isSubmitting) return;
    setSelectedUser("");
    setNote("");
    onOpenChange(false);
  };

  const handleSend = async () => {
    if (!selectedUser || !user?.username) return;
    setIsSubmitting(true);

    try {
      await qualityCheckMutation.mutateAsync({
        data: {
          reqUserName: selectedUser,
          leadId,
          recordType,
        },
        page: 1,
        limit: 10,
      });

      const trimmedNote = note.trim();
      if (trimmedNote) {
        try {
          const detailsResponse = await getQualityCheckDetails(leadId);
          const qcId = detailsResponse.data._id;
          await addQualityCheckMessage(qcId, { message: trimmedNote });
        } catch (noteError) {
          console.error("Failed to post QC note as message:", noteError);
        }
      }

      setSelectedUser("");
      setNote("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to send quality check request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSend = !!selectedUser && !isSubmitting && !!user?.username;

  const requestedAtFormatted = existingQc?.requested_at
    ? new Date(existingQc.requested_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      })
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[400px] p-0 flex flex-col overflow-hidden gap-0 rounded-xl border border-border/50 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
        <DialogHeader className="shrink-0 px-5 pt-4 pb-3 border-b border-border/40">
          <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
            {isResend ? "Re-send Quality Check" : "Quality Check"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 max-h-[50vh]">
          <div className="px-5 py-4 space-y-4">
            {isResend && existingQc && (
              <div className="rounded-md border border-border/40 bg-muted/30 px-3 py-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Current request</span>
                  <QcStatusBadge status={existingQc.status} />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <span className="text-muted-foreground">By </span>
                    <span className="font-medium text-foreground">{existingQc.requested_by}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">To </span>
                    <span className="font-medium text-foreground">{existingQc.requested_to}</span>
                  </div>
                  {requestedAtFormatted && (
                    <div className="col-span-2 text-muted-foreground">
                      {requestedAtFormatted}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Reviewer <span className="text-destructive">*</span>
              </Label>

              {!user?.username ? (
                <p className="text-xs text-destructive rounded-md bg-destructive/5 border border-destructive/20 px-3 py-2">
                  Sign in to send quality check requests.
                </p>
              ) : adminError ? (
                <p className="text-xs text-destructive rounded-md bg-destructive/5 border border-destructive/20 px-3 py-2">
                  Could not load reviewers. Refresh and try again.
                </p>
              ) : eligibleUsers.length === 0 && !isLoadingAdmins ? (
                <p className="text-xs text-amber-700 rounded-md bg-amber-50/80 border border-amber-200/60 px-3 py-2">
                  No eligible reviewers available.
                </p>
              ) : (
                <Select
                  value={selectedUser}
                  onValueChange={setSelectedUser}
                  disabled={isLoadingAdmins || isSubmitting}
                >
                  <SelectTrigger className="h-9 text-sm border-border/60 rounded-md focus:ring-1 focus:ring-ring/30">
                    <SelectValue
                      placeholder={
                        isLoadingAdmins ? "Loading…" : "Select reviewer…"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleUsers.map((admin) => (
                      <SelectItem key={admin.username} value={admin.username}>
                        <div className="flex items-center gap-2 py-0.5">
                          <span className="font-medium text-sm">
                            {admin.username}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded border capitalize ${getRoleBadgeClass(admin.role)}`}
                          >
                            {admin.role.replace("_", " ")}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* {selectedUserDetails && (
                <p className="text-[11px] text-muted-foreground">
                  → {selectedUserDetails.username}
                  <span
                    className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded border capitalize ${getRoleBadgeClass(selectedUserDetails.role)}`}
                  >
                    {selectedUserDetails.role.replace("_", " ")}
                  </span>
                </p>
              )} */}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Note <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Instructions for reviewer…"
                className="min-h-[72px] resize-none text-sm border-border/60 rounded-md placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-ring/30 py-2"
                disabled={isSubmitting}
                maxLength={2000}
              />
              <div className="flex justify-end">
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {note.length}/2000
                </span>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 px-5 py-3 border-t border-border/40 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!canSend}
            className="min-w-[90px] disabled:opacity-50 bg-primary-blue hover:bg-primary-blue/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Sending…
              </>
            ) : isResend ? (
              "Send again"
            ) : (
              "Send request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
