"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { DocumentCategoryInfo } from "@/types/documents";
import { ChecklistCategory } from "@/types/checklist";

interface ClientDocumentCategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  checklistCategories?: ChecklistCategory[];
  hasChecklist?: boolean;
  submittedDocumentsCount?: number;
}

export function ClientDocumentCategoryFilter({
  selectedCategory,
  onCategoryChange,
  checklistCategories = [],
  hasChecklist = false,
  submittedDocumentsCount = 0,
}: ClientDocumentCategoryFilterProps) {
  const getCategoriesForState = (): DocumentCategoryInfo[] => {
    if (!hasChecklist || checklistCategories.length === 0) {
      return [
        {
          id: "submitted",
          label: "Submitted Documents",
          count: submittedDocumentsCount,
        },
      ];
    }

    return [
      {
        id: "submitted",
        label: "Submitted Documents",
        count: submittedDocumentsCount,
      },
      ...checklistCategories.map((cat) => ({
        id: cat.id,
        label: cat.label,
        count: cat.count,
      })),
    ];
  };

  const categories = getCategoriesForState();

  return (
    <div className="relative border-b border-gray-200">
      <div className="flex items-end gap-0 overflow-x-auto scrollbar-hide flex-nowrap">
        {categories.map((category) => {
          const selected = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "relative inline-flex items-center gap-2 px-3 py-2.5 text-sm transition-all duration-150 focus:outline-none whitespace-nowrap shrink-0",
                "-mb-px border-b-2",
                selected
                  ? "border-gray-900 text-gray-900 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium",
              )}
            >
              {category.label}
              {category.count != null && (
                <span
                  className={cn(
                    "tabular-nums text-xs font-medium transition-colors",
                    selected ? "text-gray-700" : "text-gray-400",
                  )}
                >
                  {category.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
