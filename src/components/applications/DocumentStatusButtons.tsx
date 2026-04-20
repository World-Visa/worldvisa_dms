import React, { useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Document } from "@/types/applications";
import { useDocumentStatusUpdate } from "@/hooks/useDocumentStatusUpdate";
import { useDocumentData } from "@/hooks/useDocumentData";
import { useAuth } from "@/hooks/useAuth";
import { RejectDocumentDialog } from "./RejectDocumentDialog";

interface DocumentStatusButtonsProps {
  document: Document;
  applicationId: string;
  disabled?: boolean;
}

const DocumentStatusButtons: React.FC<DocumentStatusButtonsProps> = ({
  document,
  applicationId,
  disabled = false,
}) => {
  const { user } = useAuth();
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const { document: currentDocument } = useDocumentData(document._id);

  const displayDocument = currentDocument || document;

  const statusUpdateMutation = useDocumentStatusUpdate({
    applicationId,
    documentId: document._id,
    onSuccess: () => {
      setUpdatingStatus(null);
    },
    onError: (error) => {
      console.error("Status update failed:", error);
      setUpdatingStatus(null);
    },
  });

  const handleStatusUpdate = (
    status: "approved" | "rejected" | "reviewed",
    rejectMessage?: string,
  ) => {
    if (!user?.username) {
      console.error("User not authenticated");
      return;
    }

    setUpdatingStatus(status);
    statusUpdateMutation.mutate({
      documentId: document._id,
      status,
      changedBy: user.username,
      rejectMessage,
    });
  };

  const handleApprove = () => handleStatusUpdate("approved");
  const handleReject = () => setIsRejectDialogOpen(true);
  const handleReviewed = () => handleStatusUpdate("reviewed");

  const handleRejectConfirm = (reason: string) => {
    handleStatusUpdate("rejected", reason);
    setIsRejectDialogOpen(false);
  };

  const isUpdating = statusUpdateMutation.isPending;
  const currentStatus = displayDocument.status;
  const isAdmin = user?.role === "admin";

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {!isAdmin && (
          <Button
            variant="primary"
            mode="filled"
            size="sm"
            onClick={handleApprove}
            disabled={disabled || isUpdating || currentStatus === "approved"}
            className={`h-8 text-xs font-medium cursor-pointer ${
              currentStatus === "approved"
                ? "bg-success-base text-white"
                : "bg-success-base text-white hover:bg-success-darker"
            }`}
          >
            {updatingStatus === "approved"
              ? "Updating..."
              : currentStatus === "approved"
                ? "Approved"
                : "Approve"}
          </Button>
        )}
        <Button
          variant="error"
          mode="filled"
          size="sm"
          onClick={handleReject}
          disabled={disabled || isUpdating || currentStatus === "rejected"}
          className={`h-8 text-xs font-medium cursor-pointer ${
            currentStatus === "rejected"
              ? "bg-error-base text-white"
              : "bg-error-base text-white hover:bg-error-darker"
          }`}
        >
          {updatingStatus === "rejected"
            ? "Updating..."
            : currentStatus === "rejected"
              ? "Rejected"
              : "Reject"}
        </Button>
        <Button
          variant="primary"
          mode="filled"
          size="sm"
          onClick={handleReviewed}
          disabled={disabled || isUpdating || currentStatus === "reviewed"}
          className="h-8 text-xs font-medium cursor-pointer bg-blue-500 hover:bg-blue-500/90"
        >
          {updatingStatus === "reviewed"
            ? "Updating..."
            : currentStatus === "reviewed"
              ? "Reviewed"
              : "Review"}
        </Button>
      </div>

      <RejectDocumentDialog
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        onConfirm={handleRejectConfirm}
        documentName={displayDocument.file_name}
        isLoading={updatingStatus === "rejected"}
      />
    </>
  );
};

export default DocumentStatusButtons;
