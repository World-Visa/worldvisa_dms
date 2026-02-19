"use client";

import { memo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { DocumentCategoryInfo } from "@/types/documents";
import { CategoryButton } from "./CategoryButton";
import { AddCompanyButton } from "./AddCompanyButton";
import { ActionButtons } from "./ActionButtons";
import { Company } from "@/types/documents";
import { ChecklistState } from "@/types/checklist";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Document } from "@/types/applications";

interface CategoryChipsProps {
  categories: DocumentCategoryInfo[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onRemoveCompany?: (companyName: string) => void;
  onRemoveCompanyWithCheck?: (
    companyName: string,
    companyCategory: string,
  ) => void;
  documents?: Document[];
  categoryCounts?: Record<string, number>;
  disabled: boolean;
  // Company and action props
  companies: Company[];
  maxCompanies: number;
  onAddCompany?: () => void;
  checklistState: ChecklistState;
  isClientView: boolean;
  hasCompanyDocuments: boolean;
  onStartCreatingChecklist?: () => void;
  onStartEditingChecklist?: () => void;
  onSaveChecklist?: () => void;
  onCancelChecklist?: () => void;
  isSavingChecklist: boolean;
  checklistActions?: "inline" | "link";
  applicationId?: string;
}

export const CategoryChips = memo(function CategoryChips({
  categories,
  selectedCategory,
  onCategoryChange,
  onRemoveCompany,
  onRemoveCompanyWithCheck,
  documents,
  categoryCounts,
  disabled,
  companies,
  maxCompanies,
  onAddCompany,
  checklistState,
  isClientView,
  hasCompanyDocuments,
  onStartCreatingChecklist,
  onStartEditingChecklist,
  onSaveChecklist,
  onCancelChecklist,
  isSavingChecklist,
  checklistActions = "inline",
  applicationId,
}: CategoryChipsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Check if there's more content to scroll
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      const isAtStart = scrollLeft <= 1; // At or near start
      const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 1; // -1 for rounding errors
      setShowLeftArrow(!isAtStart);
      setShowRightArrow(!isAtEnd);
    }
  };

  // Check scroll position on mount and when content changes
  useEffect(() => {
    // Use timeout to ensure DOM is fully laid out
    const timeoutId = setTimeout(() => {
      checkScrollPosition();
    }, 100);

    // Also check on window resize
    window.addEventListener("resize", checkScrollPosition);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", checkScrollPosition);
    };
  }, [categories, companies]);

  // Handle scroll event
  const handleScroll = () => {
    checkScrollPosition();
  };

  // Handle left arrow click - smooth scroll
  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300; // Fixed scroll amount
      scrollContainerRef.current.scrollBy({
        left: -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Handle right arrow click - smooth scroll
  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300; // Fixed scroll amount
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const useLinkMode =
    checklistActions === "link" && applicationId && !isClientView;
  const hasChecklist = checklistState === "saved";

  return (
    <div className="hidden md:block">
      {/* Action Buttons Row */}
      <div className="flex items-center justify-end gap-2 mb-3">
        {useLinkMode && (
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/v2/applications/${applicationId}/checklist`}>
              {hasChecklist ? "Edit checklist" : "Create checklist"}
            </Link>
          </Button>
        )}
        {!useLinkMode && (
          <ActionButtons
            isClientView={isClientView}
            checklistState={checklistState}
            onStartCreatingChecklist={onStartCreatingChecklist}
            onStartEditingChecklist={onStartEditingChecklist}
            onSaveChecklist={onSaveChecklist}
            onCancelChecklist={onCancelChecklist}
            isSavingChecklist={isSavingChecklist}
          />
        )}
        <AddCompanyButton
          checklistState={checklistState}
          isClientView={isClientView}
          hasCompanyDocuments={hasCompanyDocuments}
          companies={companies}
          maxCompanies={maxCompanies}
          onAddCompany={onAddCompany}
        />
      </div>

      {/* Scrollable underline tabs row */}
      <div className="relative border-b border-gray-200">
        <div
          ref={scrollContainerRef}
          className="flex items-end gap-0 overflow-x-auto scrollbar-hide flex-nowrap"
          onScroll={handleScroll}
        >
          {categories.map((category) => (
            <CategoryButton
              key={category.id}
              category={category}
              selectedCategory={selectedCategory}
              onCategoryChange={onCategoryChange}
              onRemoveCompany={onRemoveCompany}
              onRemoveCompanyWithCheck={onRemoveCompanyWithCheck}
              documents={documents}
              count={categoryCounts?.[category.id] ?? category.count}
              disabled={disabled}
            />
          ))}
        </div>

        {/* Left scroll fade + button */}
        {showLeftArrow && (
          <button
            type="button"
            onClick={handleScrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md hover:bg-gray-50 transition-colors z-10"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
        )}

        {/* Right scroll fade + button */}
        {showRightArrow && (
          <button
            type="button"
            onClick={handleScrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md hover:bg-gray-50 transition-colors z-10"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );
});
