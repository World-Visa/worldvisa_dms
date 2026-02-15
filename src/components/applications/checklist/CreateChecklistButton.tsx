/**
 * Create Checklist Button Component
 *
 * This component renders a button to initiate checklist creation mode.
 * It's shown in the default state when no checklist exists.
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateChecklistButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function CreateChecklistButton({
  onClick,
  disabled = false,
  className,
}: CreateChecklistButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant="default"
      className={cn(
        "cursor-pointer inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 ease-in-out",
        "w-full md:w-auto",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      <Plus className="h-4 w-4" />
      <span>Create Checklist</span>
    </Button>
  );
}
