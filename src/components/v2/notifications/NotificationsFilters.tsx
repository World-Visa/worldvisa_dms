"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Notification } from "@/types/notifications";
import { cn } from "@/lib/utils";

export type StatusFilter = "all" | "unread" | "read";
export type TypeFilter = "all" | Notification["category"];

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "applications", label: "Ticket" },
  { value: "messages", label: "Message" },
  { value: "documents", label: "Document" },
  { value: "system", label: "Team" },
  { value: "general", label: "Team" },
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
        className="h-10 flex-1 min-w-0 sm:max-w-md"
        aria-label="Search notifications"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={statusFilter}
          onValueChange={(v) => onStatusFilterChange(v as StatusFilter)}
        >
          <SelectTrigger size="sm" className="w-[120px] h-10" aria-label="Filter by status">
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
          <SelectTrigger size="sm" className="w-[120px] h-10" aria-label="Filter by type">
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
