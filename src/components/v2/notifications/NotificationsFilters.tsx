"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { NotificationSource } from "@/types/notifications";
import { cn } from "@/lib/utils";

export type StatusFilter = "all" | "unread" | "read";
export type TypeFilter = "all" | NotificationSource;

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "document_review", label: "Document" },
  { value: "requested_reviews", label: "Review" },
  { value: "quality_check", label: "Quality Check" },
  { value: "requested_checklist", label: "Checklist" },
  { value: "general", label: "General" },
];

export interface NotificationsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  typeFilter: TypeFilter;
  onTypeFilterChange: (value: TypeFilter) => void;
  className?: string;
}

export function NotificationsFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  className,
}: NotificationsFiltersProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4",
        className,
      )}
    >
      <Input
        type="search"
        placeholder="Search notifications..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-10 min-w-0 flex-1 sm:max-w-md"
        aria-label="Search notifications"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={statusFilter}
          onValueChange={(v) => onStatusFilterChange(v as StatusFilter)}
        >
          <SelectTrigger size="sm" className="h-10 w-[120px]" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={typeFilter}
          onValueChange={(v) => onTypeFilterChange(v as TypeFilter)}
        >
          <SelectTrigger size="sm" className="h-10 w-[140px]" aria-label="Filter by type">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
