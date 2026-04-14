"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Loader2,
  FileText,
  Users,
  AlertCircle,
} from "lucide-react";
import { Document } from "@/types/applications";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { sendForReview } from "@/lib/api/reviewRequest";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { showErrorToast, showSuccessToast, showWarningToast } from "../ui/primitives/sonner-helpers";

interface SendDocumentModalProps {
  documents: Document[];
  selectedDocument: Document;
  onSend?: (
    documentIds: string[],
    notes: string,
    sendToUsers: string[],
  ) => void;
  applicationId?: string;
}

export function SendDocumentModal({
  selectedDocument,
  onSend,
}: SendDocumentModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    data: adminUsers,
    isLoading: isLoadingAdmins,
    error: adminError,
  } = useAdminUsers();

  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  const adminOptions: MultiSelectOption[] = useMemo(() => {
    if (!adminUsers || !user?.role) return [];

    const getRolePermissions = (userRole: string) => {
      switch (userRole) {
        case "admin":
          return ["team_leader"];
        case "team_leader":
          return ["master_admin", "supervisor", "admin"];
        case "master_admin":
          return ["team_leader", "supervisor", "admin", "master_admin"];
        case "supervisor":
          return ["team_leader", "master_admin", "admin", "supervisor"];
        default:
          return [];
      }
    };

    const allowedRoles = getRolePermissions(user.role);

    return adminUsers
      .filter(
        (admin) =>
          allowedRoles.includes(admin.role) &&
          admin.username !== user.username &&
          (admin.username ?? admin.full_name),
      )
      .map((admin) => ({
        value: admin.username ?? admin.full_name ?? "",
        label: admin.username ?? admin.full_name ?? "",
        role: admin.role,
      }));
  }, [adminUsers, user?.role, user?.username]);

  const invalidateReviewCaches = () => {
    const keys = [
      ["requested-documents-to-me"],
      ["my-requested-documents"],
      ["all-requested-documents"],
      ["application-documents"],
      ["application-documents-paginated"],
      ["application-details"],
    ];
    for (const key of keys) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  };

  const handleSend = async () => {
    if (!user?.username) {
      showErrorToast("You must be logged in to send review requests.");
      return;
    }
    if (selectedAdmins.length === 0) {
      showWarningToast("Please select at least one admin to send the document to.");
      return;
    }

    const message =
      notes.trim() || "Please review this document for verification.";
    if (message.length > 500) {
      showWarningToast("Message is too long. Please keep it under 500 characters.");
      return;
    }

    setIsSending(true);
    try {
      await sendForReview(selectedDocument._id, {
        requested_to: [...new Set(selectedAdmins)],
        message,
      });
      invalidateReviewCaches();
      showSuccessToast(
        `Review request sent to ${selectedAdmins.join(", ")}.`,
      );
      setIsOpen(false);
      setNotes("");
      setSelectedAdmins([]);
      onSend?.([selectedDocument._id], notes, selectedAdmins);
    } catch {
      toast.error("Failed to send review requests. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const isFormValid =
    selectedAdmins.length > 0 && !!user?.username && !isSending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2 cursor-pointer h-8 text-xs"
        >
          <Send className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Send for verification</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl border border-border/50 p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-sm font-medium text-foreground">
            Send for Verification
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Document info card */}
          <div className="rounded-xl border border-border/40 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {selectedDocument.file_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Uploaded by {selectedDocument.uploaded_by}
                </p>
              </div>
            </div>
          </div>

          {/* Admin selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <label className="text-xs font-medium text-foreground">
                Send to
              </label>
            </div>

            {!user?.username ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-destructive/5 border border-destructive/15 rounded-xl">
                <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                <span className="text-xs text-destructive">
                  You must be logged in to send review requests.
                </span>
              </div>
            ) : adminError ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-destructive/5 border border-destructive/15 rounded-xl">
                <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                <span className="text-xs text-destructive">
                  Failed to load admin users. Please refresh.
                </span>
              </div>
            ) : adminOptions.length === 0 && !isLoadingAdmins ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 rounded-xl">
                <AlertCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">
                  No admin users available.
                </span>
              </div>
            ) : (
              <MultiSelect
                options={adminOptions}
                value={selectedAdmins}
                onChange={setSelectedAdmins}
                placeholder="Select admins..."
                loading={isLoadingAdmins}
                disabled={isLoadingAdmins || isSending}
                maxSelections={10}
                className="w-full"
              />
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">
              Note (optional)
            </label>
            <Textarea
              placeholder="Add instructions for verification..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSending}
              className="min-h-[80px] max-h-[120px] resize-none rounded-xl border-border/60 bg-muted/30 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-ring/30"
              maxLength={500}
              rows={3}
            />
            {notes.length > 400 && (
              <p className="text-[11px] text-muted-foreground">
                {500 - notes.length} characters remaining
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={isSending}
              className="h-8 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!isFormValid}
              size="sm"
              className={cn(
                "h-8 text-xs gap-2 cursor-pointer",
                "bg-foreground text-background hover:bg-foreground/90",
              )}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  {`Send to ${selectedAdmins.length || 0} admin${selectedAdmins.length !== 1 ? "s" : ""}`}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
