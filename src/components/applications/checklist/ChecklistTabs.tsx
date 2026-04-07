"use client";

import { memo } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type ChecklistTab = "current" | "available";

interface ChecklistTabsProps {
  activeTab: ChecklistTab;
  onTabChange: (tab: ChecklistTab) => void;
  className?: string;
}

const TABS: { label: string; value: ChecklistTab }[] = [
  { label: "Current Checklist", value: "current" },
  { label: "Available Documents", value: "available" },
];

export const ChecklistTabs = memo(function ChecklistTabs({
  activeTab,
  onTabChange,
  className,
}: ChecklistTabsProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => onTabChange(v as ChecklistTab)}
      className={cn("w-auto shrink-0 px-0!", className)}
    >
      <TabsList
        variant="regular"
        align="start"
        className="w-auto! border-t-transparent py-0!"
      >
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} variant="regular" size="lg">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
});
