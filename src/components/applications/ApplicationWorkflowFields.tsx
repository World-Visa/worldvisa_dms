"use client";

import * as React from "react";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/primitives/label";
import { Switch } from "@/components/ui/primitives/switch";
import { cn } from "@/lib/utils";
import {
  APPLICATION_STATE_OPTIONS,
  getApplicationRecordType,
  resolveStageOptions,
} from "@/lib/constants/applicationWorkflow";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateApplicationFields } from "@/hooks/useApplicationDetails";
import { usePatchChecklistReminders } from "@/hooks/usePatchChecklistReminders";
import { isMasterAdminRole } from "@/lib/roles";
import type { Application } from "@/types/applications";

type StageListItem = {
  value: string;
  label: string;
};

type StageGroup = { value: string; items: StageListItem[] };

function buildStageGroups(stageLabels: string[]): StageGroup[] {
  return [
    {
      value: "stages",
      items: stageLabels.map((label) => ({ value: label, label })),
    },
  ];
}

function stageFilter(item: StageListItem, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return item.label.toLowerCase().includes(q);
}

/** Keep wheel/touch scroll inside the dropdown instead of the sheet body. */
function containPopoverScroll(event: React.WheelEvent | React.TouchEvent) {
  event.stopPropagation();
}

export interface ApplicationWorkflowFieldsProps {
  application: Application;
  isSpouseApplication?: boolean;
  disabled?: boolean;
  portalContainer?: HTMLElement | null;
  /** From client profile API — not on Zoho application payload */
  checklistRemindersEnabled?: boolean;
  isChecklistRemindersLoading?: boolean;
}

export function ApplicationWorkflowFields({
  application,
  isSpouseApplication = false,
  disabled = false,
  portalContainer,
  checklistRemindersEnabled,
  isChecklistRemindersLoading = false,
}: ApplicationWorkflowFieldsProps) {
  const { user } = useAuth();
  const showApplicationState = isMasterAdminRole(user?.role);
  const recordType = getApplicationRecordType(application, isSpouseApplication);
  const updateFields = useUpdateApplicationFields();
  const patchReminders = usePatchChecklistReminders();

  const stageLabels = React.useMemo(
    () => resolveStageOptions(application.Application_Stage),
    [application.Application_Stage],
  );
  const stageGroups = React.useMemo(
    () => buildStageGroups(stageLabels),
    [stageLabels],
  );

  const itemByStage = React.useMemo(() => {
    const map = new Map<string, StageListItem>();
    for (const item of stageGroups[0]?.items ?? []) {
      map.set(item.value, item);
    }
    return map;
  }, [stageGroups]);

  const selectedStage =
    application.Application_Stage != null && application.Application_Stage !== ""
      ? (itemByStage.get(application.Application_Stage) ?? {
          value: application.Application_Stage,
          label: application.Application_Stage,
        })
      : null;

  const applicationState = application.Application_State ?? "";
  const remindersEnabled = checklistRemindersEnabled === true;

  const isUpdating =
    disabled ||
    updateFields.isPending ||
    patchReminders.isPending ||
    isChecklistRemindersLoading;

  const handleStageChange = (item: StageListItem | null) => {
    const next = item?.value;
    if (!next || next === application.Application_Stage) return;
    updateFields.mutate({
      leadId: application.id,
      recordType,
      fieldsToUpdate: { Stage: next },
    });
  };

  const handleStateChange = (value: string) => {
    if (!value || value === application.Application_State) return;
    updateFields.mutate({
      leadId: application.id,
      recordType,
      fieldsToUpdate: { Application_State: value },
    });
  };

  const handleRemindersChange = (checked: boolean) => {
    if (checked === remindersEnabled) return;
    patchReminders.mutate({
      leadId: application.id,
      enabled: checked,
    });
  };

  return (
    <div className="flex flex-col gap-4 px-3.5 pb-3">
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-neutral-800">Stage</Label>
        <Combobox
          items={stageGroups}
          value={selectedStage ?? undefined}
          onValueChange={(item) => {
            const stage =
              item && typeof item === "object" && "value" in item
                ? (item as StageListItem)
                : null;
            handleStageChange(stage);
          }}
          disabled={isUpdating}
          itemToStringLabel={(item) =>
            item && typeof item === "object" && "label" in item
              ? (item as StageListItem).label
              : ""
          }
          isItemEqualToValue={(a, b) => {
            const av =
              a && typeof a === "object" && "value" in a
                ? (a as StageListItem).value
                : null;
            const bv =
              b && typeof b === "object" && "value" in b
                ? (b as StageListItem).value
                : null;
            return av != null && bv != null && av === bv;
          }}
          filter={stageFilter}
        >
          <ComboboxInput
            placeholder="Search or select stage…"
            disabled={isUpdating}
            className={cn(
              "w-full min-w-0 [&_input]:min-w-0",
              "has-[[data-slot=input-group-control]:focus-visible]:border-input",
              "has-[[data-slot=input-group-control]:focus-visible]:ring-0",
            )}
          />
          <ComboboxContent
            container={portalContainer ?? undefined}
            className="z-100"
            onWheelCapture={containPopoverScroll}
            onTouchMoveCapture={containPopoverScroll}
          >
            <ComboboxEmpty>No stages found.</ComboboxEmpty>
            <ComboboxList
              className="max-h-56 overscroll-y-contain"
              onWheelCapture={containPopoverScroll}
              onTouchMoveCapture={containPopoverScroll}
            >
              {(group) => (
                <ComboboxGroup key={group.value} items={group.items}>
                  <ComboboxCollection>
                    {(item) => (
                      <ComboboxItem
                        key={item.value}
                        value={item}
                        className="min-h-9 py-2"
                      >
                        <span
                          title={item.label}
                          className="min-w-0 flex-1 truncate text-left text-sm"
                        >
                          {item.label}
                        </span>
                      </ComboboxItem>
                    )}
                  </ComboboxCollection>
                </ComboboxGroup>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      {showApplicationState && (
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-neutral-800">
            Application state
          </Label>
          <Select
            value={applicationState || undefined}
            onValueChange={handleStateChange}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {APPLICATION_STATE_OPTIONS.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <Label
            htmlFor="checklist-reminders"
            className="text-sm font-medium text-neutral-800"
          >
            Reminder emails for pending documents
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated checklist reminders sent to the client
          </p>
        </div>
        <Switch
          id="checklist-reminders"
          checked={remindersEnabled}
          onCheckedChange={handleRemindersChange}
          disabled={isUpdating}
        />
      </div>
    </div>
  );
}
