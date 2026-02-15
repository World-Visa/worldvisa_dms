"use client";

import React, { memo } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { DocumentCategoryInfo } from "@/types/documents";
import { formatDateRange, formatDate } from "@/utils/dateFormat";
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
  documents,
  count: countProp,
  disabled = false,
}: CategoryButtonProps) {
  const count = countProp ?? category.count;
  // Check if this is a company-specific chip (contains "Company Documents" but not the generic one)
  const isCompanyChip =
    category.label.includes("Company Documents") &&
    category.label !== "Company Documents" &&
    (onRemoveCompany || onRemoveCompanyWithCheck);

  // Extract company name from the category label (this will be lowercase for matching)
  const companyName = isCompanyChip
    ? category.label.replace(" Company Documents", "")
    : null;
  // The company category is the full label (e.g., "Oracle Company Documents")
  const companyCategory = isCompanyChip ? category.label : null;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent category selection
    if (!companyName || !companyCategory) return;

    // Use the new handler with document check if available, otherwise fall back to old handler
    if (onRemoveCompanyWithCheck) {
      onRemoveCompanyWithCheck(companyName, companyCategory);
    } else if (onRemoveCompany) {
      onRemoveCompany(companyName);
    }
  };

  const selected = selectedCategory === category.id;
  const labelWithCount =
    count != null ? `${category.label} (${count})` : category.label;

  return (
    <div className="relative group">
      <button
        key={category.id}
        disabled={disabled}
        className={cn(
          "relative inline-flex flex-col items-center gap-0.5 px-2 py-1.5 min-w-0 transition-all duration-200 ease-in-out",
          "focus:outline-none focus:ring-0",
          disabled && "cursor-not-allowed opacity-50",
          !disabled && "cursor-pointer hover:opacity-80",
          selected
            ? "font-bold text-black dark:text-white"
            : "font-medium text-gray-400 dark:text-gray-500",
        )}
        onClick={() => !disabled && onCategoryChange(category.id)}
      >
        <span
          className={cn(
            "inline-flex items-center gap-2 whitespace-nowrap",
            selected && "border-b-2 border-black dark:border-white pb-0.5",
          )}
        >
          {labelWithCount}
          {category.isCurrentEmployment && (
            <Badge
              variant="secondary"
              className="bg-green-500 hover:bg-green-600 text-white text-xs px-1.5 py-0.5"
            >
              Current
            </Badge>
          )}
        </span>
        {/* {category.fromDate && (
          <div
            className={cn(
              'text-[10px] font-normal',
              selected ? 'text-black/70 dark:text-white/70' : 'text-gray-400 dark:text-gray-500'
            )}
          >
            {category.isCurrentEmployment
              ? `Since ${formatDate(category.fromDate)} - Present`
              : category.toDate
                ? formatDateRange(category.fromDate, category.toDate)
                : `From ${formatDate(category.fromDate)}`}
          </div>
        )} */}
      </button>

      {/* Delete button for company chips */}
      {isCompanyChip && (
        <button
          onClick={handleDeleteClick}
          className={cn(
            "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200",
            "bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1",
            "opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100",
          )}
          title={`Remove ${companyName}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
});
