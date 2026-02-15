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
import { CheckCircle, Loader2, Users, AlertCircle, Send } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useQualityCheck } from "@/hooks/useQualityCheck";
import { useAuth } from "@/hooks/useAuth";

interface QualityCheckModalProps {
  applicationId: string;
  leadId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  recordType?: string;
}

export function QualityCheckModal({
  applicationId,
  leadId,
  isOpen,
  onOpenChange,
  disabled = false,
  recordType = "default_record_type",
}: QualityCheckModalProps) {
  const { user } = useAuth();
  const {
    data: adminUsers,
    isLoading: isLoadingAdmins,
    error: adminError,
  } = useAdminUsers();

  // Quality check mutation
  const qualityCheckMutation = useQualityCheck({
    onSuccess: () => {
      // Reset form state
      setSelectedUser("");
      setNotes("");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Quality check failed:", error);
    },
  });

  const [selectedUser, setSelectedUser] = useState("");
  const [notes, setNotes] = useState("");

  // Filter admin users to show only team_leader, master_admin, and supervisor
  // Exclude the currently logged-in user
  const eligibleUsers = useMemo(() => {
    if (!adminUsers) return [];

    return adminUsers.filter(
      (admin) =>
        ["team_leader", "master_admin", "supervisor"].includes(admin.role) &&
        admin.username !== user?.username,
    );
  }, [adminUsers, user?.username]);

  const handleSend = async () => {
    if (!selectedUser || !user?.username) return;

    try {
      // Use the quality check mutation with selected user as reqUserName
      await qualityCheckMutation.mutateAsync({
        data: {
          reqUserName: selectedUser, // Use selected user instead of current user
          leadId: leadId,
          recordType: recordType,
        },
        page: 1,
        limit: 10,
      });
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error("Failed to send quality check request:", error);
    }
  };

  const isSubmitting = qualityCheckMutation.isPending;
  const canSend = selectedUser && !isSubmitting && !!user?.username;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] mx-4 flex flex-col">
        <DialogHeader className="pb-4 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Push for Quality Check
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-y-auto pr-2">
          {/* Application Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-medium text-blue-900">
                Application Ready for Quality Check
              </h3>
            </div>
            <p className="text-sm text-blue-700">
              All submitted documents have been reviewed. This application is
              ready to be pushed for quality check for approval.
            </p>
            <div className="mt-2 text-xs text-blue-600">
              Application ID: {applicationId}
            </div>
          </div>

          {/* User Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              <h3 className="text-sm font-medium text-gray-900">
                Select Quality Check Reviewer *
              </h3>
            </div>

            {!user?.username ? (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  You must be logged in to send quality check requests.
                </div>
              </div>
            ) : adminError ? (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  Failed to load admin users. Please refresh and try again.
                </div>
              </div>
            ) : eligibleUsers.length === 0 && !isLoadingAdmins ? (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                <div className="text-sm text-yellow-700">
                  No eligible reviewers available (Team Leaders, Master Admins,
                  or Supervisors).
                </div>
              </div>
            ) : (
              <Select
                value={selectedUser}
                onValueChange={setSelectedUser}
                disabled={isLoadingAdmins || isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a reviewer..." />
                </SelectTrigger>
                <SelectContent>
                  {eligibleUsers.map((admin) => (
                    <SelectItem key={admin.username} value={admin.username}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{admin.username}</span>
                        <span className="text-xs text-gray-500 capitalize">
                          ({admin.role.replace("_", " ")})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedUser && (
              <div className="text-xs text-gray-500">
                Selected reviewer:{" "}
                <span className="font-medium">{selectedUser}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t bg-white flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className="cursor-pointer bg-green-600 hover:bg-green-700 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending Quality Check Request...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send to {selectedUser || "Reviewer"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
