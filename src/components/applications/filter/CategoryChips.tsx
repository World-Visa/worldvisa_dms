"use client";

import { memo, useRef, useState, useEffect } from "react";
import { DocumentCategoryInfo } from "@/types/documents";
import { CategoryButton } from "./CategoryButton";
import { Company } from "@/types/documents";
import { ChevronRight, ChevronLeft } from "lucide-react";
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
  companies: Company[];
  maxCompanies: number;
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

  return (
    <div className="hidden md:block">
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
