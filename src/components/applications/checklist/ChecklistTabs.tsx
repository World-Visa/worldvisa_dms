import { memo } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChecklistTab = "current" | "available";

interface ChecklistTabsProps {
  activeTab: ChecklistTab;
  onTabChange: (tab: ChecklistTab) => void;
  className?: string;
}

export const ChecklistTabs = memo(function ChecklistTabs({
  activeTab,
  onTabChange,
  className,
}: ChecklistTabsProps) {
  const tabs = [
    { id: "current" as const, label: "Current Checklist", icon: FileText },
    { id: "available" as const, label: "Available Documents", icon: Plus },
  ];

  return (
    <div className={cn("flex space-x-1 bg-gray-100 p-1 rounded-lg", className)}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <Button
            key={tab.id}
            variant={isActive ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-200",
              "rounded-md",
              isActive
                ? "bg-white text-gray-900 hover:bg-white/50"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/80",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </Button>
        );
      })}
    </div>
  );
});
