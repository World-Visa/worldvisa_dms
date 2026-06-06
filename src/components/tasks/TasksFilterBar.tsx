"use client";

import { RiLoader4Line } from "react-icons/ri";
import { Button } from "@/components/ui/primitives/button";
import { FacetedFormFilter } from "@/components/ui/faceted-filter/facated-form-filter";
import { TASK_DATE_RANGE_OPTIONS, TASK_STATUS_FILTER_OPTIONS } from "@/lib/constants/tasks";
import type { TaskDateRangePreset, TaskStatus } from "@/types/tasks";

interface TasksFilterBarProps {
  search: string;
  status: TaskStatus | undefined;
  datePreset: TaskDateRangePreset | undefined;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: TaskStatus | undefined) => void;
  onDatePresetChange: (value: TaskDateRangePreset | undefined) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
}

export function TasksFilterBar({
  search,
  status,
  datePreset,
  onSearchChange,
  onStatusChange,
  onDatePresetChange,
  onClearFilters,
  isLoading = false,
}: TasksFilterBarProps) {
  const hasActiveFilters =
    search.trim() !== "" || Boolean(status) || Boolean(datePreset);

  return (
    <div className="flex flex-wrap items-center gap-2 py-2.5">
      <FacetedFormFilter
        type="text"
        size="small"
        title="Search"
        value={search}
        onChange={onSearchChange}
        placeholder="Search tasks…"
      />

      <FacetedFormFilter
        type="single"
        size="small"
        title="Status"
        placeholder="Filter by status…"
        options={TASK_STATUS_FILTER_OPTIONS}
        selected={status ? [status] : []}
        onSelect={(vals) => onStatusChange((vals[0] as TaskStatus) || undefined)}
      />

      <FacetedFormFilter
        type="single"
        size="small"
        title="Date"
        placeholder="Filter by date…"
        options={TASK_DATE_RANGE_OPTIONS}
        selected={datePreset ? [datePreset] : []}
        onSelect={(vals) =>
          onDatePresetChange((vals[0] as TaskDateRangePreset) || undefined)
        }
      />

      {hasActiveFilters && (
        <Button
          variant="secondary"
          mode="ghost"
          size="2xs"
          className="text-xs! font-normal! text-neutral-700"
          onClick={onClearFilters}
        >
          Reset
          {isLoading && <RiLoader4Line className="h-3 w-3 animate-spin text-neutral-400" />}
        </Button>
      )}
    </div>
  );
}
