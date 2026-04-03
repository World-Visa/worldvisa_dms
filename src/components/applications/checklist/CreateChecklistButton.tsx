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
        "bg-primary-blue",
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
