"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface StageDocumentsHeaderActionProps {
  isClientView?: boolean;
  label: string;
  onClick: () => void;
  buttonClassName?: string;
}

export function StageDocumentsHeaderAction({
  isClientView = false,
  label,
  onClick,
  buttonClassName,
}: StageDocumentsHeaderActionProps) {
  if (isClientView) {
    return null;
  }

  return (
    <div className="flex justify-end">
      <Button type="button" className={cn(buttonClassName)} onClick={onClick}>
        {label}
      </Button>
    </div>
  );
}

