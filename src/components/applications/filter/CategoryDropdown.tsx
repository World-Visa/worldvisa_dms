"use client";

import React, { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentCategoryInfo } from "@/types/documents";
import { Company } from "@/types/documents";
interface CategoryDropdownProps {
  categories: DocumentCategoryInfo[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  disabled: boolean;
  companies: Company[];
  maxCompanies: number;
}

export const CategoryDropdown = memo(function CategoryDropdown({
  categories,
  selectedCategory,
  onCategoryChange,
  disabled,
  companies,
  maxCompanies,
}: CategoryDropdownProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedCategoryInfo = categories.find(
    (cat) => cat.id === selectedCategory,
  );

  const handleCategorySelect = (categoryId: string) => {
    onCategoryChange(categoryId);
    setIsDropdownOpen(false);
  };

  return (
    <div className="md:hidden">
      <div className="flex flex-col gap-3">
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              disabled={disabled}
              className="flex items-center gap-2 px-4 py-3 h-auto w-full justify-between text-left"
            >
              <span className="truncate text-sm">
                {disabled
                  ? "Loading..."
                  : selectedCategoryInfo?.label || "Select Category"}
              </span>
              {disabled ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[calc(100vw-2rem)] max-w-[320px]"
            align="start"
          >
            {categories.map((category) => (
              <DropdownMenuItem
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span>{category.label}</span>
                  {category.count > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                      {category.count}
                    </span>
                  )}
                </div>
                {selectedCategory === category.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});
