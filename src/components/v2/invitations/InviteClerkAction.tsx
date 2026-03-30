"use client";

import * as React from "react";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { cn } from "@/lib/utils";

interface InviteClerkActionProps {
  disabled?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText: string;
  buttonLabel?: string;
  buttonClassName?: string;
}

export function InviteClerkAction({
  disabled,
  isLoading,
  onConfirm,
  title,
  description,
  confirmText,
  buttonLabel = "Invite",
  buttonClassName,
}: InviteClerkActionProps) {
  const [open, setOpen] = React.useState(false);

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <>
      <Button
        variant="default"
        size="sm"
        premium3D
        className={cn("h-7 gap-1.5 text-xs", buttonClassName)}
        onClick={() => setOpen(true)}
        disabled={disabled || isLoading}
      >
        <Mail className="size-3" />
        {buttonLabel}
      </Button>

      <ConfirmationModal
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirm}
        title={title}
        description={description}
        confirmText={confirmText}
        isLoading={Boolean(isLoading)}
        variant="default"
      />
    </>
  );
}

