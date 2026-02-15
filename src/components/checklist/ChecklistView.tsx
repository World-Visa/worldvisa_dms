"use client";

import React, { memo, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChecklistCategoryTabs } from "./ChecklistCategoryTabs";
import { SearchBox } from "@/components/ui/SearchBox";
import { getCategoryBadgeStyle } from "@/lib/checklist/dataProcessing";
import { FileText } from "lucide-react";
import type { Document } from "@/types/applications";
import type { DocumentCategoryInfo } from "@/types/documents";

interface ChecklistViewItem {
  category: string;
  documentType: string;
  requirement?: string;
  description?: string;
}

interface ChecklistViewProps {
  items: ChecklistViewItem[];
  categories: DocumentCategoryInfo[];
  selectedCategory: string;
  searchQuery: string;
  categoryCounts?: Record<string, number>;
  documents?: Document[];
  onCategoryChange: (category: string) => void;
  onSearchChange: (query: string) => void;
  onEdit: () => void;
}

export const ChecklistView = memo(function ChecklistView({
  items,
  categories,
  selectedCategory,
  searchQuery,
  categoryCounts,
  documents,
  onCategoryChange,
  onSearchChange,
  onEdit,
}: ChecklistViewProps) {
  return (
    <div className="space-y-4">
      <ChecklistCategoryTabs
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        categoryCounts={categoryCounts}
        documents={documents}
      />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold">Document Checklist</h2>
          <div className="flex items-center gap-2">
            <SearchBox
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="Search documents..."
              aria-label="Search document checklist"
              className="w-full lg:w-64"
            />
            <Button size="sm" onClick={onEdit}>
              Edit
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">S.No</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead>Document Name</TableHead>
                <TableHead className="hidden md:table-cell">
                  Requirement
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No checklist items</p>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow
                    key={`${item.category}-${item.documentType}-${index}`}
                  >
                    <TableCell className="font-medium w-16">
                      {index + 1}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant="default"
                        className={`text-xs py-1 text-white ${getCategoryBadgeStyle(item.category)}`}
                      >
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm">{item.documentType}</span>
                      </div>
                      {item.description?.trim() && (
                        <p className="text-xs text-muted-foreground mt-1 ml-6 truncate max-w-xs">
                          {item.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant="default"
                        className={
                          item.requirement === "mandatory"
                            ? "bg-red-100 text-red-800 hover:bg-red-200 text-xs"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 text-xs"
                        }
                      >
                        {item.requirement === "mandatory"
                          ? "Mandatory"
                          : "Optional"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
});
