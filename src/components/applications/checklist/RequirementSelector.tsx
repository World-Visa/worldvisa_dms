/**
 * Requirement Selector Component
 *
 * This component provides a dropdown to select document requirements
 * (Mandatory, Optional, Not Required) for checklist items.
 */

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DocumentRequirement } from "@/types/checklist";

interface RequirementSelectorProps {
  value: DocumentRequirement;
  onChange: (value: DocumentRequirement) => void;
  disabled?: boolean;
  className?: string;
}

const requirementOptions: {
  value: DocumentRequirement;
  label: string;
  color: string;
}[] = [
  {
    value: "mandatory",
    label: "Mandatory",
    color: "bg-red-100 text-red-800 hover:bg-red-200",
  },
  {
    value: "optional",
    label: "Optional",
    color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  },
  {
    value: "not_required",
    label: "Not Required",
    color: "bg-gray-100 text-gray-600 hover:bg-gray-200",
  },
];

export function RequirementSelector({
  value,
  onChange,
  disabled = false,
  className,
}: RequirementSelectorProps) {
  const selectedOption = requirementOptions.find(
    (option) => option.value === value,
  );

  return (
    <div className={cn("w-full", className)}>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full h-8 text-xs">
          <SelectValue>
            {selectedOption && (
              <Badge
                variant="default"
                className={cn("text-xs py-0.5 px-2", selectedOption.color)}
              >
                {selectedOption.label}
              </Badge>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {requirementOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <Badge
                  variant="default"
                  className={cn("text-xs py-0.5 px-2", option.color)}
                >
                  {option.label}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
