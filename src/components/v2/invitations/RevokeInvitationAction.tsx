"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

interface RevokeInvitationActionProps {
  invitationId?: string;
  subject?: string;
  isLoading?: boolean;
  onConfirm: (invitationId: string) => void;
}

export function RevokeInvitationAction({
  invitationId,
  subject,
  isLoading,
  onConfirm,
}: RevokeInvitationActionProps) {
  const [open, setOpen] = React.useState(false);

  if (!invitationId) return null;

  const handleConfirm = () => {
    onConfirm(invitationId);
  };

  const description = subject
    ? `This will cancel the invitation for ${subject}. They won't be able to use the invite link.`
    : "This will cancel the invitation. They won't be able to use the invite link.";

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        disabled={Boolean(isLoading)}
        className="h-8 gap-1.5 px-3 text-xs"
        onClick={() => setOpen(true)}
      >
        {isLoading ? "Revoking…" : "Revoke"}
      </Button>
      <ConfirmationModal
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirm}
        title="Revoke invitation?"
        description={description}
        confirmText="Revoke"
        isLoading={Boolean(isLoading)}
        variant="destructive"
      />
    </>
  );
}

