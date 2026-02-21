"use client";

import { memo, useRef, useState, useEffect } from "react";
import { DocumentCategoryInfo } from "@/types/documents";
import { CategoryButton } from "@/components/applications/filter/CategoryButton";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ChecklistCategoryTabsProps {
  categories: DocumentCategoryInfo[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  type?: "checklist" | "application";
}

export const ChecklistCategoryTabs = memo(function ChecklistCategoryTabs({
  categories,
  selectedCategory,
  onCategoryChange,
  type = "application",
}: ChecklistCategoryTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 1);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    const t = setTimeout(checkScrollPosition, 100);
    window.addEventListener("resize", checkScrollPosition);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", checkScrollPosition);
    };
  }, [categories]);

  const scroll = (delta: number) => {
    scrollContainerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  if (categories.length === 0) return null;

  return (
    <div className="relative border-b border-slate-200 dark:border-slate-700">
      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide flex-nowrap pb-0 items-end"
        onScroll={checkScrollPosition}
      >
        {categories.map((cat) => (
          <CategoryButton
            key={cat.id}
            category={cat}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            disabled={false}
            categoryType={type}
          />
        ))}
      </div>
      {showLeftArrow && (
        <button
          type="button"
          onClick={() => scroll(-300)}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 shadow-lg rounded-full p-2 border border-slate-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors z-10"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
        </button>
      )}
      {showRightArrow && (
        <button
          type="button"
          onClick={() => scroll(300)}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 shadow-lg rounded-full p-2 border border-slate-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors z-10"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5 text-slate-700 dark:text-slate-300" />
        </button>
      )}
    </div>
  );
});
