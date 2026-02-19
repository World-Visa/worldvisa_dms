"use client";

import React, { memo } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { DocumentCategoryInfo } from "@/types/documents";
import { Badge } from "@/components/ui/badge";
import type { Document } from "@/types/applications";

interface CategoryButtonProps {
  category: DocumentCategoryInfo;
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  onRemoveCompany?: (companyName: string) => void;
  onRemoveCompanyWithCheck?: (
    companyName: string,
    companyCategory: string,
  ) => void;
  documents?: Document[];
  count?: number;
  disabled?: boolean;
}

export const CategoryButton = memo(function CategoryButton({
  category,
  selectedCategory,
  onCategoryChange,
  onRemoveCompany,
  onRemoveCompanyWithCheck,
  count: countProp,
  disabled = false,
}: CategoryButtonProps) {
  const count = countProp ?? category.count;

  const isCompanyChip =
    category.label.includes("Company Documents") &&
    category.label !== "Company Documents" &&
    (onRemoveCompany || onRemoveCompanyWithCheck);

  const companyName = isCompanyChip
    ? category.label.replace(" Company Documents", "")
    : null;
  const companyCategory = isCompanyChip ? category.label : null;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!companyName || !companyCategory) return;
    if (onRemoveCompanyWithCheck) {
      onRemoveCompanyWithCheck(companyName, companyCategory);
    } else if (onRemoveCompany) {
      onRemoveCompany(companyName);
    }
  };

  const selected = selectedCategory === category.id;

  return (
    <div className="group relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onCategoryChange(category.id)}
        className={cn(
          // Base layout
          "relative inline-flex items-center gap-2 px-3 py-2.5 text-sm transition-all duration-150 focus:outline-none whitespace-nowrap",
          // Underline tab: -mb-px makes the border sit on top of the container's border-b
          "-mb-px border-b-2",
          disabled && "cursor-not-allowed opacity-50",
          !disabled && "cursor-pointer",
          selected
            ? "border-gray-900 text-gray-900 font-semibold"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium",
        )}
      >
        {category.label}

        {/* Document count badge */}
        {count != null && (
          <span
            className={cn(
              "tabular-nums text-xs font-medium transition-colors",
              selected ? "text-gray-700" : "text-gray-400",
            )}
          >
            {count}
          </span>
        )}

        {/* Current employment badge */}
        {category.isCurrentEmployment && (
          <Badge
            variant="secondary"
            className="bg-green-500 text-white hover:bg-green-500 text-[10px] px-1.5 py-0.5 leading-none"
          >
            Current
          </Badge>
        )}
      </button>

      {/* Remove company ×  — appears on hover */}
      {isCompanyChip && (
        <button
          type="button"
          onClick={handleDeleteClick}
          className={cn(
            "absolute -right-1 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full transition-all duration-150",
            "bg-gray-200 text-gray-500 hover:bg-red-500 hover:text-white focus:outline-none",
            "opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100",
          )}
          title={`Remove ${companyName}`}
          aria-label={`Remove ${companyName}`}
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
});
