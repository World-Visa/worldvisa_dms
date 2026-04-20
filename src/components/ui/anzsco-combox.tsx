"use client"

import * as React from "react"

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
} from "@/components/ui/combobox"
import { ANZSCO_CODES } from "@/lib/constants/australianData"
import { cn } from "@/lib/utils"

type AnzscoListItem = {
  value: string
  label: string
  authority: string
}

type AnzscoGroup = {
  value: string
  items: AnzscoListItem[]
}

function buildAnzscoGroups(): AnzscoGroup[] {
  const byAuth = new Map<string, typeof ANZSCO_CODES>()
  for (const row of ANZSCO_CODES) {
    const list = byAuth.get(row.assessing_authority) ?? []
    list.push(row)
    byAuth.set(row.assessing_authority, list)
  }

  return Array.from(byAuth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([authority, rows]) => ({
      value: authority,
      items: rows
        .slice()
        .sort((x, y) => x.anzsco_code.localeCompare(y.anzsco_code))
        .map((row) => ({
          value: row.anzsco_code,
          label: row.name,
          authority: row.assessing_authority,
        })),
    }))
}

const ANZSCO_GROUPS = buildAnzscoGroups()

const EXTRA_GROUP_HEADING = "Other"

function formatAnzscoDisplay(item: AnzscoListItem) {
  return `${item.value} - ${item.label}`
}

export interface AnzscoComboboxProps {
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (anzscoCode: string | null) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  extraItems?: Array<{ value: string; label: string }>
  portalContainer?: HTMLElement | null
}

export function AnzscoCombobox({
  value,
  defaultValue,
  onValueChange,
  disabled,
  placeholder = "Search code, occupation, or assessing authority…",
  className,
  extraItems,
  portalContainer,
}: AnzscoComboboxProps) {
  const mergedGroups = React.useMemo(() => {
    if (!extraItems?.length) return ANZSCO_GROUPS
    const extraGroup: AnzscoGroup = {
      value: EXTRA_GROUP_HEADING,
      items: extraItems.map((e) => ({
        value: e.value,
        label: e.label,
        authority: "Custom",
      })),
    }
    return [extraGroup, ...ANZSCO_GROUPS]
  }, [extraItems])

  const itemByCode = React.useMemo(() => {
    const m = new Map<string, AnzscoListItem>()
    for (const group of mergedGroups) {
      for (const item of group.items) {
        m.set(item.value, item)
      }
    }
    return m
  }, [mergedGroups])

  const selectedFromValue =
    value != null && value !== "" ? (itemByCode.get(value) ?? null) : null
  const defaultItem =
    defaultValue != null && defaultValue !== ""
      ? (itemByCode.get(defaultValue) ?? null)
      : null

  const anzscoFilter = React.useCallback(
    (item: AnzscoListItem, query: string) => {
      const q = query.trim().toLowerCase()
      if (!q) return true
      const haystack =
        `${item.value} ${item.label} ${item.authority}`.toLowerCase()
      return haystack.includes(q)
    },
    [],
  )

  return (
    <div className={cn("w-full min-w-0", className)}>
      <Combobox
        items={mergedGroups}
        value={value !== undefined ? selectedFromValue : undefined}
        defaultValue={
          value === undefined ? defaultItem ?? undefined : undefined
        }
        onValueChange={(item) => {
          const code = item && typeof item === "object" && "value" in item
            ? (item as AnzscoListItem).value
            : null
          onValueChange?.(code)
        }}
        disabled={disabled}
        itemToStringLabel={(item) =>
          item && typeof item === "object" && "value" in item
            ? formatAnzscoDisplay(item as AnzscoListItem)
            : ""
        }
        isItemEqualToValue={(a, b) => {
          const av =
            a && typeof a === "object" && "value" in a
              ? (a as AnzscoListItem).value
              : null
          const bv =
            b && typeof b === "object" && "value" in b
              ? (b as AnzscoListItem).value
              : null
          return av != null && bv != null && av === bv
        }}
        filter={anzscoFilter}
      >
        <ComboboxInput
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full min-w-0 [&_input]:min-w-0 [&_input]:truncate",
            "has-[[data-slot=input-group-control]:focus-visible]:border-input",
            "has-[[data-slot=input-group-control]:focus-visible]:ring-0",
            "has-[[data-slot=input-group-control]:focus-visible]:ring-offset-0",
          )}
        />
        <ComboboxContent container={portalContainer ?? undefined}>
          <ComboboxEmpty>No ANZSCO codes found.</ComboboxEmpty>
          <ComboboxList>
            {(group, index) => (
              <ComboboxGroup key={group.value} items={group.items}>
                <ComboboxLabel
                  title={group.value}
                  className="sticky top-0 z-10 -mx-1 border-b border-border/60 bg-popover px-2 py-1.5"
                >
                  <span className="block max-w-full truncate text-xs font-medium text-foreground">
                    {group.value}
                  </span>
                </ComboboxLabel>
                <ComboboxCollection>
                  {(item) => (
                    <ComboboxItem
                      key={item.value}
                      value={item}
                      className="min-h-9 items-start gap-2 py-2"
                    >
                      <span className="w-15 shrink-0 font-mono text-xs text-muted-foreground">
                        {item.value}
                      </span>
                      <span
                        title={item.label}
                        className="min-w-0 flex-1 truncate text-left text-sm font-normal"
                      >
                        {item.label}
                      </span>
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
                {index < mergedGroups.length - 1 && <ComboboxSeparator />}
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}
