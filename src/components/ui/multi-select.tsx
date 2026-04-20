"use client";

import * as React from "react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
  role?: string;
  icon?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  className?: string;
  maxSelections?: number;
  portalContainer?: HTMLElement | null;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  disabled = false,
  loading = false,
  error,
  className,
  maxSelections,
  portalContainer,
}: MultiSelectProps) {
  const selectedOptions = React.useMemo(
    () => options.filter((o) => value.includes(o.value)),
    [options, value],
  );

  const handleValueChange = (selected: MultiSelectOption[]) => {
    if (maxSelections && selected.length > maxSelections) return;
    onChange(selected.map((o) => o.value));
  };

  return (
    <div className={cn("w-full", className)}>
      <Combobox
        items={options}
        multiple
        value={selectedOptions}
        onValueChange={handleValueChange}
        disabled={disabled || loading}
        itemToStringLabel={(opt) => opt.label}
        isItemEqualToValue={(a, b) => a.value === b.value}
        filter={(opt, inputValue) =>
          opt.label.toLowerCase().includes(inputValue.toLowerCase()) ||
          opt.value.toLowerCase().includes(inputValue.toLowerCase())
        }
      >
        <ComboboxChips>
          <ComboboxValue>
            {selectedOptions.map((opt) => (
              <ComboboxChip key={opt.value}>{opt.label}</ComboboxChip>
            ))}
          </ComboboxValue>
          <ComboboxChipsInput placeholder={loading ? "Loading..." : placeholder} />
        </ComboboxChips>
        <ComboboxContent container={portalContainer ?? undefined}>
          <ComboboxEmpty>No options found.</ComboboxEmpty>
          <ComboboxList>
            {(opt) => (
              <ComboboxItem key={opt.value} value={opt}>
                {opt.label}
                {opt.role && (
                  <span className="ml-auto text-xs text-muted-foreground capitalize">
                    {opt.role.replace("_", " ")}
                  </span>
                )}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
